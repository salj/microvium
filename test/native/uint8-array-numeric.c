#include "microvium.h"

#include <stdio.h>
#include <stdlib.h>

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

static mvm_TeError resolveImport(mvm_HostFunctionID id, void* context, mvm_TfHostFunction* out) {
  (void)id;
  (void)context;
  *out = NULL;
  return MVM_E_UNRESOLVED_IMPORT;
}

static int fail(const char* message, mvm_TeError error) {
  fprintf(stderr, "%s (error %d)\n", message, (int)error);
  return 1;
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
  mvm_TeError err = mvm_restore(&vm, bytecode, (size_t)length, NULL, resolveImport);
  if (err != MVM_E_SUCCESS) return fail("mvm_restore failed", err);

  const mvm_VMExportID ids[] = { 1 };
  mvm_Value functions[1];
  err = mvm_resolveExports(vm, ids, functions, 1);
  if (err != MVM_E_SUCCESS) return fail("could not resolve test exports", err);

  mvm_Value result;
  err = mvm_call(vm, functions[0], &result, NULL, 0);
  if (err != MVM_E_SUCCESS || !mvm_toBool(vm, result)) return fail("numeric byte access failed", err);

  mvm_free(vm);
  free(bytecode);
  return 0;
}
