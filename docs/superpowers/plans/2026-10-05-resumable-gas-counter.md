# Resumable Gas Counter Implementation Plan

**Goal:** Add an opt-in native VM API that runs a script call in instruction-budgeted slices and can resume the same call after yielding. Preserve the current `mvm_stopAfterNInstructions` behavior for existing callers.

**Architecture:** Keep one bytecode interpreter. Add a retained-execution mode with explicit dispatch, execution, and job-draining phases. A slice ends only at the existing bytecode instruction boundary, after cached registers are flushed into persistent VM state. The host owns scheduling; Microvium owns the continuation between slices.

**Tech stack:** C11 native VM, Node N-API binding, TypeScript facade, generated amalgamated C distribution via `scripts/preprocess-microvium.ts`.

## Contract decisions

- Resumable execution is opt-in. The legacy gas counter still aborts a call with `MVM_E_INSTRUCTION_COUNT_REACHED` and still requires an explicit reset.
- Resumable slices have their own per-slice instruction budget. `-1` means unlimited, `0` yields before dispatch, positive values count bytecode instructions, and values below `-1` are invalid.
- A slice budget is replaced on each resume. The existing legacy hard limit remains a separate cumulative abort limit and takes precedence if both limits reach zero at the same boundary.
- A resumable turn consists of the requested function call and promise jobs that Microvium drains before returning from a normal host call.
- Host delivery that requires another script call on the same VM is rejected while a turn is running or suspended. Hosts must queue such delivery until the active turn completes or is cancelled.
- Yielding, completion, cancellation, and failure are separate outcomes. Errors continue to use `mvm_TeError`; a successful API call reports `MVM_RUN_COMPLETE` or `MVM_RUN_YIELDED` in its result structure.
- Resumable turns are single-entry and non-reentrant on the same VM. Legacy execution retains its current reentrant behavior. A per-VM state guard rejects script-entry calls during a resumable turn and while it is suspended.
- Continuations are in-memory only. Snapshot creation fails while a resumable turn is running or suspended.
- Cancellation and execution failure discard active frames and queued jobs but do not roll back heap/global writes or host side effects. They do not execute cleanup code or settle abandoned promises.

## Public API

Add to `native-vm/microvium.h`:

```c
typedef enum {
  MVM_RUN_COMPLETE,
  MVM_RUN_YIELDED
} mvm_TeRunStatus;

typedef struct {
  mvm_TeRunStatus status;
  mvm_Value value;
} mvm_TsRunResult;

mvm_TeError mvm_callResumable(
  mvm_VM* vm,
  mvm_Value function,
  mvm_Value thisValue,
  const mvm_Value* args,
  uint8_t argCount,
  int32_t instructionBudget,
  mvm_TsRunResult* out
);

mvm_TeError mvm_resume(
  mvm_VM* vm,
  int32_t instructionBudget,
  mvm_TsRunResult* out
);

mvm_TeError mvm_cancel(mvm_VM* vm);
```

Document these result rules:

- `out` is required. `args` is required only when `argCount` is nonzero. Reject too many arguments using the existing limit.
- On `MVM_E_SUCCESS`, `status` is meaningful. `COMPLETE` carries the initial call's result; `YIELDED` carries `undefined`.
- On `MVM_E_UNCAUGHT_EXCEPTION`, `value` carries the thrown value. On other errors, `value` is `undefined`; `status` is ignored.
- Errors after a turn has started discard the complete turn and return the VM to idle. Invalid arguments or rejected state transitions leave any existing suspended turn intact.
- `mvm_cancel` succeeds on an idle VM, discards a suspended turn, and returns a busy error for running execution. It cannot interrupt a host callback or another currently executing C frame.

Append new error codes without changing existing numeric values. Use distinct errors for busy execution, suspended-VM call attempts, and invalid resume state if useful to callers; synchronize `native-vm/microvium.h`, `lib/runtime-types.ts`, and `native-vm-bindings/error_descriptions.cc`.

## State model

The externally relevant transitions are:

```text
IDLE --callResumable--> RUNNING --budget boundary--> SUSPENDED
  ^                         |                           |
  |                         +--complete/error----------+
  |                                                     |
  +----------------cancel / resume-to-completion-------+
```

Represent execution mode and phase explicitly. The retained phase must distinguish:

1. Initial dispatch: function, `this`, and copied arguments are ready, but the target has not run.
2. Bytecode execution: resume at the saved program counter and VM registers.
3. Promise-job draining: the original call has returned, its result is retained, and queued jobs are being run.

Store the remaining slice allowance, the original return value, and a flag indicating whether that value is available. Place retained state with the stack/register allocation where possible; normal idle VMs should not pay for a retained stack. Compile the new machinery under `MVM_GAS_COUNTER` so configurations without gas support keep their current footprint and API surface.

## Implementation steps

### 1. Establish C API and state validation

**Files:** `native-vm/microvium.h`, `native-vm/microvium_internals.h`, `native-vm/microvium.c`

- Add public status/result types and start/resume/cancel declarations under `MVM_GAS_COUNTER`.
- Add error codes and descriptions without renumbering the existing enum.
- Add internal execution mode, phase, budget, and retained-result fields.
- Validate output pointers, nullable args, argument count, and budget range before changing the VM.
- Initialize output to `undefined` before execution so all non-success paths have a deterministic value.
- Guard every bytecode-entry API before stack mutation: `mvm_call`, `mvm_callEx`, `mvm_callNamedExport`, resumable start, and resume. Starting a resumable turn from a legacy host callback is rejected because the legacy VM already has an active stack.
- Permit non-execution APIs such as GC where existing invariants allow them. Do not claim thread safety; the guard handles same-thread reentrancy.

### 2. Refactor interpreter entry and exits

**Files:** `native-vm/microvium.c`

- Extract a shared internal execution entry used by legacy call, resumable start, and resume. Do not duplicate the opcode loop.
- Keep the existing legacy entry-register rollback and stack cleanup semantics unchanged.
- Add resumable exits:
  - Yield flushes the register cache, retains stack/register state, marks the turn suspended, and returns success plus `MVM_RUN_YIELDED`.
  - Completion stores/publishes the original result, releases the retained stack and context, and returns to idle.
  - Any runtime/host error discards the entire resumable turn, releases retained state, and returns to idle.
- Do not use the registers captured at resume entry as the error cleanup baseline. A failure after a yield must discard the original host invocation, not restore the continuation to its previous suspended PC.
- Ensure every return path clears the running state, including allocation errors during initial stack creation and early argument validation.

### 3. Add budget boundary and deferred dispatch

**Files:** `native-vm/microvium.c`

- Check resumable slice budget at `SUB_DO_NEXT_INSTRUCTION`, after the previous opcode has completed and before fetching another opcode.
- Decrement the budget only when a bytecode instruction is about to execute.
- Preserve the legacy hard limit as a separate cumulative counter. If both are exhausted at a boundary, return `MVM_E_INSTRUCTION_COUNT_REACHED` and discard the resumable turn; otherwise a zero slice budget yields.
- Make a zero-budget start perform no target, host import, or constructor work. Copy and root the initial call inputs, save the dispatch phase, and defer normal function/class dispatch until a later positive or unlimited slice.
- If the last permitted instruction completes all work, report complete rather than yielding merely because the counter is now zero.
- Do not attempt to interrupt an opcode or host import mid-operation. A long-running host function remains outside bytecode budgeting.

### 4. Preserve result and promise-job semantics

**Files:** `native-vm/microvium.c`, `native-vm/microvium_internals.h`

- Match current `mvm_call` behavior by draining promise jobs before reporting completion.
- On the original function's return, move its result into the retained execution context and enter job-draining phase. Do not retain the caller's `out_result` pointer.
- Resume from job draining after a yield and never overwrite the original result with a job's return value.
- Keep pending jobs and all active frames rooted until completion, failure, or cancel.
- On cancel/error, discard queued jobs owned by the turn and document that external promise sources or side effects cannot be rolled back.
- Confirm that `mvm_asyncStart` remains legal inside host imports during resumable execution, while nested `mvm_call` from the same callback is rejected before touching registers. A host async completion that needs to call back into the same VM must wait until the resumable turn is complete or cancelled.

### 5. Support GC and reject unsupported snapshots

**Files:** `native-vm/microvium.c`, `native-vm/microvium.h`, native binding snapshot wrapper

- Yield only after flushing cached registers and leaving `usingCachedRegisters == false`.
- Extend GC roots for any retained start inputs or result not already on the traced VM stack/registers.
- Verify that collection between slices can move the function, arguments, closure, callback, result, and job values without leaving stale references.
- Reject snapshot creation while the resumable state is running or suspended. The C snapshot API returns `NULL` with output size zero; make the Node binding check for `NULL` before constructing a Buffer and report snapshot creation failure. Do not claim it can distinguish this from allocation failure unless the C snapshot API gains an explicit error result or state query.
- Ensure VM destruction frees a retained stack/context. Cancel and terminal error use the same cleanup primitive.

### 6. Add native binding and TypeScript facade

**Files:** `native-vm-bindings/NativeVM.hh`, `native-vm-bindings/NativeVM.cc`, `lib/native-vm.ts`, `lib/native-vm-friendly.ts`

- Expose `callResumable(function, thisValue, args, budget)`, `resume(budget)`, and `cancel()` on the native addon and TypeScript interface. If the friendly wrapper can provide a safer default `thisValue`, add a thin overload there rather than duplicating execution policy.
- Return `{ status: 'yielded' }` or `{ status: 'complete', value }` on success. Throw `VMError` for native errors, preserving the numeric error code.
- Validate integral finite budgets and range before converting JavaScript `number` to `int32_t`; reject silent truncation and overflow.
- Copy argument values before entering C and convert completed result through existing `Value` wrappers. Do not retain JavaScript array or N-API references between slices.
- Ensure `call`, `callResumable`, and `resume` all honor the native reentrancy/state guard.

### 7. Add focused behavioral tests

**Files:** `test/native/native-api.test.ts` plus focused C tests if N-API cannot observe a state invariant.

Cover:

- Repeated small slices through loops, nested bytecode calls, closures, and class construction; compare final values and observable effects with an uninterrupted call.
- Zero-budget start has no script or host effects; resume starts dispatch exactly once.
- Budget of one, unlimited budget, exact completion at the boundary, and budget replacement between resumes.
- Caught exceptions continue; uncaught exceptions, host errors, and hard-limit exhaustion after one or more yields discard the whole turn.
- Hard limit and slice budget interact as documented, with the hard limit winning when both expire together.
- Start from legacy host callback, reentrant `mvm_call` during resumable host callback, calls while suspended, invalid resume, and invalid argument paths. Verify rejected operations do not corrupt a retained turn; verify legacy reentry remains unchanged.
- Yield during promise-job draining, retain original result, preserve job order, and survive GC that moves the saved result.
- Attempt to deliver an external async completion during a suspended turn; verify the call is rejected without mutation and succeeds after the turn returns to idle.
- GC between slices with initial arguments, active closures, CPS callbacks, and queued promise jobs.
- Cancel in dispatch, bytecode, and job-draining phases; verify next ordinary call works and side effects already performed remain.
- Snapshot rejection while suspended and snapshot success after completion/cancel; VM free while suspended.
- Counter disabled build compiles and has no new public resumable API or retained-state overhead.

Use `MVM_SAFE_MODE` for C execution-state tests. Add cases that check host callback counts and mutations, not just return values.

### 8. Regenerate and validate supported outputs

**Files:** generated `dist-c/*`, copied `test/getting-started/code/microvium/*` only where the repository workflow updates them.

- Regenerate the amalgamated distribution with `npm run preprocess-microvium`; use the existing copy workflow for bundled/example source copies.
- Build native addon and run focused native API tests, then the existing native and async suites.
- Run TypeScript compilation and repository checks relevant to the touched surfaces.
- Build with `MVM_GAS_COUNTER` disabled and run the minimal-size check.
- Build runtime WASM to catch shared-interpreter or public-header regressions; do not expose resumable execution in the WASM glue unless its host protocol is deliberately extended.
- Review generated diffs and confirm no bytecode opcode/snapshot format change was introduced.

## Documentation

Document cooperative execution in the low-level C and TypeScript APIs, the C scheduler, and the Node scheduler. Explain the independent slice budget and legacy hard limit, result availability, same-VM reentry restriction, cancellation effects, promise-job draining, snapshot restriction, and that native calls/opcodes are not preempted internally.

## Acceptance criteria

- Legacy `mvm_stopAfterNInstructions` tests and behavior remain unchanged.
- A resumable call yields only at bytecode boundaries and resumes at the next instruction without replay or loss of effects.
- Completion returns the original host-call result after normal job draining.
- GC, error cleanup, cancellation, and VM destruction work from every suspended phase.
- Same-VM script reentry is rejected during resumable execution without changing ordinary legacy reentry.
- Generated C, bindings, TypeScript, docs, and feature-disabled builds agree on the public contract.

---

## Host scheduling and awaited host operations

This layer sits above the low-level resumable API. A VM turn is one `mvm_callResumable` plus any `mvm_resume` calls needed to finish it. `MVM_RUN_COMPLETE` ends the turn; it does not say that a script Promise has settled. If a host async import was awaited, its `mvm_asyncStart` callback is delivered later as a fresh turn.

The VM keeps rejecting reentry. A host that needs multiple calls on one VM must serialize them and queue completions. Microvium does not own an OS event loop and does not provide one universal scheduler abstraction.

### C scheduler

Provide `microvium_scheduler.h/.c` as a separate optional module, outside the interpreter amalgamation. It is ordinary C, has no allocator dependency, and is compiled into an application only when wanted. The module exposes a caller-owned scheduler, intrusive call records, a fixed instruction budget, argument scratch supplied by the application, and a host `post(work)` hook.

Its behavior is deliberately small:

- One queued callback runs one resumable slice.
- Calls from different VMs share a FIFO queue and are serialized.
- A yielded call rotates behind runnable calls from other VMs; new calls for its VM wait for its continuation.
- A completed call invokes its host callback after the VM is idle.
- An async import saves the handle returned by `mvm_asyncStart`; operation completion queues that callback as a normal two-argument call `(success, valueOrError)`.
- The host owns call records and handles, so queue depth and retained RAM are bounded by caller storage.
- The helper does not allocate, track script task settlement, own cancellation tokens, abort host I/O, or turn Microvium into a multithreaded VM.

`post(work)` must queue exactly once, must defer execution, and must deliver it on the VM's owning thread. Background completions and ISR handlers must enqueue onto that thread before using any Microvium API. Yielded calls rotate behind runnable calls from other VMs; new calls for the same VM wait for its continuation to complete or be cancelled. A positive slice budget is required; `-1` disables yielding.

Example call setup:

```c
static mvm_TsScheduler scheduler;
static mvm_TsScheduledCall call;
static mvm_Value argumentScratch[4];

mvm_scheduledCallInit(&call);
mvm_schedulerInit(
  &scheduler, 500, postToMainLoop, loopContext,
  argumentScratch, 4);
mvm_schedulerEnqueue(
  &scheduler, &call, vm, &functionHandle, NULL,
  argumentHandles, argumentCount, &resultHandle,
  onCallFinished, userContext);
```

For an awaited C host operation, initialize a handle for the callback returned by `mvm_asyncStart` and keep it rooted until completion or cancellation. On completion, set two initialized argument handles and enqueue the callback through the helper. Do not invoke it directly. The detailed contract and a C test are in `doc/native-host/resumable-execution.md` and `test/native/resumable-scheduler-c.c`.

This is a host scheduling helper, not core policy. Applications that already have a main-loop queue can use it or call the low-level C API directly.

### Node adapter

Keep `ResumableScheduler` as an adapter for bounded guest execution from Node. Keep it out of the package root exports. Its job is to model the same turn ordering in Node: one VM owner, a FIFO work queue, one slice per deferred callback, async completions as fresh turns, plus task handles and cancellation for Node callers.

It also needs a script wrapper because a native call result does not expose the eventual result of an async function. The wrapper reserves a named import and passes an exact decimal string task ID:

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
```

The Node adapter may keep its bounded host-value clone and one-shot completion tokens. Cancellation aborts the optional Node `AbortSignal`; it invalidates late completion callbacks but cannot undo host side effects. Task state (`queued`, `running`, `waiting`, `complete`, `failed`, `cancelled`) remains separate from VM-turn state.

This is separate from the C design and is not the embedded API. It provides a Node reference for ordering and edge cases; embedded hosts provide their own event-loop hook and storage.

### Shared acceptance criteria

- Resumable VM turns stay serialized; a queued completion enters through a fresh call after the active turn is idle.
- Each scheduled callback runs at most one instruction slice, and the host can run other work between slices.
- The core resumable API remains usable without either scheduler helper.
- The C helper uses caller-owned bounded storage, roots values through handles, and never invokes the VM from a completion thread or inline scheduling hook.
- The Node adapter remains absent from the package root exports and is documented as a Node-specific host layer.
- The Node value clone and task cancellation, plus C call cancellation, obey the documented GC, Promise-job, and snapshot rules.
