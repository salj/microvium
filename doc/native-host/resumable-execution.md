# Resumable execution

When `MVM_GAS_COUNTER` is enabled, the native VM can run a script call in bounded bytecode slices. A yielded call keeps its stack and registers in memory; the host decides when to resume it.

The C entry point takes the function, `this` value, arguments, and an instruction budget:

```c
mvm_TsRunResult run;
mvm_TeError err = mvm_callResumable(
  vm, function, mvm_undefined, args, arg_count, 1000, &run);

while (err == MVM_E_SUCCESS && run.status == MVM_RUN_YIELDED) {
  /* Schedule other host work here. */
  err = mvm_resume(vm, 1000, &run);
}

if (err == MVM_E_SUCCESS && run.status == MVM_RUN_COMPLETE) {
  /* Consume run.value. */
}
```

Use `-1` for an unlimited slice, `0` to yield before the target is invoked, or a positive bytecode instruction count. Each call to `mvm_resume` replaces the previous slice allowance. The existing `mvm_stopAfterNInstructions` counter remains a separate cumulative limit; if it expires, the resumable call is aborted with `MVM_E_INSTRUCTION_COUNT_REACHED`.

The TypeScript native binding returns a discriminated result and throws for VM errors:

```ts
let run = vm.callResumable(func, args, 1000);
while (run.status === 'yielded') {
  run = vm.resume(1000);
}
const value = run.value;
```

`NativeVMFriendly` exposes the same operations using host values:

```ts
let run = friendlyVm.callResumable(friendlyFunction, [1, 2], 1000);
while (run.status === 'yielded') {
  run = friendlyVm.resume(1000);
}
```

The VM yields only between bytecode instructions. An opcode and a host import run to completion once entered, so instruction budgets do not interrupt a long native operation or impose a wall-clock limit.

A VM can have only one active resumable call. While it is running, nested calls into the same VM return `MVM_E_VM_BUSY`. While it is suspended, new calls return `MVM_E_VM_SUSPENDED`; only `mvm_resume` or `mvm_cancel` may continue or discard the active call. This restriction applies to host callbacks too. If an external async completion needs to call into the same VM, queue it until the active resumable call completes or is cancelled. Other VMs are unaffected.

The resumable turn drains Microvium's queued promise jobs before reporting completion. A returned promise can still be pending on external work. Cancellation or an execution error discards active frames and queued jobs, but keeps heap/global writes and host side effects already performed. It does not run cleanup code or settle promises abandoned by the turn. `mvm_cancel` succeeds on an idle VM and frees a suspended continuation.

Garbage collection can run between slices; the VM retains the continuation and its values as GC roots. Snapshots do not contain stack or register state, so snapshot creation fails while a resumable call is running or suspended. Complete or cancel the call before creating a snapshot.

## C host scheduler

The low-level API rejects a second VM call while a resumable turn is active. C hosts can use the separate `microvium_scheduler.{h,c}` module to queue calls and serialize their slices. It is not part of `microvium.c`; add the two files to the host build when this helper fits the application.

The host owns the scheduler state, call records, handles, and argument scratch. The helper allocates nothing. The application therefore bounds the queue by the number of call records it provides.

```c
static mvm_TsScheduler scheduler;
static mvm_TsScheduledCall call;
static mvm_Value argumentScratch[4];

/* This must enqueue work for a later turn on the VM's owning thread. */
static bool scheduleOnMainLoop(
  void* context,
  mvm_TfScheduledWork work,
  void* workContext) {
  return mainLoopPost(context, work, workContext);
}

/* After restoring the VM and initializing the handles used by `call`: */
mvm_scheduledCallInit(&call);
mvm_schedulerInit(
  &scheduler, 500, scheduleOnMainLoop, mainLoop,
  argumentScratch, 4);
mvm_schedulerEnqueue(
  &scheduler, &call, vm, &functionHandle, NULL,
  argumentHandles, argumentCount, &resultHandle,
  onCallFinished, userContext);
```

Each scheduled callback runs one call slice. Calls for different VMs share the same queue and run serially. A yielded call rotates behind runnable calls from other VMs, while new calls for its own VM wait until the continuation completes or is cancelled. Terminal calls invoke `onCallFinished` after the VM has returned to idle; `call->state` distinguishes completion, failure, and cancellation, while `error` carries the VM or scheduler error. The result handle contains the script result or uncaught exception. Keep the call record and all referenced handles alive through that callback, then reset the record before reusing it. A positive instruction budget is required; `-1` runs without yielding.

For an async host import, call `mvm_asyncStart` first, then save its returned function in an initialized `mvm_Handle`. Marshal an external completion to the VM-owning thread before touching handles or calling the helper. There, put `(success, valueOrError)` in two initialized argument handles and enqueue the saved callback as an ordinary call record. That callback is never invoked directly from the completion path. If another call for the same VM is yielded, it waits until that call completes or is cancelled. Calls for other VMs remain eligible to run between slices.

This is only a call scheduler. It does not track script-level task settlement, own async-operation tokens, or cancel host I/O. The C application owns those policies and the callback handles. The scheduling hook must defer work, run it exactly once, and return it to the same thread that owns the VM. Do not call the helper or Microvium from an ISR or a background thread; marshal event data to the owner thread first.

## Node scheduler adapter

The TypeScript scheduler is a convenience adapter for Node users of the native addon. It is not exported from the package root and is not part of the embedded C API. The source lives at `lib/resumable-scheduler.ts`; it owns a `NativeVMFriendly` instance, slices calls through a host-provided scheduling hook, and queues async completion callbacks until the VM is idle.

```ts
const { ResumableScheduler } = require('microvium/dist/lib/resumable-scheduler');

const scheduler = new ResumableScheduler(snapshot, context => ({
  numeric: {
    0: input => {
      // This must be the first operation in the async host import.
      const completion = context.asyncStart();
      hostOperation(input, { signal: completion.signal }).then(completion.resolve, completion.reject);
      return undefined;
    },
  },
}), {
  instructionBudget: 1_000,
  // Adapt this to the host's event loop. It must defer the callback.
  schedule: work => hostEventLoop.enqueue(work),
});

const entry = scheduler.resolveNamedExport('taskEntry');
const task = scheduler.run(entry, { request: 'example' });
const result = await task.result;
```

The scheduler invokes one `callResumable` or `resume` slice per scheduled callback. If a turn yields, that same turn owns the VM until it completes or is cancelled. If a script awaits host work, its turn can complete while its task remains `waiting`; the host completion is later delivered by a fresh `callResumable` turn. A host completion never calls into the VM directly. Several tasks may wait on I/O at once, but VM turns run serially.

`schedule(work)` must enqueue `work` for a later host event-loop turn and must not call it inline. Use a scheduling primitive that gives other host work a chance to run between slices. When all tasks are waiting on host operations, the scheduler sleeps until a completion arrives; it does not poll.

### Script task wrapper

The VM call result is not the eventual value of an async function. Include this small wrapper in the compiled script and export it with the name `runResumableTask`:

```js
/** @mvm-ffi (Value, Value, Value) -> Value */
import { taskSettled } from 'microvium:resumable';

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
  const value = await someHostImport(input);
  return value;
}
```

When compiling the snapshot, bind `microvium:resumable:taskSettled` to a three-argument placeholder. `ResumableScheduler` supplies the real binding when restoring the VM and reserves that named import. The settlement call only records the task ID, outcome, and VM value; the host scheduler processes it after the active turn returns. The wrapper receives an opaque decimal string task ID so identity stays exact in snapshots configured for 32-bit ordinary numbers. `scheduler.run(entry, input)` invokes the wrapper, and the returned task handle exposes `state`, `result`, and `cancel()`.

Task state is separate from turn state:

- `queued`: a task start or host completion is ready to run;
- `running`: a VM turn is active or suspended on a budget boundary;
- `waiting`: no turn or queued callback is runnable;
- `complete`, `failed`, or `cancelled`: terminal task outcomes.

Cancelling a yielded turn discards its VM continuation. Cancelling a waiting task invalidates its completion tokens and aborts their signals. A host operation may continue if it cannot be aborted; its late completion is ignored. Cancellation does not undo VM heap writes or host side effects already performed.

Host values crossing the friendly native boundary use a bounded data clone: `undefined`, `null`, booleans, finite numbers, strings up to 8,191 UTF-8 bytes, arrays, plain records with string keys, and `Error` values copied as `{ name, message }`. The clone rejects cycles, accessors, symbols, custom prototypes, `__proto__`, functions that are not VM values, nesting deeper than 32, and more than 10,000 values. The scheduler snapshots host results when `resolve()` or `reject()` is called, so later mutation of the original object cannot change a queued completion.

This adapter provides bounded guest execution from Node. Embedded applications should use the C API or build a host-specific event-loop layer around it.
