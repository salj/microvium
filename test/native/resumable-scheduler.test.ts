import { assert } from 'chai';
import { addDefaultGlobals } from '../../lib';
import { ResumableCompletion, ResumableScheduler } from '../../lib/resumable-scheduler';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

const source = `
  /** @mvm-ffi (Value, Value, Value) -> Value */
  import { taskSettled } from 'microvium:resumable';
  const hostOperation = vmImport(0);
  const afterHostOperation = vmImport(1);

  /** @mvm-ffi */
  export async function runResumableTask(taskID, entry, input) {
    try {
      taskSettled(taskID, true, await entry(input));
    } catch (error) {
      taskSettled(taskID, false, error);
    }
  }

  /** @mvm-ffi */
  export async function taskEntry(input) {
    for (let i = 0; i < input.preWork; i++) {}
    const value = await hostOperation(input);
    afterHostOperation();
    for (let i = 0; i < input.work; i++) {}
    return value;
  }
`;

function makeSnapshot(defaultFloatWidth: 32 | 64 = 64) {
  const vm = VirtualMachineFriendly.create({}, {
    noLib: true,
    defaultFloatWidth,
    namedImports: {
      'microvium:resumable': {
        taskSettled: (_taskID: any, _success: any, _value: any) => undefined,
      },
    },
  });
  addDefaultGlobals(vm);
  vm.evaluateModule({ sourceText: source });
  return vm.createSnapshot();
}

function makeScheduler(
  snapshot: ReturnType<typeof makeSnapshot>,
  hostOperation: (input: any, completion: ResumableCompletion) => void,
  instructionBudget = 3,
  afterHostOperation: () => void = () => undefined,
) {
  const scheduled: Array<() => void> = [];
  const scheduler = new ResumableScheduler(snapshot, context => ({
    numeric: {
      0: (input: any) => {
        const completion = context.asyncStart();
        hostOperation(input, completion);
        return undefined;
      },
      1: () => {
        afterHostOperation();
        return undefined;
      },
    },
  }), {
    instructionBudget,
    schedule: work => scheduled.push(work),
  });
  return { scheduler, scheduled, entry: scheduler.resolveNamedExport('taskEntry') };
}

function runNext(scheduled: Array<() => void>): void {
  const next = scheduled.shift();
  assert.isFunction(next, 'scheduler should have queued another host turn');
  next!();
}

async function drainTo(scheduler: ResumableScheduler, scheduled: Array<() => void>, task: { state: string; result: Promise<any> }, predicate: () => boolean, limit = 10_000): Promise<void> {
  let count = 0;
  while (!predicate()) {
    if (scheduled.length === 0 && (task.state === 'failed' || task.state === 'cancelled')) {
      const error = await task.result.then(() => undefined, e => e);
      throw error;
    }
    assert.isBelow(++count, limit, 'scheduler did not reach the expected state');
    runNext(scheduled);
    scheduler.garbageCollect();
  }
}

suite('native resumable scheduler', () => {
  test('rejects zero and out-of-range slice budgets', () => {
    const snapshot = makeSnapshot();
    const create = (instructionBudget: number) => new ResumableScheduler(snapshot, () => ({}), {
      instructionBudget,
      schedule: () => undefined,
    });
    assert.throws(() => create(0), /positive signed 32-bit integer/);
    assert.throws(() => create(0x80000000), /positive signed 32-bit integer/);
    assert.throws(() => create(1.5), /positive signed 32-bit integer/);
  });

  test('awaits host work, snapshots nested records, and resumes in budgeted turns', async () => {
    let completion: ResumableCompletion | undefined;
    const { scheduler, scheduled, entry } = makeScheduler(makeSnapshot(32), (_input, token) => {
      completion = token;
    }, 2);

    const input = { work: 80, query: { tags: ['alpha', 'beta'] } };
    const task = scheduler.run(entry, input);
    input.query.tags[0] = 'mutated-after-start';
    assert.equal(task.state, 'queued');
    await drainTo(scheduler, scheduled, task, () => task.state === 'waiting');
    assert.isDefined(completion);

    const hostResult = [{ id: 7, label: 'first' }, { id: 8, label: 'second' }];
    completion!.resolve(hostResult);
    hostResult[0].id = 900;
    await drainTo(scheduler, scheduled, task, () => task.state === 'complete');

    assert.deepEqual(await task.result, [
      { id: 7, label: 'first' },
      { id: 8, label: 'second' },
    ]);
  });

  test('queues immediate host completion instead of reentering the VM', async () => {
    let continuationRan = false;
    let insideHostImport = false;
    const { scheduler, scheduled, entry } = makeScheduler(makeSnapshot(), (_input, completion) => {
      insideHostImport = true;
      completion.resolve({ answer: 42 });
      insideHostImport = false;
    }, 2, () => {
      assert.isFalse(insideHostImport);
      continuationRan = true;
    });
    const task = scheduler.run(entry, { work: 0 });
    await drainTo(scheduler, scheduled, task, () => task.state === 'complete');
    assert.isTrue(continuationRan);
    assert.deepEqual(await task.result, { answer: 42 });
  });

  test('delivers rejection through the VM catch path', async () => {
    let completion: ResumableCompletion | undefined;
    const { scheduler, scheduled, entry } = makeScheduler(makeSnapshot(), (_input, token) => {
      completion = token;
    });
    const task = scheduler.run(entry, { work: 0 });
    const result = task.result.then(
      () => assert.fail('task should reject'),
      error => error,
    );
    await drainTo(scheduler, scheduled, task, () => task.state === 'waiting');
    completion!.reject(new TypeError('host operation failed'));
    await drainTo(scheduler, scheduled, task, () => task.state === 'failed');
    const error = await result;
    assert.instanceOf(error, Error);
    assert.equal(error.name, 'TypeError');
    assert.equal(error.message, 'host operation failed');
  });

  test('preserves non-Error rejection values', async () => {
    const { scheduler, scheduled, entry } = makeScheduler(makeSnapshot(), (_input, completion) => {
      completion.reject('host rejected with a string');
    });
    const task = scheduler.run(entry, { work: 0 });
    const result = task.result.then(
      () => assert.fail('task should reject'),
      error => error,
    );
    await drainTo(scheduler, scheduled, task, () => task.state === 'failed');
    assert.equal(await result, 'host rejected with a string');
  });

  test('serializes turns when another host completion arrives during a yielded turn', async () => {
    const pending: ResumableCompletion[] = [];
    const { scheduler, scheduled, entry } = makeScheduler(makeSnapshot(), (_input, completion) => {
      pending.push(completion);
    }, 1);
    const first = scheduler.run(entry, { work: 80 });
    const second = scheduler.run(entry, { work: 0 });
    await drainTo(scheduler, scheduled, first, () => first.state === 'waiting' && second.state === 'waiting');

    pending[0].resolve('first');
    runNext(scheduled); // Starts the first completion turn; it yields in the loop.
    assert.equal(first.state, 'running');

    pending[1].resolve('second');
    assert.equal(second.state, 'queued');
    while (first.state === 'running') {
      runNext(scheduled);
      scheduler.garbageCollect();
    }
    await drainTo(scheduler, scheduled, first, () => first.state === 'complete' && second.state === 'complete');
    assert.equal(await first.result, 'first');
    assert.equal(await second.result, 'second');
  });

  test('routes out-of-order host completions to their owning tasks', async () => {
    const pending: ResumableCompletion[] = [];
    const { scheduler, scheduled, entry } = makeScheduler(makeSnapshot(), (_input, completion) => {
      pending.push(completion);
    });
    const first = scheduler.run(entry, { work: 0 });
    const second = scheduler.run(entry, { work: 0 });
    await drainTo(scheduler, scheduled, first, () => first.state === 'waiting' && second.state === 'waiting');

    pending[1].resolve('second');
    await drainTo(scheduler, scheduled, second, () => second.state === 'complete');
    assert.equal(first.state, 'waiting');
    pending[0].resolve('first');
    await drainTo(scheduler, scheduled, first, () => first.state === 'complete');
    assert.equal(await second.result, 'second');
    assert.equal(await first.result, 'first');
  });

  test('cancels a waiting task and ignores late and duplicate completions', async () => {
    let completion: ResumableCompletion | undefined;
    const { scheduler, scheduled, entry } = makeScheduler(makeSnapshot(), (_input, token) => {
      completion = token;
    });
    const task = scheduler.run(entry, { work: 0 });
    const result = task.result.then(
      () => assert.fail('cancelled task should reject'),
      error => error,
    );
    await drainTo(scheduler, scheduled, task, () => task.state === 'waiting');
    task.cancel();
    assert.equal(task.state, 'cancelled');
    assert.isTrue(completion!.signal.aborted);
    completion!.resolve('late');
    completion!.reject('duplicate');
    assert.equal((await result).name, 'AbortError');
  });

  test('cancels a budget-yielded turn', async () => {
    const { scheduler, scheduled, entry } = makeScheduler(makeSnapshot(), () => undefined, 1);
    const task = scheduler.run(entry, { preWork: 100, work: 0 });
    const result = task.result.then(
      () => assert.fail('cancelled task should reject'),
      error => error,
    );
    runNext(scheduled);
    assert.equal(task.state, 'running');
    task.cancel();
    assert.equal(task.state, 'cancelled');
    assert.equal((await result).name, 'AbortError');
  });

  test('rejects an inline scheduling hook', async () => {
    const snapshot = makeSnapshot();
    const scheduler = new ResumableScheduler(snapshot, () => ({ numeric: { 0: () => undefined, 1: () => undefined } }), {
      instructionBudget: 10,
      schedule: work => work(),
    });
    const entry = scheduler.resolveNamedExport('taskEntry');
    const task = scheduler.run(entry, undefined);
    const error = await task.result.then(
      () => assert.fail('inline scheduling must fail'),
      e => e,
    );
    assert.match(error.message, /cannot invoke work inline/);
  });

  test('rejects cycles and accessors in host values before entering the VM', async () => {
    const { scheduler, entry } = makeScheduler(makeSnapshot(), () => undefined);
    const cyclic: any = {};
    cyclic.self = cyclic;
    assert.throws(() => scheduler.run(entry, cyclic), /Cyclic host values/);
    const accessor = Object.defineProperty({}, 'value', { enumerable: true, get: () => 1 });
    assert.throws(() => scheduler.run(entry, accessor), /Host accessors/);
    const longKey = { ['x'.repeat(8192)]: 1 };
    assert.throws(() => scheduler.run(entry, longKey), /property name exceeds the marshalling limit/);
  });
});
