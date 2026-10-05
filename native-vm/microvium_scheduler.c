#include "microvium_scheduler.h"

#ifdef MVM_GAS_COUNTER

#include <string.h>

static void schedulerWork(void* context);
static void schedulerRequestWork(mvm_TsScheduler* scheduler);

static void queueAppend(
  mvm_TsScheduler* scheduler,
  mvm_TsScheduledCall* call) {
  call->_next = NULL;
  if (scheduler->_queueTail) scheduler->_queueTail->_next = call;
  else scheduler->_queueHead = call;
  scheduler->_queueTail = call;
}

static bool queueRemove(
  mvm_TsScheduler* scheduler,
  mvm_TsScheduledCall* call) {
  mvm_TsScheduledCall** link = &scheduler->_queueHead;
  mvm_TsScheduledCall* previous = NULL;
  while (*link && *link != call) {
    previous = *link;
    link = &(*link)->_next;
  }
  if (*link != call) return false;

  *link = call->_next;
  if (scheduler->_queueTail == call) scheduler->_queueTail = previous;
  call->_next = NULL;
  return true;
}

static mvm_TsScheduledCall* schedulerSelectRunnable(
  mvm_TsScheduler* scheduler) {
  for (mvm_TsScheduledCall* candidate = scheduler->_queueHead;
       candidate;
       candidate = candidate->_next) {
    if (candidate->state == MVM_SCHEDULED_CALL_ACTIVE) return candidate;

    bool vmHasContinuation = false;
    for (mvm_TsScheduledCall* other = scheduler->_queueHead;
         other;
         other = other->_next) {
      if (other != candidate &&
          other->state == MVM_SCHEDULED_CALL_ACTIVE &&
          other->_vm == candidate->_vm) {
        vmHasContinuation = true;
        break;
      }
    }
    if (!vmHasContinuation && candidate->state == MVM_SCHEDULED_CALL_QUEUED)
      return candidate;
  }
  return NULL;
}

static void callFinish(
  mvm_TsScheduledCall* call,
  mvm_TeScheduledCallState state,
  mvm_TeError error,
  mvm_Value result) {
  call->_next = NULL;
  call->state = state;
  if (call->_result) mvm_handleSet(call->_result, result);
  if (call->_done) call->_done(call, error, call->_doneContext);
}

static void schedulerFail(
  mvm_TsScheduler* scheduler,
  mvm_TeError error) {
  scheduler->_failed = true;
  scheduler->_failure = error;
  scheduler->_scheduled = false;
  scheduler->_scheduledCall = NULL;

  if (scheduler->_active) {
    mvm_TsScheduledCall* active = scheduler->_active;
    scheduler->_active = NULL;
    (void)mvm_cancel(active->_vm);
    callFinish(active, MVM_SCHEDULED_CALL_FAILED, error, mvm_undefined);
  }

  while (scheduler->_queueHead) {
    mvm_TsScheduledCall* call = scheduler->_queueHead;
    scheduler->_queueHead = call->_next;
    if (!scheduler->_queueHead) scheduler->_queueTail = NULL;
    if (call->state == MVM_SCHEDULED_CALL_ACTIVE)
      (void)mvm_cancel(call->_vm);
    callFinish(call, MVM_SCHEDULED_CALL_FAILED, error, mvm_undefined);
  }
}

static void schedulerRequestWork(mvm_TsScheduler* scheduler) {
  if (scheduler->_failed || scheduler->_scheduled || scheduler->_pumping) return;
  mvm_TsScheduledCall* call = schedulerSelectRunnable(scheduler);
  if (!call) return;

  scheduler->_scheduledCall = call;
  scheduler->_scheduled = true;
  scheduler->_posting = true;
  scheduler->_postCalledInline = false;
  bool accepted = scheduler->_schedule(
    scheduler->_scheduleContext,
    schedulerWork,
    scheduler);
  scheduler->_posting = false;

  if (scheduler->_postCalledInline) {
    schedulerFail(scheduler, MVM_E_INVALID_ARGUMENTS);
  } else if (!accepted) {
    schedulerFail(scheduler, MVM_E_UNEXPECTED);
  }
}

static void schedulerRunSlice(
  mvm_TsScheduler* scheduler,
  mvm_TsScheduledCall* call) {
  const bool resume = call->state == MVM_SCHEDULED_CALL_ACTIVE;
  mvm_TsRunResult run;
  run.status = MVM_RUN_COMPLETE;
  run.value = mvm_undefined;

  mvm_TeError error;
  scheduler->_active = call;
  if (resume) {
    error = mvm_resume(call->_vm, scheduler->_instructionBudget, &run);
  } else {
    for (uint8_t i = 0; i < call->_argCount; i++)
      scheduler->_argumentScratch[i] = mvm_handleGet(&call->_args[i]);

    mvm_Value thisValue = call->_thisValue
      ? mvm_handleGet(call->_thisValue)
      : mvm_undefined;
    call->state = MVM_SCHEDULED_CALL_ACTIVE;
    error = mvm_callResumable(
      call->_vm,
      mvm_handleGet(call->_function),
      thisValue,
      call->_argCount ? scheduler->_argumentScratch : NULL,
      call->_argCount,
      scheduler->_instructionBudget,
      &run);
  }

  scheduler->_active = NULL;
  if (error == MVM_E_SUCCESS && run.status == MVM_RUN_YIELDED) {
    call->state = MVM_SCHEDULED_CALL_ACTIVE;
    queueAppend(scheduler, call);
    return;
  }

  callFinish(
    call,
    error == MVM_E_SUCCESS
      ? MVM_SCHEDULED_CALL_COMPLETE
      : MVM_SCHEDULED_CALL_FAILED,
    error,
    run.value);
}

static void schedulerWork(void* context) {
  mvm_TsScheduler* scheduler =
    (mvm_TsScheduler*)context;
  if (scheduler->_posting) {
    scheduler->_postCalledInline = true;
    return;
  }
  if (scheduler->_failed) return;
  if (scheduler->_pumping) {
    scheduler->_contractViolation = true;
    return;
  }
  if (!scheduler->_scheduled) return;

  scheduler->_scheduled = false;
  mvm_TsScheduledCall* call = scheduler->_scheduledCall;
  scheduler->_scheduledCall = NULL;
  if (!call) call = schedulerSelectRunnable(scheduler);
  if (call && !queueRemove(scheduler, call)) {
    schedulerFail(scheduler, MVM_E_INVALID_ARGUMENTS);
    return;
  }

  scheduler->_pumping = true;
  if (call) schedulerRunSlice(scheduler, call);
  scheduler->_pumping = false;
  if (scheduler->_contractViolation) {
    schedulerFail(scheduler, MVM_E_INVALID_ARGUMENTS);
  } else {
    schedulerRequestWork(scheduler);
  }
}

mvm_TeError mvm_schedulerInit(
  mvm_TsScheduler* scheduler,
  int32_t instructionBudget,
  mvm_TfSchedule schedule,
  void* scheduleContext,
  mvm_Value* argumentScratch,
  uint8_t argumentCapacity) {
  if (!scheduler || !schedule || (!argumentScratch && argumentCapacity))
    return MVM_E_INVALID_ARGUMENTS;
  if (instructionBudget < -1 || instructionBudget == 0)
    return MVM_E_INVALID_INSTRUCTION_BUDGET;

  memset(scheduler, 0, sizeof(*scheduler));
  scheduler->_schedule = schedule;
  scheduler->_scheduleContext = scheduleContext;
  scheduler->_argumentScratch = argumentScratch;
  scheduler->_argumentCapacity = argumentCapacity;
  scheduler->_instructionBudget = instructionBudget;
  return MVM_E_SUCCESS;
}

void mvm_scheduledCallInit(mvm_TsScheduledCall* call) {
  if (call) memset(call, 0, sizeof(*call));
}

mvm_TeError mvm_scheduledCallReset(mvm_TsScheduledCall* call) {
  if (!call) return MVM_E_INVALID_ARGUMENTS;
  if (call->state == MVM_SCHEDULED_CALL_QUEUED ||
      call->state == MVM_SCHEDULED_CALL_ACTIVE) return MVM_E_VM_BUSY;
  memset(call, 0, sizeof(*call));
  return MVM_E_SUCCESS;
}

mvm_TeError mvm_schedulerEnqueue(
  mvm_TsScheduler* scheduler,
  mvm_TsScheduledCall* call,
  mvm_VM* vm,
  const mvm_Handle* function,
  const mvm_Handle* thisValue,
  const mvm_Handle* args,
  uint8_t argCount,
  mvm_Handle* result,
  mvm_TfScheduledCallDone done,
  void* doneContext) {
  if (!scheduler || !call || !vm || !function || !result || !done ||
      (argCount && !args)) return MVM_E_INVALID_ARGUMENTS;
  if (scheduler->_failed) return scheduler->_failure;
  if (call->state != MVM_SCHEDULED_CALL_IDLE) return MVM_E_INVALID_ARGUMENTS;
  if (argCount > scheduler->_argumentCapacity) return MVM_E_INVALID_ARGUMENTS;

  call->_vm = vm;
  call->_function = function;
  call->_thisValue = thisValue;
  call->_args = args;
  call->_argCount = argCount;
  call->_result = result;
  call->_done = done;
  call->_doneContext = doneContext;
  call->_next = NULL;
  call->state = MVM_SCHEDULED_CALL_QUEUED;
  queueAppend(scheduler, call);
  schedulerRequestWork(scheduler);
  return scheduler->_failed ? scheduler->_failure : MVM_E_SUCCESS;
}

mvm_TeError mvm_schedulerCancel(
  mvm_TsScheduler* scheduler,
  mvm_TsScheduledCall* call) {
  if (!scheduler || !call) return MVM_E_INVALID_ARGUMENTS;
  if (scheduler->_pumping) return MVM_E_VM_BUSY;
  if (!queueRemove(scheduler, call)) return MVM_E_INVALID_ARGUMENTS;

  if (scheduler->_scheduledCall == call) scheduler->_scheduledCall = NULL;
  if (call->state == MVM_SCHEDULED_CALL_ACTIVE) {
    mvm_TeError error = mvm_cancel(call->_vm);
    if (error != MVM_E_SUCCESS) {
      queueAppend(scheduler, call);
      schedulerRequestWork(scheduler);
      return error;
    }
  }
  callFinish(call, MVM_SCHEDULED_CALL_CANCELLED, MVM_E_SUCCESS,
    mvm_undefined);
  schedulerRequestWork(scheduler);
  return MVM_E_SUCCESS;
}

mvm_TsScheduledCall* mvm_schedulerGetScheduledCall(
  mvm_TsScheduler* scheduler) {
  if (!scheduler || !scheduler->_scheduled) return NULL;
  if (!scheduler->_scheduledCall)
    scheduler->_scheduledCall = schedulerSelectRunnable(scheduler);
  return scheduler->_scheduledCall;
}

mvm_TeError mvm_schedulerAbandon(
  mvm_TsScheduler* scheduler,
  mvm_TsScheduledCall* call,
  mvm_TeError error) {
  if (!scheduler || !call || error == MVM_E_SUCCESS)
    return MVM_E_INVALID_ARGUMENTS;
  if (!scheduler->_pumping || scheduler->_active != call)
    return MVM_E_INVALID_ARGUMENTS;

  scheduler->_active = NULL;
  scheduler->_pumping = false;
  scheduler->_contractViolation = false;
  callFinish(call, MVM_SCHEDULED_CALL_FAILED, error, mvm_undefined);
  schedulerRequestWork(scheduler);
  return MVM_E_SUCCESS;
}

#endif // MVM_GAS_COUNTER
