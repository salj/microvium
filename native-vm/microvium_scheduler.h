#pragma once

#include "microvium.h"

#ifdef MVM_GAS_COUNTER

#ifdef __cplusplus
extern "C" {
#endif

typedef struct mvm_TsScheduler mvm_TsScheduler;
typedef struct mvm_TsScheduledCall mvm_TsScheduledCall;

typedef void (*mvm_TfScheduledWork)(void* workContext);

/**
 * Queue one callback for a later turn on the VM's owning thread. Return true
 * only if the callback was queued exactly once. The callback must not run
 * inline. Do not call Microvium from an ISR or another thread.
 */
typedef bool (*mvm_TfSchedule)(
  void* scheduleContext,
  mvm_TfScheduledWork work,
  void* workContext);

typedef enum mvm_TeScheduledCallState {
  MVM_SCHEDULED_CALL_IDLE,
  MVM_SCHEDULED_CALL_QUEUED,
  MVM_SCHEDULED_CALL_ACTIVE,
  MVM_SCHEDULED_CALL_COMPLETE,
  MVM_SCHEDULED_CALL_FAILED,
  MVM_SCHEDULED_CALL_CANCELLED
} mvm_TeScheduledCallState;

/** Called after the VM is idle again for completion, VM error, cancellation,
 * or scheduler failure. `call->result` is rooted by the caller's handle until
 * the call record is reset or its handle is released. */
typedef void (*mvm_TfScheduledCallDone)(
  mvm_TsScheduledCall* call,
  mvm_TeError error,
  void* context);

/**
 * Caller-owned intrusive queue record. Keep this record and every referenced
 * handle alive until `done` runs. `args` points to `argCount` initialized,
 * contiguous mvm_Handle records. The scheduler copies their values into its
 * scratch array immediately before starting the call.
 */
struct mvm_TsScheduledCall {
  mvm_TsScheduledCall* _next;
  mvm_VM* _vm;
  const mvm_Handle* _function;
  const mvm_Handle* _thisValue;
  const mvm_Handle* _args;
  mvm_Handle* _result;
  mvm_TfScheduledCallDone _done;
  void* _doneContext;
  uint8_t _argCount;
  mvm_TeScheduledCallState state;
};

/**
 * Caller-owned scheduler state. The scheduler allocates no memory. Calls for
 * different VMs are serialized and yielded calls rotate through the queue.
 * A yielded call blocks new calls to its own VM until it completes or is
 * cancelled. All helper API calls must run on the owning thread of the VMs.
 * The host bounds the queue by its call records and supplies scratch
 * storage sized for the largest call. A rejected or inline post fails the
 * scheduler.
 */
struct mvm_TsScheduler {
  mvm_TfSchedule _schedule;
  void* _scheduleContext;
  mvm_Value* _argumentScratch;
  uint8_t _argumentCapacity;
  int32_t _instructionBudget;
  mvm_TsScheduledCall* _queueHead;
  mvm_TsScheduledCall* _queueTail;
  mvm_TsScheduledCall* _scheduledCall;
  mvm_TsScheduledCall* _active;
  mvm_TeError _failure;
  bool _scheduled;
  bool _pumping;
  bool _posting;
  bool _postCalledInline;
  bool _contractViolation;
  bool _failed;
};

/**
 * Initialize a scheduler with a positive per-slice budget or -1 for unlimited
 * execution. A zero budget is rejected because this helper would make no
 * progress. `argumentScratch` may be NULL only when capacity is zero.
 */
MVM_EXPORT mvm_TeError mvm_schedulerInit(
  mvm_TsScheduler* scheduler,
  int32_t instructionBudget,
  mvm_TfSchedule schedule,
  void* scheduleContext,
  mvm_Value* argumentScratch,
  uint8_t argumentCapacity);

/** Zero-initialize a call record before its first enqueue. */
MVM_EXPORT void mvm_scheduledCallInit(mvm_TsScheduledCall* call);

/** Clear a completed/cancelled call record so it can be enqueued again. */
MVM_EXPORT mvm_TeError mvm_scheduledCallReset(mvm_TsScheduledCall* call);

/**
 * Enqueue a call with an undefined `this` value when thisValue is NULL. Keep
 * the referenced function, this, argument, and result handles initialized and
 * alive until `done` runs; do not mutate input values while queued. Calls are
 * FIFO across VMs. A yielded call rotates behind runnable calls from other
 * VMs; new calls for its VM wait until that continuation completes. At most
 * one slice runs in each scheduled callback.
 */
MVM_EXPORT mvm_TeError mvm_schedulerEnqueue(
  mvm_TsScheduler* scheduler,
  mvm_TsScheduledCall* call,
  mvm_VM* vm,
  const mvm_Handle* function,
  const mvm_Handle* thisValue,
  const mvm_Handle* args,
  uint8_t argCount,
  mvm_Handle* result,
  mvm_TfScheduledCallDone done,
  void* doneContext);

/** Cancel a queued call or a yielded active call. Returns MVM_E_VM_BUSY while
 * a slice is running; a host callback must let that slice return first. */
MVM_EXPORT mvm_TeError mvm_schedulerCancel(
  mvm_TsScheduler* scheduler,
  mvm_TsScheduledCall* call);

/** Return the call selected for the next posted slice, if any. */
MVM_EXPORT mvm_TsScheduledCall* mvm_schedulerGetScheduledCall(
  mvm_TsScheduler* scheduler);

/** Recover after a host fatal-error escape abandoned the active callback stack. */
MVM_EXPORT mvm_TeError mvm_schedulerAbandon(
  mvm_TsScheduler* scheduler,
  mvm_TsScheduledCall* call,
  mvm_TeError error);

#ifdef __cplusplus
} // extern "C"
#endif

#endif // MVM_GAS_COUNTER
