#include <stdint.h>
#include <stddef.h>
#include <math.h>

#include "../native-vm/microvium.h"

extern uint8_t reserve_rom[0x10000];
extern uint8_t reserve_ram[0x10000];
extern void allocator_init(void* ramStart, size_t ramSize);

// The JS host import ABI intentionally supports one numeric argument/result.
extern double mvm_wasm_host_import(uint32_t hostFunctionID, double argument);

static mvm_VM* activeVM;
static double callResult;

void mvm_fatalError(int error) {
  (void)error;
  __builtin_trap();
}

mvm_TeError invokeHost(mvm_VM* vm, mvm_HostFunctionID hostFunctionID, mvm_Value* result, mvm_Value* args, uint8_t argCount) {
  if (argCount != 1) return MVM_E_INVALID_ARGUMENTS;
  if (mvm_typeOf(vm, args[0]) != VM_T_NUMBER) return MVM_E_TYPE_ERROR;
  const double argument = mvm_toFloat64(vm, args[0]);
  const double hostResult = mvm_wasm_host_import(hostFunctionID, argument);
  *result = mvm_newNumber(vm, hostResult);
  return MVM_E_SUCCESS;
}

mvm_TeError resolveImport(mvm_HostFunctionID hostFunctionID, void* context, mvm_TfHostFunction* out_hostFunction) {
  (void)hostFunctionID;
  (void)context;
  *out_hostFunction = &invokeHost;
  return MVM_E_SUCCESS;
}

uint32_t mvm_wasm_snapshot_buffer(void) {
  return (uint32_t)(uintptr_t)reserve_rom;
}

uint32_t mvm_wasm_snapshot_capacity(void) {
  return sizeof(reserve_rom);
}

uint32_t mvm_wasm_restore(uint32_t snapshotSize) {
  if (snapshotSize == 0 || snapshotSize > sizeof(reserve_rom)) return MVM_E_INVALID_ARGUMENTS;
  if (activeVM) {
    mvm_free(activeVM);
    activeVM = NULL;
  }
  allocator_init((void*)reserve_ram, sizeof(reserve_ram));
  return mvm_restore(&activeVM, (void*)reserve_rom, snapshotSize, NULL, &resolveImport);
}

uint32_t mvm_wasm_call_export(uint32_t exportID, double argument) {
  if (!activeVM || exportID > 0xFFFFu) return MVM_E_INVALID_ARGUMENTS;

  const mvm_VMExportID id = (mvm_VMExportID)exportID;
  mvm_Value function;
  mvm_TeError error = mvm_resolveExports(activeVM, &id, &function, 1);
  if (error != MVM_E_SUCCESS) return error;
  if (mvm_typeOf(activeVM, function) != VM_T_FUNCTION) return MVM_E_TARGET_NOT_CALLABLE;

  mvm_Value arg = mvm_newNumber(activeVM, argument);
  mvm_Value result;
  error = mvm_call(activeVM, function, &result, &arg, 1);
  if (error != MVM_E_SUCCESS) return error;
  if (mvm_typeOf(activeVM, result) != VM_T_NUMBER) return MVM_E_TYPE_ERROR;

  callResult = mvm_toFloat64(activeVM, result);
  return MVM_E_SUCCESS;
}

uint32_t mvm_wasm_result_pointer(void) {
  return (uint32_t)(uintptr_t)&callResult;
}

void mvm_wasm_free(void) {
  if (activeVM) {
    mvm_free(activeVM);
    activeVM = NULL;
  }
}
