#include "microvium.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

_Static_assert(sizeof(MVM_FLOAT64) == sizeof(double), "MVM_FLOAT64 must be binary64");

static MVM_FLOAT64 (*const toFloat64Fn)(mvm_VM*, mvm_Value) = mvm_toFloat64;
static mvm_Value (*const newNumberFn)(mvm_VM*, MVM_FLOAT64) = mvm_newNumber;

void codeCoverage(int id, int mode, int indexInTable, int tableSize, int lineNumber) {
  (void)id; (void)mode; (void)indexInTable; (void)tableSize; (void)lineNumber;
}

void fatalError(void* vm, int error) {
  (void)vm;
  fprintf(stderr, "Microvium fatal error %d\n", error);
  exit(error ? error : 1);
}

static mvm_TeError resolveImport(mvm_HostFunctionID id, void* context, mvm_TfHostFunction* out) {
  (void)id; (void)context;
  *out = NULL;
  return MVM_E_UNRESOLVED_IMPORT;
}

static int fail(const char* message, mvm_TeError error) {
  fprintf(stderr, "%s (error %d)\n", message, (int)error);
  return 1;
}

static int expect_kind(mvm_VM* vm, mvm_Value function, mvm_Value value, const char* expected) {
  mvm_Value result;
  mvm_TeError err = mvm_call(vm, function, &result, &value, 1);
  if (err != MVM_E_SUCCESS) return fail("Number.kind call failed", err);
  size_t size = 0;
  const char* actual = mvm_toStringUtf8(vm, result, &size);
  if (!actual || size != strlen(expected) || memcmp(actual, expected, size) != 0) {
    fprintf(stderr, "Number.kind returned '%.*s', expected '%s'\n", (int)size, actual ? actual : "", expected);
    return 1;
  }
  return 0;
}

static int expect_integer(mvm_VM* vm, mvm_Value function, mvm_Value value, bool expected) {
  mvm_Value result;
  mvm_TeError err = mvm_call(vm, function, &result, &value, 1);
  if (err != MVM_E_SUCCESS) return fail("Number.isInteger call failed", err);
  if (mvm_toBool(vm, result) != expected) return fail("Number.isInteger returned the wrong result", MVM_E_UNEXPECTED);
  return 0;
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

  const mvm_VMExportID ids[] = { 1, 2, 3, 4, 5, 6, 7, 8 };
  mvm_Value exports[8];
  err = mvm_resolveExports(vm, ids, exports, 8);
  if (err != MVM_E_SUCCESS) return fail("could not resolve numeric API exports", err);

  mvm_NumericValue actual;
  err = mvm_getNumeric(vm, exports[0], &actual);
  if (err != MVM_E_SUCCESS || actual.kind != MVM_NUM_UNSIGNED || actual.width != 12 || actual.value.u != 4095) return fail("u12 FFI decode failed", err);
  err = mvm_getNumeric(vm, exports[1], &actual);
  if (err != MVM_E_SUCCESS || actual.kind != MVM_NUM_SIGNED || actual.width != 37 || actual.value.i != -1234567) return fail("i37 FFI decode failed", err);
  err = mvm_getNumeric(vm, exports[2], &actual);
  if (err != MVM_E_SUCCESS || actual.kind != MVM_NUM_UNSIGNED || actual.width != 64 || actual.value.u != UINT64_C(9007199254740993)) return fail("u64 FFI decode lost precision", err);
  if (toFloat64Fn(vm, exports[2]) != 9007199254740992.0) return fail("binary64 projection was not lossy as expected", MVM_E_UNEXPECTED);
  err = mvm_getNumeric(vm, exports[3], &actual);
  if (err != MVM_E_SUCCESS || actual.kind != MVM_NUM_FLOAT || actual.width != 32 || actual.value.f32 != 1.5f) return fail("f32 FFI decode failed", err);
  err = mvm_getNumeric(vm, exports[4], &actual);
  if (err != MVM_E_SUCCESS || actual.kind != MVM_NUM_FLOAT || actual.width != 64 || actual.value.f64 != 1.5) return fail("f64 FFI decode failed", err);
  err = mvm_getNumeric(vm, exports[5], &actual);
  if (err != MVM_E_SUCCESS || actual.kind != MVM_NUM_ORDINARY || actual.width != 0 || actual.value.f64 != 1.5) return fail("ordinary Number FFI decode failed", err);

  mvm_NumericValue input;
  memset(&input, 0, sizeof(input));
  input.kind = MVM_NUM_UNSIGNED; input.width = 12; input.value.u = 8191;
  mvm_Value constructed;
  err = mvm_newNumeric(vm, &input, &constructed);
  if (err != MVM_E_SUCCESS) return fail("mvm_newNumeric u12 failed", err);
  err = mvm_getNumeric(vm, constructed, &actual);
  if (err != MVM_E_SUCCESS || actual.kind != input.kind || actual.width != input.width || actual.value.u != 4095) return fail("mvm_newNumeric u12 did not normalize", err);
  if (expect_kind(vm, exports[6], constructed, "u12")) return 1;
  if (expect_integer(vm, exports[7], constructed, true)) return 1;

  memset(&input, 0, sizeof(input));
  input.kind = MVM_NUM_SIGNED; input.width = 37; input.value.i = -1234567;
  err = mvm_newNumeric(vm, &input, &constructed);
  if (err != MVM_E_SUCCESS) return fail("mvm_newNumeric i37 failed", err);
  err = mvm_getNumeric(vm, constructed, &actual);
  if (err != MVM_E_SUCCESS || actual.kind != input.kind || actual.width != input.width || actual.value.i != input.value.i) return fail("mvm_newNumeric i37 did not round-trip", err);
  if (expect_kind(vm, exports[6], constructed, "i37")) return 1;

  memset(&input, 0, sizeof(input));
  input.kind = MVM_NUM_UNSIGNED; input.width = 64; input.value.u = UINT64_C(9007199254740993);
  err = mvm_newNumeric(vm, &input, &constructed);
  if (err != MVM_E_SUCCESS) return fail("mvm_newNumeric u64 failed", err);
  if (expect_kind(vm, exports[6], constructed, "u64")) return 1;
  if (expect_integer(vm, exports[7], constructed, true)) return 1;

  memset(&input, 0, sizeof(input));
  input.kind = MVM_NUM_FLOAT; input.width = 32; input.value.f32 = 1.5f;
  err = mvm_newNumeric(vm, &input, &constructed);
  if (err != MVM_E_SUCCESS) return fail("mvm_newNumeric f32 failed", err);
  err = mvm_getNumeric(vm, constructed, &actual);
  if (err != MVM_E_SUCCESS || actual.kind != input.kind || actual.width != input.width || actual.value.f32 != input.value.f32) return fail("mvm_newNumeric f32 did not round-trip", err);
  if (expect_kind(vm, exports[6], constructed, "f32")) return 1;

  memset(&input, 0, sizeof(input));
  input.kind = MVM_NUM_ORDINARY; input.width = 0; input.value.f64 = 1.5;
  err = mvm_newNumeric(vm, &input, &constructed);
  if (err != MVM_E_SUCCESS) return fail("mvm_newNumeric ordinary Number failed", err);
  if (expect_kind(vm, exports[6], constructed, "number")) return 1;
  if (expect_integer(vm, exports[7], constructed, false)) return 1;

  mvm_Value apiNumber = newNumberFn(vm, 2.5);
  if (mvm_toFloat64(vm, apiNumber) != 2.5) return fail("mvm_newNumber/mvm_toFloat64 ABI failed", MVM_E_UNEXPECTED);
  mvm_free(vm);
  free(bytecode);
  return 0;
}
