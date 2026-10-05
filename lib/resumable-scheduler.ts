/** Node native-binding adapter for resumable VM turns and async tasks. */
import type { HostImportMap, NamedHostImportTable, Snapshot } from '../lib';
import { NativeVMFriendly } from './native-vm-friendly';

export type ResumableTaskState = 'queued' | 'running' | 'waiting' | 'complete' | 'failed' | 'cancelled';

export interface ResumableAbortSignal {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: (event: any) => void, options?: any): void;
  removeEventListener(type: 'abort', listener: (event: any) => void, options?: any): void;
}

export interface ResumableCompletion {
  /** Aborted when the owning task is cancelled. */
  readonly signal: ResumableAbortSignal;
  resolve(value?: any): void;
  reject(error?: any): void;
}

export interface ResumableHostContext {
  /** Must be the first operation in a host import that completes asynchronously. */
  asyncStart(): ResumableCompletion;
}

export interface ResumableHostBindings {
  numeric?: HostImportMap;
  named?: NamedHostImportTable;
}

export interface ResumableSchedulerOptions {
  /** -1 for an unlimited slice, otherwise a positive signed 32-bit instruction count. */
  instructionBudget: number;
  /** Enqueue work for a later host event-loop turn. Must not invoke work inline. */
  schedule(work: () => void): void;
  taskWrapperExport?: string;
}

export class ResumableTaskHandle<T = any> {
  private _state: ResumableTaskState = 'queued';
  private resolveResult!: (value: T) => void;
  private rejectResult!: (error: any) => void;
  readonly result: Promise<T>;

  constructor(private cancelTask: () => void) {
    this.result = new Promise<T>((resolve, reject) => {
      this.resolveResult = resolve;
      this.rejectResult = reject;
    });
  }

  get state(): ResumableTaskState {
    return this._state;
  }

  cancel(): void {
    this.cancelTask();
  }

  /** @internal */
  setState(state: ResumableTaskState): void {
    this._state = state;
  }

  /** @internal */
  resolve(value: T): void {
    this._state = 'complete';
    this.resolveResult(value);
  }

  /** @internal */
  reject(error: any, state: 'failed' | 'cancelled' = 'failed'): void {
    this._state = state;
    this.rejectResult(error);
  }
}

interface TaskRecord {
  id: number;
  generation: number;
  entry: Function;
  input: any;
  handle: ResumableTaskHandle<any>;
  active: boolean;
  settlementQueued: boolean;
  cancelRequested: boolean;
  tokens: Set<CompletionToken>;
}

interface CompletionToken {
  task?: TaskRecord;
  generation: number;
  callback?: Function;
  controller?: AbortControllerLike;
  state: 'pending' | 'queued' | 'delivered' | 'invalid';
}

type WorkItem =
  | { kind: 'start'; task: TaskRecord }
  | { kind: 'completion'; task: TaskRecord; token: CompletionToken; callback: Function; success: boolean; value: any };

interface TaskSettlement {
  taskID: number;
  success: boolean;
  value: any;
}

interface AbortControllerLike {
  readonly signal: ResumableAbortSignal;
  abort(): void;
}

function createAbortController(): AbortControllerLike {
  const NativeAbortController = (globalThis as any).AbortController;
  return typeof NativeAbortController === 'function'
    ? new NativeAbortController()
    : new LocalAbortController();
}

class LocalAbortController implements AbortControllerLike {
  readonly signal = new LocalAbortSignal();

  abort(): void {
    this.signal.abort();
  }
}

class LocalAbortSignal implements ResumableAbortSignal {
  aborted = false;
  private listeners = new Set<(event: any) => void>();

  addEventListener(type: 'abort', listener: (event: any) => void): void {
    if (type === 'abort' && !this.aborted) this.listeners.add(listener);
  }

  removeEventListener(type: 'abort', listener: (event: any) => void): void {
    if (type === 'abort') this.listeners.delete(listener);
  }

  abort(): void {
    if (this.aborted) return;
    this.aborted = true;
    const event = { type: 'abort', target: this, currentTarget: this };
    for (const listener of this.listeners) listener(event);
    this.listeners.clear();
  }
}

/**
 * Drives resumable VM turns through a host scheduler. A VM can have several
 * tasks waiting on host operations, but only one bytecode turn runs at a time.
 */
export class ResumableScheduler {
  private readonly vm: NativeVMFriendly;
  private readonly taskWrapper: Function;
  private readonly instructionBudget: number;
  private readonly schedule: (work: () => void) => void;
  private nextTaskID = 1;
  private tasks = new Map<number, TaskRecord>();
  private queue: WorkItem[] = [];
  private settlements: TaskSettlement[] = [];
  private activeTurn: TaskRecord | undefined;
  private activeTask: TaskRecord | undefined;
  private inVM = false;
  private pumping = false;
  private scheduled = false;

  constructor(
    snapshot: Snapshot,
    hostBindings: (context: ResumableHostContext) => ResumableHostBindings,
    options: ResumableSchedulerOptions,
  ) {
    if (!options || typeof options.schedule !== 'function') throw new TypeError('A host scheduling function is required');
    if (!Number.isInteger(options.instructionBudget)
      || options.instructionBudget < -1
      || options.instructionBudget === 0
      || options.instructionBudget > 0x7FFFFFFF) {
      throw new TypeError('instructionBudget must be -1 or a positive signed 32-bit integer');
    }
    this.instructionBudget = options.instructionBudget;
    this.schedule = options.schedule;

    const hostContext: ResumableHostContext = {
      asyncStart: () => this.startHostOperation(),
    };
    const bindings = hostBindings(hostContext);
    if (!bindings || typeof bindings !== 'object') throw new TypeError('Host binding factory must return an object');

    const namedImports = { ...(bindings.named ?? {}) };
    const resumableImports = { ...(namedImports['microvium:resumable'] ?? {}) };
    if (Object.prototype.hasOwnProperty.call(resumableImports, 'taskSettled')) {
      throw new TypeError('The microvium:resumable:taskSettled import is reserved');
    }
    resumableImports.taskSettled = (taskID: any, success: any, value: any) => {
      this.recordSettlement(taskID, success, value);
      return undefined;
    };
    namedImports['microvium:resumable'] = resumableImports;

    this.vm = new NativeVMFriendly(snapshot, bindings.numeric ?? {}, namedImports);
    this.taskWrapper = this.vm.resolveNamedExportValue(options.taskWrapperExport ?? 'runResumableTask');
  }

  resolveNamedExport(name: string): Function {
    return this.vm.resolveNamedExportValue(name);
  }

  garbageCollect(squeeze: boolean = false): void {
    this.vm.garbageCollect(squeeze);
  }

  run<T = any>(entry: Function, input?: any): ResumableTaskHandle<T> {
    if (this.nextTaskID > Number.MAX_SAFE_INTEGER) throw new Error('Resumable task ID space exhausted');
    const id = this.nextTaskID++;
    const task = {} as TaskRecord;
    const handle = new ResumableTaskHandle<T>(() => this.cancelTask(task));
    Object.assign(task, {
      id,
      generation: 1,
      entry,
      input: this.vm.snapshotHostValue(input),
      handle,
      active: true,
      settlementQueued: false,
      cancelRequested: false,
      tokens: new Set<CompletionToken>(),
    });
    this.tasks.set(id, task);
    this.queue.push({ kind: 'start', task });
    this.requestPump();
    return handle;
  }

  private startHostOperation(): ResumableCompletion {
    if (!this.inVM || !this.activeTask) {
      throw new Error('asyncStart can only be used from a host import running in a scheduled task');
    }
    const task = this.activeTask;
    const controller = createAbortController();
    const token: CompletionToken = {
      task,
      generation: task.generation,
      callback: this.vm.asyncStart(),
      controller,
      state: 'pending',
    };
    task.tokens.add(token);
    return {
      signal: controller.signal,
      resolve: value => this.finishHostOperation(token, true, value),
      reject: error => this.finishHostOperation(token, false, error),
    };
  }

  private finishHostOperation(token: CompletionToken, success: boolean, value: any): void {
    if (token.state !== 'pending') return;
    const task = token.task;
    if (!task || !task.active || token.generation !== task.generation) return;
    token.state = 'queued';
    task.tokens.delete(token);
    const callback = token.callback!;
    token.controller = undefined;
    token.task = undefined;
    token.callback = undefined;

    let copiedValue: any;
    try {
      copiedValue = this.vm.snapshotHostValue(value);
    } catch (error) {
      success = false;
      copiedValue = this.vm.snapshotHostValue(error);
    }

    this.queue.push({ kind: 'completion', task, token, callback, success, value: copiedValue });
    task.handle.setState('queued');
    this.requestPump();
  }

  private recordSettlement(taskIDValue: any, successValue: any, value: any): void {
    if (typeof taskIDValue !== 'string' || !/^[1-9][0-9]*$/.test(taskIDValue) || typeof successValue !== 'boolean') {
      throw new TypeError('Invalid resumable task settlement');
    }
    const taskID = Number(taskIDValue);
    if (!Number.isSafeInteger(taskID) || String(taskID) !== taskIDValue) throw new TypeError('Invalid resumable task settlement');
    const task = this.tasks.get(taskID);
    if (!task || !task.active || task.settlementQueued) return;
    task.settlementQueued = true;
    this.settlements.push({ taskID, success: successValue, value });
  }

  private requestPump(): void {
    if (this.scheduled || this.pumping || this.inVM) return;
    if (!this.activeTurn && this.queue.length === 0) return;
    this.scheduled = true;
    let returned = false;
    let calledInline = false;
    try {
      this.schedule(() => {
        if (!returned) {
          calledInline = true;
          return;
        }
        if (!this.scheduled) return;
        this.scheduled = false;
        this.pump();
      });
    } catch (error) {
      this.scheduled = false;
      this.failAll(error);
      return;
    }
    returned = true;
    if (calledInline) {
      this.scheduled = false;
      this.failAll(new TypeError('schedule(work) must defer work; it cannot invoke work inline'));
    }
  }

  private pump(): void {
    if (this.pumping || this.inVM) return;
    this.pumping = true;
    try {
      if (this.activeTurn) {
        this.resumeTurn(this.activeTurn);
      } else {
        const item = this.queue.shift();
        if (item) this.runWorkItem(item);
      }
      if (!this.activeTurn) this.flushSettlements();
    } finally {
      this.pumping = false;
    }
    this.requestPump();
  }

  private runWorkItem(item: WorkItem): void {
    if (item.kind === 'start') {
      if (!item.task.active) return;
      const task = item.task;
      this.activeTurn = task;
      this.executeTurn(task, () => this.vm.callResumable(
        this.taskWrapper,
        [String(task.id), task.entry, task.input],
        this.instructionBudget,
      ));
      return;
    }

    const token = item.token;
    const task = item.task;
    if (!task.active || token.state !== 'queued' || token.generation !== task.generation) return;
    token.state = 'delivered';
    this.activeTurn = task;
    this.executeTurn(task, () => this.vm.callResumable(
      item.callback,
      [item.success, item.value],
      this.instructionBudget,
    ));
  }

  private resumeTurn(task: TaskRecord): void {
    this.executeTurn(task, () => this.vm.resume(this.instructionBudget));
  }

  private executeTurn(task: TaskRecord, invoke: () => { status: 'yielded' } | { status: 'complete'; value: any }): void {
    this.inVM = true;
    this.activeTask = task;
    task.handle.setState('running');
    let result: { status: 'yielded' } | { status: 'complete'; value: any } | undefined;
    let didThrow = false;
    let error: any;
    try {
      result = invoke();
    } catch (e) {
      didThrow = true;
      error = e;
    } finally {
      this.activeTask = undefined;
      this.inVM = false;
    }

    if (task.cancelRequested) {
      this.finishCancellation(task);
      return;
    }
    if (didThrow) {
      this.activeTurn = undefined;
      this.failTask(task, error);
      return;
    }
    if (result!.status === 'yielded') {
      task.handle.setState('running');
      return;
    }
    this.activeTurn = undefined;
    this.refreshTaskState(task);
  }

  private flushSettlements(): void {
    const pending = this.settlements.splice(0);
    for (const settlement of pending) {
      const task = this.tasks.get(settlement.taskID);
      if (!task || !task.active) continue;
      let value: any;
      try {
        value = this.vm.toHostValue(settlement.value);
      } catch (error) {
        this.failTask(task, error);
        continue;
      }
      if (settlement.success) {
        this.completeTask(task, value);
      } else {
        this.failTask(task, this.toHostError(value));
      }
    }
  }

  private toHostError(value: any): any {
    if (value && typeof value === 'object' && typeof value.name === 'string' && typeof value.message === 'string') {
      const error = new Error(value.message);
      error.name = value.name;
      return error;
    }
    return value;
  }

  private refreshTaskState(task: TaskRecord): void {
    if (!task.active) return;
    if (this.activeTurn === task) {
      task.handle.setState('running');
    } else if (this.queue.some(item => item.task === task)) {
      task.handle.setState('queued');
    } else {
      task.handle.setState('waiting');
    }
  }

  private completeTask(task: TaskRecord, value: any): void {
    if (!task.active) return;
    task.active = false;
    this.invalidateTaskWork(task);
    task.handle.resolve(value);
    this.tasks.delete(task.id);
  }

  private failTask(task: TaskRecord, error: any): void {
    if (!task.active) return;
    task.active = false;
    this.invalidateTaskWork(task);
    task.handle.reject(error);
    this.tasks.delete(task.id);
  }

  private cancelTask(task: TaskRecord): void {
    if (!task.active) return;
    if (this.inVM && this.activeTask === task) {
      task.cancelRequested = true;
      return;
    }
    if (this.activeTurn === task) {
      try {
        this.vm.cancel();
      } catch (error) {
        this.failTask(task, error);
        return;
      }
      this.activeTurn = undefined;
    }
    this.finishCancellation(task);
    this.requestPump();
  }

  private finishCancellation(task: TaskRecord): void {
    if (this.activeTurn === task) {
      try {
        this.vm.cancel();
      } catch (_error) {
        // Cancellation is terminal for the host task even if the VM call has
        // already returned to idle.
      }
      this.activeTurn = undefined;
    }
    if (!task.active) return;
    task.active = false;
    this.invalidateTaskWork(task);
    const error = new Error('Resumable task cancelled');
    error.name = 'AbortError';
    task.handle.reject(error, 'cancelled');
    this.tasks.delete(task.id);
  }

  private invalidateTaskWork(task: TaskRecord): void {
    task.generation++;
    for (const token of task.tokens) {
      token.state = 'invalid';
      token.task = undefined;
      token.callback = undefined;
      const controller = token.controller;
      token.controller = undefined;
      controller?.abort();
    }
    task.tokens.clear();
    this.queue = this.queue.filter(item => item.kind === 'start'
      ? item.task !== task
      : item.task !== task);
    this.settlements = this.settlements.filter(settlement => settlement.taskID !== task.id);
  }

  private failAll(error: any): void {
    if (this.activeTurn && !this.inVM) {
      try {
        this.vm.cancel();
      } catch (_error) {
        // The scheduler failure is the useful error to report.
      }
      this.activeTurn = undefined;
    }
    for (const task of this.tasks.values()) this.failTask(task, error);
    this.queue.length = 0;
    this.settlements.length = 0;
  }
}
