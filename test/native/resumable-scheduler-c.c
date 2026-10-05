#include "microvium_scheduler.h"

#include <stdio.h>
#include <stdlib.h>

typedef struct EventLoop {
  mvm_TfScheduledWork work;
  void* workContext;
} EventLoop;

static EventLoop eventLoop;
static mvm_Handle asyncCallback;
static bool asyncStarted;
static mvm_TeError lastCallError;
static uint32_t scheduledCount;

void codeCoverage(int id, int mode, int indexInTable, int tableSize, int lineNumber) {
  (void)id;
  (void)mode;
  (void)indexInTable;
  (void)tableSize;
  (void)lineNumber;
}

void fatalError(void* vm, int error) {
  (void)vm;
  fprintf(stderr, "Microvium fatal error %d\n", error);
  exit(error ? error : 1);
}

static mvm_TeError hostFunction(
  mvm_VM* vm,
  mvm_HostFunctionID id,
  mvm_Value* result,
  mvm_Value* args,
  uint8_t argCount) {
  (void)args;
  (void)argCount;
  if (id != 0 || asyncStarted) return MVM_E_INVALID_ARGUMENTS;

  /* Must happen before touching any other VM state in this host call. */
  mvm_Value callback = mvm_asyncStart(vm, result);
  mvm_handleSet(&asyncCallback, callback);
  asyncStarted = true;
  return MVM_E_SUCCESS;
}

static mvm_TeError resolveImport(
  mvm_HostFunctionID id,
  void* context,
  mvm_TfHostFunction* outHostFunction) {
  (void)id;
  (void)context;
  *outHostFunction = hostFunction;
  return MVM_E_SUCCESS;
}

static bool postWork(
  void* context,
  mvm_TfScheduledWork work,
  void* workContext) {
  EventLoop* loop = (EventLoop*)context;
  if (loop->work) return false;
  loop->work = work;
  loop->workContext = workContext;
  scheduledCount++;
  return true;
}

static bool postInline(
  void* context,
  mvm_TfScheduledWork work,
  void* workContext) {
  (void)context;
  work(workContext);
  return true;
}

static bool runOneEvent(void) {
  if (!eventLoop.work) return false;
  mvm_TfScheduledWork work = eventLoop.work;
  void* context = eventLoop.workContext;
  eventLoop.work = NULL;
  eventLoop.workContext = NULL;
  work(context);
  return true;
}

static void drainEventLoop(void) {
  while (runOneEvent()) { }
}

static void callDone(mvm_TsScheduledCall* call, mvm_TeError error, void* context) {
  (void)call;
  (void)context;
  lastCallError = error;
}

static int fail(const char* message, mvm_TeError error) {
  fprintf(stderr, "%s (error %d)\n", message, (int)error);
  return 1;
}

static void releaseHandle(mvm_VM* vm, mvm_Handle* handle) {
  (void)mvm_releaseHandle(vm, handle);
}

int main(int argc, char** argv) {
  if (argc != 2) return fail("expected snapshot path", MVM_E_INVALID_ARGUMENTS);
  FILE* file = fopen(argv[1], "rb");
  if (!file) return fail("could not open snapshot", MVM_E_INVALID_ARGUMENTS);
  if (fseek(file, 0, SEEK_END) != 0) return fail("could not seek snapshot", MVM_E_INVALID_ARGUMENTS);
  long length = ftell(file);
  if (length <= 0 || fseek(file, 0, SEEK_SET) != 0) return fail("invalid snapshot size", MVM_E_INVALID_ARGUMENTS);
  uint8_t* bytecode = (uint8_t*)malloc((size_t)length);
  if (!bytecode || fread(bytecode, 1, (size_t)length, file) != (size_t)length) return fail("could not read snapshot", MVM_E_MALLOC_FAIL);
  fclose(file);

  mvm_VM* vm = NULL;
  mvm_TeError error = mvm_restore(&vm, bytecode, (size_t)length, NULL, resolveImport);
  if (error != MVM_E_SUCCESS) return fail("mvm_restore failed", error);

  mvm_initializeHandle(vm, &asyncCallback);
  mvm_Handle taskFunction;
  mvm_Handle readFunction;
  mvm_Handle asyncArgs[2];
  mvm_Handle taskResult;
  mvm_Handle readResult;
  mvm_initializeHandle(vm, &taskFunction);
  mvm_initializeHandle(vm, &readFunction);
  mvm_initializeHandle(vm, &asyncArgs[0]);
  mvm_initializeHandle(vm, &asyncArgs[1]);
  mvm_initializeHandle(vm, &taskResult);
  mvm_initializeHandle(vm, &readResult);

  const mvm_VMExportID exportIDs[] = { 1, 2 };
  mvm_Value exports[2];
  error = mvm_resolveExports(vm, exportIDs, exports, 2);
  if (error != MVM_E_SUCCESS) return fail("could not resolve exports", error);
  mvm_handleSet(&taskFunction, exports[0]);
  mvm_handleSet(&readFunction, exports[1]);

  mvm_Value argumentScratch[2];
  mvm_TsScheduler scheduler;
  error = mvm_schedulerInit(&scheduler, 3, postWork, &eventLoop, argumentScratch, 2);
  if (error != MVM_E_SUCCESS) return fail("could not initialize scheduler", error);

  mvm_TsScheduledCall call;
  mvm_TsScheduledCall queuedCall;
  mvm_scheduledCallInit(&call);
  mvm_scheduledCallInit(&queuedCall);

  /* Cancelling the only queued call must leave a harmless stale event. */
  error = mvm_schedulerEnqueue(
    &scheduler, &queuedCall, vm, &readFunction, NULL, NULL, 0,
    &readResult, callDone, NULL);
  if (error != MVM_E_SUCCESS) return fail("could not enqueue cancellable call", error);
  error = mvm_schedulerCancel(&scheduler, &queuedCall);
  if (error != MVM_E_SUCCESS || queuedCall.state != MVM_SCHEDULED_CALL_CANCELLED) {
    return fail("could not cancel queued call", error);
  }
  mvm_scheduledCallReset(&queuedCall);

  error = mvm_schedulerEnqueue(
    &scheduler, &call, vm, &taskFunction, NULL, NULL, 0,
    &taskResult, callDone, NULL);
  if (error != MVM_E_SUCCESS) return fail("could not enqueue async task", error);
  if (!runOneEvent() || call.state != MVM_SCHEDULED_CALL_ACTIVE) {
    return fail("budgeted call did not retain its active turn", MVM_E_UNEXPECTED);
  }

  /* A new call queues behind the active continuation. */
  error = mvm_schedulerEnqueue(
    &scheduler, &queuedCall, vm, &readFunction, NULL, NULL, 0,
    &readResult, callDone, NULL);
  if (error != MVM_E_SUCCESS) return fail("could not queue behind active turn", error);
  drainEventLoop();
  if (call.state != MVM_SCHEDULED_CALL_COMPLETE || lastCallError != MVM_E_SUCCESS || !asyncStarted) {
    return fail("async task did not suspend and return to the host", lastCallError);
  }
  if (queuedCall.state != MVM_SCHEDULED_CALL_COMPLETE || mvm_toInt32(vm, mvm_handleGet(&readResult)) != 0) {
    return fail("queued call did not run after the active turn", MVM_E_UNEXPECTED);
  }
  if (scheduledCount <= 2) return fail("call did not span multiple budgeted slices", MVM_E_UNEXPECTED);

  /* A settled async host operation becomes a new VM call with the saved callback. */
  mvm_handleSet(&asyncArgs[0], mvm_newBoolean(true));
  mvm_handleSet(&asyncArgs[1], mvm_newInt32(vm, 42));
  error = mvm_scheduledCallReset(&call);
  if (error != MVM_E_SUCCESS) return fail("could not reset call record", error);
  error = mvm_schedulerEnqueue(
    &scheduler, &call, vm, &asyncCallback, NULL, asyncArgs, 2,
    &taskResult, callDone, NULL);
  if (error != MVM_E_SUCCESS) return fail("could not enqueue async completion", error);
  drainEventLoop();
  if (call.state != MVM_SCHEDULED_CALL_COMPLETE || lastCallError != MVM_E_SUCCESS) {
    return fail("async completion callback failed", lastCallError);
  }

  error = mvm_scheduledCallReset(&queuedCall);
  if (error != MVM_E_SUCCESS) return fail("could not reset call record", error);
  error = mvm_schedulerEnqueue(
    &scheduler, &queuedCall, vm, &readFunction, NULL, NULL, 0,
    &readResult, callDone, NULL);
  if (error != MVM_E_SUCCESS) return fail("could not enqueue result read", error);
  drainEventLoop();
  if (queuedCall.state != MVM_SCHEDULED_CALL_COMPLETE || lastCallError != MVM_E_SUCCESS) {
    return fail("result read failed", lastCallError);
  }
  if (mvm_toInt32(vm, mvm_handleGet(&readResult)) != 42) {
    return fail("async completion did not resume the script", MVM_E_UNEXPECTED);
  }

  /* A yielded VM must not keep another VM from running. Calls for the
   * suspended VM remain behind its continuation. */
  mvm_VM* vm2 = NULL;
  error = mvm_restore(&vm2, bytecode, (size_t)length, NULL, resolveImport);
  if (error != MVM_E_SUCCESS) return fail("could not restore second VM", error);
  mvm_Handle vm2ReadFunction;
  mvm_Handle vm2ReadResult;
  mvm_Handle spinFunction;
  mvm_Handle spinResult;
  mvm_initializeHandle(vm2, &vm2ReadFunction);
  mvm_initializeHandle(vm2, &vm2ReadResult);
  mvm_initializeHandle(vm, &spinFunction);
  mvm_initializeHandle(vm, &spinResult);
  const mvm_VMExportID spinID = 3;
  mvm_Value spinExport = mvm_undefined;
  error = mvm_resolveExports(vm, &spinID, &spinExport, 1);
  if (error != MVM_E_SUCCESS) return fail("could not resolve spin export", error);
  mvm_handleSet(&spinFunction, spinExport);
  mvm_Value vm2ReadExport = mvm_undefined;
  error = mvm_resolveExports(vm2, &exportIDs[1], &vm2ReadExport, 1);
  if (error != MVM_E_SUCCESS) return fail("could not resolve second VM export", error);
  mvm_handleSet(&vm2ReadFunction, vm2ReadExport);

  mvm_TsScheduledCall spinCall;
  mvm_TsScheduledCall sameVmCall;
  mvm_TsScheduledCall otherVmCall;
  mvm_scheduledCallInit(&spinCall);
  mvm_scheduledCallInit(&sameVmCall);
  mvm_scheduledCallInit(&otherVmCall);
  error = mvm_schedulerEnqueue(&scheduler, &spinCall, vm,
    &spinFunction, NULL, NULL, 0, &spinResult, callDone, NULL);
  if (error != MVM_E_SUCCESS) return fail("could not enqueue spin call", error);
  error = mvm_schedulerEnqueue(&scheduler, &sameVmCall, vm,
    &readFunction, NULL, NULL, 0, &readResult, callDone, NULL);
  if (error != MVM_E_SUCCESS) return fail("could not queue same-VM call", error);
  error = mvm_schedulerEnqueue(&scheduler, &otherVmCall, vm2,
    &vm2ReadFunction, NULL, NULL, 0, &vm2ReadResult, callDone, NULL);
  if (error != MVM_E_SUCCESS) return fail("could not queue second-VM call", error);
  if (!runOneEvent() || spinCall.state != MVM_SCHEDULED_CALL_ACTIVE) {
    return fail("spin call did not yield", MVM_E_UNEXPECTED);
  }
  if (!runOneEvent() || otherVmCall.state != MVM_SCHEDULED_CALL_COMPLETE ||
      spinCall.state != MVM_SCHEDULED_CALL_ACTIVE ||
      sameVmCall.state != MVM_SCHEDULED_CALL_QUEUED) {
    return fail("scheduler did not service another VM fairly", MVM_E_UNEXPECTED);
  }
  error = mvm_schedulerCancel(&scheduler, &spinCall);
  if (error != MVM_E_SUCCESS || spinCall.state != MVM_SCHEDULED_CALL_CANCELLED) {
    return fail("could not cancel yielded call", error);
  }
  error = mvm_schedulerCancel(&scheduler, &sameVmCall);
  if (error != MVM_E_SUCCESS || sameVmCall.state != MVM_SCHEDULED_CALL_CANCELLED) {
    return fail("could not cancel blocked same-VM call", error);
  }
  if (!runOneEvent()) return fail("missing stale cancellation event", MVM_E_UNEXPECTED);

  /* The optional helper rejects an inline host scheduler hook cleanly. */
  mvm_TsScheduler invalidScheduler;
  mvm_TsScheduledCall invalidCall;
  mvm_Value invalidScratch[2];
  mvm_scheduledCallInit(&invalidCall);
  error = mvm_schedulerInit(&invalidScheduler, 3, postInline, NULL, invalidScratch, 2);
  if (error != MVM_E_SUCCESS) return fail("could not initialize validation scheduler", error);
  error = mvm_schedulerEnqueue(
    &invalidScheduler, &invalidCall, vm, &readFunction, NULL, NULL, 0,
    &readResult, callDone, NULL);
  if (error != MVM_E_INVALID_ARGUMENTS
    || invalidCall.state != MVM_SCHEDULED_CALL_FAILED
    || lastCallError != MVM_E_INVALID_ARGUMENTS) {
    return fail("inline scheduler hook was not rejected", error);
  }

  mvm_scheduledCallReset(&call);
  mvm_scheduledCallReset(&queuedCall);
  mvm_scheduledCallReset(&invalidCall);
  mvm_scheduledCallReset(&spinCall);
  mvm_scheduledCallReset(&sameVmCall);
  mvm_scheduledCallReset(&otherVmCall);
  releaseHandle(vm, &asyncCallback);
  releaseHandle(vm, &taskFunction);
  releaseHandle(vm, &readFunction);
  releaseHandle(vm, &asyncArgs[0]);
  releaseHandle(vm, &asyncArgs[1]);
  releaseHandle(vm, &taskResult);
  releaseHandle(vm, &readResult);
  releaseHandle(vm, &spinFunction);
  releaseHandle(vm, &spinResult);
  releaseHandle(vm2, &vm2ReadFunction);
  releaseHandle(vm2, &vm2ReadResult);
  mvm_free(vm2);
  mvm_free(vm);
  free(bytecode);
  return 0;
}
