#include <quickjs.h>

#include <errno.h>
#include <inttypes.h>
#include <math.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "microvium.h"
#include "compiler-bytecode.h"

#define MVMC_MAX_ARRAY_DEPTH 128
#define MVMC_MAX_ARGUMENTS 255
#define MVMC_HOST_ERROR_SIZE 1024

typedef struct MvmcVM MvmcVM;

typedef struct MvmcImport {
  mvm_HostFunctionID id;
  uint8_t argumentCount;
  bool fixedArity;
  JSValue function;
} MvmcImport;

typedef struct MvmcExport {
  mvm_VMExportID id;
  uint8_t argumentCount;
  char *name;
  size_t nameLength;
} MvmcExport;

typedef struct MvmcValueRef {
  MvmcVM *owner;
  mvm_Handle handle;
} MvmcValueRef;

typedef struct MvmcArrayIterator {
  MvmcVM *owner;
  mvm_TsArrayIterator iterator;
} MvmcArrayIterator;

struct MvmcVM {
  JSRuntime *runtime;
  JSContext *context;
  mvm_VM *vm;
  JSValue hostImports;
  JSValue numericImports;
  MvmcImport *imports;
  uint16_t importCount;
  size_t importCapacity;
  MvmcExport *exports;
  uint16_t exportCount;
  char hostError[MVMC_HOST_ERROR_SIZE];
};

static JSClassID mvmcValueClassID;
static JSClassID mvmcArrayIteratorClassID;
static JSClassID mvmcVMClassID;

static JSValue mvm_value_to_quickjs(MvmcVM *mvmc, mvm_Value value);
static int quickjs_value_to_mvm(MvmcVM *mvmc, JSValueConst source, mvm_Handle *out, JSValueConst *ancestors, unsigned depth);
static mvm_TeError host_import_handler(mvm_VM *vm, mvm_HostFunctionID id, mvm_Value *result, mvm_Value *args, uint8_t argumentCount);
static mvm_TeError resolve_numeric_import(mvm_HostFunctionID id, void *context, mvm_TfHostFunction *out_handler);
static JSValue vm_controller_call_export(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv);
static JSValue vm_controller_export_names(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv);
static JSValue vm_controller_export_ids(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv);
static JSValue vm_controller_get_export(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv);

void mvmc_fatal_error(void *vm, int error) {
  (void)vm;
  fprintf(stderr, "Microvium fatal error %d\n", error);
  abort();
}

static void set_host_error(MvmcVM *mvmc, const char *message) {
  if (!mvmc) return;
  if (!message) message = "Host function failed";
  snprintf(mvmc->hostError, sizeof(mvmc->hostError), "%s", message);
}

static void capture_quickjs_error(MvmcVM *mvmc, JSContext *context) {
  JSValue exception = JS_GetException(context);
  const char *message = JS_ToCString(context, exception);
  set_host_error(mvmc, message ? message : "QuickJS exception");
  if (message) JS_FreeCString(context, message);
  JS_FreeValue(context, exception);
}

static void print_quickjs_error(JSContext *context) {
  JSValue exception = JS_GetException(context);
  const char *message = JS_ToCString(context, exception);
  fprintf(stderr, "%s\n", message ? message : "QuickJS exception");
  if (message) JS_FreeCString(context, message);
  JS_FreeValue(context, exception);
}

static char *read_file(const char *filename, size_t *out_length) {
  FILE *file = strcmp(filename, "-") == 0 ? stdin : fopen(filename, "rb");
  if (!file) {
    fprintf(stderr, "Could not open %s: %s\n", filename, strerror(errno));
    return NULL;
  }
  size_t capacity = 8192;
  size_t length = 0;
  char *buffer = (char*)malloc(capacity + 1);
  if (!buffer) {
    if (file != stdin) fclose(file);
    fprintf(stderr, "Out of memory reading %s\n", filename);
    return NULL;
  }
  for (;;) {
    if (length == capacity) {
      if (capacity > SIZE_MAX / 2 - 1) {
        fprintf(stderr, "Input too large: %s\n", filename);
        free(buffer);
        if (file != stdin) fclose(file);
        return NULL;
      }
      capacity *= 2;
      char *larger = (char*)realloc(buffer, capacity + 1);
      if (!larger) {
        fprintf(stderr, "Out of memory reading %s\n", filename);
        free(buffer);
        if (file != stdin) fclose(file);
        return NULL;
      }
      buffer = larger;
    }
    size_t readCount = fread(buffer + length, 1, capacity - length, file);
    length += readCount;
    if (readCount == 0) {
      if (ferror(file)) {
        fprintf(stderr, "Could not read %s\n", filename);
        free(buffer);
        if (file != stdin) fclose(file);
        return NULL;
      }
      break;
    }
  }
  if (file != stdin) fclose(file);
  buffer[length] = '\0';
  *out_length = length;
  return buffer;
}

static int write_file(const char *filename, const uint8_t *bytes, size_t length) {
  FILE *file = strcmp(filename, "-") == 0 ? stdout : fopen(filename, "wb");
  if (!file) {
    fprintf(stderr, "Could not open %s: %s\n", filename, strerror(errno));
    return 0;
  }
  size_t written = fwrite(bytes, 1, length, file);
  int closeResult = file == stdout ? fflush(file) : fclose(file);
  if (written != length || closeResult != 0) {
    fprintf(stderr, "Could not write %s\n", filename);
    return 0;
  }
  return 1;
}

static int compile_source(JSContext *context, JSValueConst compileFunction, const char *source, size_t sourceLength, uint8_t **out_bytecode, size_t *out_bytecodeLength) {
  JSValue argument = JS_NewStringLen(context, source, sourceLength);
  if (JS_IsException(argument)) return 0;
  JSValue result = JS_Call(context, compileFunction, JS_UNDEFINED, 1, &argument);
  JS_FreeValue(context, argument);
  if (JS_IsException(result)) return 0;

  size_t byteOffset = 0;
  size_t byteLength = 0;
  size_t bytesPerElement = 0;
  JSValue buffer = JS_GetTypedArrayBuffer(context, result, &byteOffset, &byteLength, &bytesPerElement);
  if (JS_IsException(buffer)) {
    JS_FreeValue(context, result);
    return 0;
  }
  size_t bufferLength = 0;
  uint8_t *bufferData = JS_GetArrayBuffer(context, &bufferLength, buffer);
  if (!bufferData || byteOffset > bufferLength || byteLength > bufferLength - byteOffset) {
    JS_FreeValue(context, buffer);
    JS_FreeValue(context, result);
    JS_ThrowTypeError(context, "Compiler result is not a valid byte array");
    return 0;
  }
  uint8_t *copy = (uint8_t*)malloc(byteLength ? byteLength : 1);
  if (!copy) {
    JS_FreeValue(context, buffer);
    JS_FreeValue(context, result);
    JS_ThrowOutOfMemory(context);
    return 0;
  }
  memcpy(copy, bufferData + byteOffset, byteLength);
  JS_FreeValue(context, buffer);
  JS_FreeValue(context, result);
  *out_bytecode = copy;
  *out_bytecodeLength = byteLength;
  return 1;
}

static const char *type_name(mvm_TeType type) {
  switch (type) {
    case VM_T_UNDEFINED: return "undefined";
    case VM_T_NULL: return "null";
    case VM_T_BOOLEAN: return "boolean";
    case VM_T_NUMBER: return "number";
    case VM_T_STRING: return "string";
    case VM_T_FUNCTION: return "function";
    case VM_T_OBJECT: return "object";
    case VM_T_ARRAY: return "array";
    case VM_T_UINT8_ARRAY: return "Uint8Array";
    case VM_T_CLASS: return "class";
    case VM_T_SYMBOL: return "symbol";
    case VM_T_BIG_INT: return "bigint";
    default: return "unknown";
  }
}

static JSValue new_value_ref(MvmcVM *mvmc, mvm_Value value) {
  MvmcValueRef *reference = (MvmcValueRef*)calloc(1, sizeof(MvmcValueRef));
  if (!reference) return JS_ThrowOutOfMemory(mvmc->context);
  reference->owner = mvmc;
  mvm_initializeHandle(mvmc->vm, &reference->handle);
  mvm_handleSet(&reference->handle, value);
  JSValue result = JS_NewObjectClass(mvmc->context, mvmcValueClassID);
  if (JS_IsException(result)) {
    mvm_releaseHandle(mvmc->vm, &reference->handle);
    free(reference);
    return result;
  }
  JS_SetOpaque(result, reference);
  return result;
}

static void value_finalizer(JSRuntime *runtime, JSValue value) {
  (void)runtime;
  MvmcValueRef *reference = (MvmcValueRef*)JS_GetOpaque(value, mvmcValueClassID);
  if (!reference) return;
  if (reference->owner && reference->owner->vm) {
    mvm_releaseHandle(reference->owner->vm, &reference->handle);
  }
  free(reference);
}

static void array_iterator_finalizer(JSRuntime *runtime, JSValue value) {
  (void)runtime;
  MvmcArrayIterator *iterator = (MvmcArrayIterator*)JS_GetOpaque(value, mvmcArrayIteratorClassID);
  if (!iterator) return;
  if (iterator->owner && iterator->owner->vm) {
    mvm_arrayIteratorRelease(iterator->owner->vm, &iterator->iterator);
  }
  free(iterator);
}

static JSValue value_get_type(JSContext *context, JSValueConst thisValue) {
  MvmcValueRef *reference = (MvmcValueRef*)JS_GetOpaque2(context, thisValue, mvmcValueClassID);
  if (!reference) return JS_EXCEPTION;
  return JS_NewString(context, type_name(mvm_typeOf(reference->owner->vm, mvm_handleGet(&reference->handle))));
}

static JSValue value_to_number(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  MvmcValueRef *reference = (MvmcValueRef*)JS_GetOpaque2(context, thisValue, mvmcValueClassID);
  if (!reference) return JS_EXCEPTION;
  mvm_Value value = mvm_handleGet(&reference->handle);
  if (mvm_typeOf(reference->owner->vm, value) != VM_T_NUMBER) return JS_ThrowTypeError(context, "Value is not a Number");
  return JS_NewFloat64(context, (double)mvm_toFloat64(reference->owner->vm, value));
}

static JSValue value_to_boolean(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  MvmcValueRef *reference = (MvmcValueRef*)JS_GetOpaque2(context, thisValue, mvmcValueClassID);
  if (!reference) return JS_EXCEPTION;
  return JS_NewBool(context, mvm_toBool(reference->owner->vm, mvm_handleGet(&reference->handle)));
}

static JSValue value_to_string(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  MvmcValueRef *reference = (MvmcValueRef*)JS_GetOpaque2(context, thisValue, mvmcValueClassID);
  if (!reference) return JS_EXCEPTION;
  if (mvm_typeOf(reference->owner->vm, mvm_handleGet(&reference->handle)) != VM_T_STRING) {
    return JS_ThrowTypeError(context, "Value is not a String");
  }
  size_t length = 0;
  const char *text = mvm_toStringUtf8(reference->owner->vm, mvm_handleGet(&reference->handle), &length);
  return JS_NewStringLen(context, text, length);
}

static JSValue value_numeric(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  MvmcValueRef *reference = (MvmcValueRef*)JS_GetOpaque2(context, thisValue, mvmcValueClassID);
  if (!reference) return JS_EXCEPTION;
  mvm_NumericValue numeric;
  mvm_TeError error = mvm_getNumeric(reference->owner->vm, mvm_handleGet(&reference->handle), &numeric);
  if (error != MVM_E_SUCCESS) return JS_ThrowTypeError(context, "Value is not a Number");

  const char *kind = numeric.kind == MVM_NUM_ORDINARY ? "ordinary" :
    numeric.kind == MVM_NUM_SIGNED ? "signed" :
    numeric.kind == MVM_NUM_UNSIGNED ? "unsigned" : "float";
  JSValue result = JS_NewObject(context);
  JS_SetPropertyStr(context, result, "kind", JS_NewString(context, kind));
  JS_SetPropertyStr(context, result, "width", JS_NewInt32(context, numeric.width));
  JSValue numberValue;
  if (numeric.kind == MVM_NUM_SIGNED) numberValue = JS_NewBigInt64(context, numeric.value.i);
  else if (numeric.kind == MVM_NUM_UNSIGNED) numberValue = JS_NewBigUint64(context, numeric.value.u);
  else if (numeric.kind == MVM_NUM_FLOAT && numeric.width == 32) numberValue = JS_NewFloat64(context, numeric.value.f32);
  else if (numeric.kind == MVM_NUM_FLOAT) numberValue = JS_NewFloat64(context, numeric.value.f64);
  else numberValue = JS_NewFloat64(context, numeric.value.f64);
  JS_SetPropertyStr(context, result, "value", numberValue);
  return result;
}

static JSValue value_to_bytes(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  MvmcValueRef *reference = (MvmcValueRef*)JS_GetOpaque2(context, thisValue, mvmcValueClassID);
  if (!reference) return JS_EXCEPTION;
  uint8_t *data = NULL;
  size_t size = 0;
  mvm_TeError error = mvm_uint8ArrayToBytes(reference->owner->vm, mvm_handleGet(&reference->handle), &data, &size);
  if (error != MVM_E_SUCCESS) return JS_ThrowTypeError(context, "Value is not a Uint8Array");
  return JS_NewUint8ArrayCopy(context, data, size);
}

static JSValue array_iterator_symbol(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv);
static JSValue iterator_next(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv);
static JSValue iterator_self(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv);
static JSValue mvm_value_to_quickjs(MvmcVM *mvmc, mvm_Value value) {
  mvm_TeType type = mvm_typeOf(mvmc->vm, value);
  switch (type) {
    case VM_T_UNDEFINED: return JS_UNDEFINED;
    case VM_T_NULL: return JS_NULL;
    case VM_T_BOOLEAN: return JS_NewBool(mvmc->context, mvm_toBool(mvmc->vm, value));
    case VM_T_NUMBER: {
      mvm_NumericValue numeric;
      mvm_TeError error = mvm_getNumeric(mvmc->vm, value, &numeric);
      if (error != MVM_E_SUCCESS) return JS_ThrowInternalError(mvmc->context, "Could not read Microvium number");
      if (numeric.kind == MVM_NUM_ORDINARY) return JS_NewFloat64(mvmc->context, numeric.value.f64);
      return new_value_ref(mvmc, value);
    }
    case VM_T_STRING: {
      size_t length = 0;
      const char *text = mvm_toStringUtf8(mvmc->vm, value, &length);
      return JS_NewStringLen(mvmc->context, text, length);
    }
    case VM_T_ARRAY:
    case VM_T_OBJECT:
    case VM_T_UINT8_ARRAY:
      return new_value_ref(mvmc, value);
    case VM_T_FUNCTION:
    case VM_T_CLASS:
      return JS_ThrowTypeError(mvmc->context, "Functions and classes cannot cross the Microvium FFI boundary");
    default:
      return JS_ThrowTypeError(mvmc->context, "Unsupported Microvium value type: %s", type_name(type));
  }
}

static JSValue array_iterator_symbol(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  MvmcValueRef *value = (MvmcValueRef*)JS_GetOpaque2(context, thisValue, mvmcValueClassID);
  if (!value) return JS_EXCEPTION;
  if (mvm_typeOf(value->owner->vm, mvm_handleGet(&value->handle)) != VM_T_ARRAY) {
    return JS_ThrowTypeError(context, "Only Microvium arrays are iterable");
  }

  MvmcArrayIterator *iterator = (MvmcArrayIterator*)calloc(1, sizeof(MvmcArrayIterator));
  if (!iterator) return JS_ThrowOutOfMemory(context);
  iterator->owner = value->owner;
  mvm_TeError error = mvm_arrayIteratorInit(value->owner->vm, &iterator->iterator, mvm_handleGet(&value->handle));
  if (error != MVM_E_SUCCESS) {
    free(iterator);
    return JS_ThrowTypeError(context, "Could not iterate Microvium array (error %d)", error);
  }
  JSValue result = JS_NewObjectClass(context, mvmcArrayIteratorClassID);
  if (JS_IsException(result)) {
    mvm_arrayIteratorRelease(value->owner->vm, &iterator->iterator);
    free(iterator);
    return result;
  }
  JS_SetOpaque(result, iterator);
  return result;
}

static JSValue iterator_next(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  MvmcArrayIterator *iterator = (MvmcArrayIterator*)JS_GetOpaque2(context, thisValue, mvmcArrayIteratorClassID);
  if (!iterator) return JS_EXCEPTION;
  bool done = false;
  mvm_TeError error = mvm_arrayIteratorNext(iterator->owner->vm, &iterator->iterator, &done);
  if (error != MVM_E_SUCCESS) return JS_ThrowTypeError(context, "Microvium array iteration failed (error %d)", error);
  JSValue result = JS_NewObject(context);
  if (JS_IsException(result)) return result;
  if (JS_SetPropertyStr(context, result, "done", JS_NewBool(context, done)) < 0) {
    JS_FreeValue(context, result);
    return JS_EXCEPTION;
  }
  JSValue value = done
    ? JS_UNDEFINED
    : mvm_value_to_quickjs(iterator->owner, mvm_arrayIteratorValue(&iterator->iterator));
  if (JS_IsException(value)) {
    JS_FreeValue(context, result);
    return value;
  }
  if (JS_SetPropertyStr(context, result, "value", value) < 0) {
    JS_FreeValue(context, result);
    return JS_EXCEPTION;
  }
  return result;
}

static JSValue iterator_self(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  if (!JS_GetOpaque2(context, thisValue, mvmcArrayIteratorClassID)) return JS_EXCEPTION;
  return JS_DupValue(context, thisValue);
}

static int set_symbol_iterator(JSContext *context, JSValue object, JSCFunction *function, int length) {
  JSValue global = JS_GetGlobalObject(context);
  JSValue symbol = JS_GetPropertyStr(context, global, "Symbol");
  JS_FreeValue(context, global);
  if (JS_IsException(symbol)) return -1;
  JSValue iteratorSymbol = JS_GetPropertyStr(context, symbol, "iterator");
  JS_FreeValue(context, symbol);
  if (JS_IsException(iteratorSymbol)) return -1;
  JSAtom atom = JS_ValueToAtom(context, iteratorSymbol);
  JS_FreeValue(context, iteratorSymbol);
  if (atom == JS_ATOM_NULL) return -1;
  JSValue method = JS_NewCFunction(context, function, "[Symbol.iterator]", length);
  int result = JS_SetProperty(context, object, atom, method);
  JS_FreeAtom(context, atom);
  return result;
}

static const JSCFunctionListEntry mvmcValuePrototypeFunctions[] = {
  JS_CFUNC_DEF("toNumber", 0, value_to_number),
  JS_CFUNC_DEF("toBoolean", 0, value_to_boolean),
  JS_CFUNC_DEF("toString", 0, value_to_string),
  JS_CFUNC_DEF("numeric", 0, value_numeric),
  JS_CFUNC_DEF("toBytes", 0, value_to_bytes),
  JS_CGETSET_DEF2("type", value_get_type, NULL, JS_PROP_CONFIGURABLE | JS_PROP_ENUMERABLE),
};

static const JSCFunctionListEntry mvmcIteratorPrototypeFunctions[] = {
  JS_CFUNC_DEF("next", 0, iterator_next),
};

static const JSCFunctionListEntry mvmcVMPrototypeFunctions[] = {
  JS_CFUNC_DEF("callExport", 1, vm_controller_call_export),
  JS_CFUNC_DEF("exportNames", 0, vm_controller_export_names),
  JS_CFUNC_DEF("exportIDs", 0, vm_controller_export_ids),
  JS_CFUNC_DEF("getExport", 1, vm_controller_get_export),
};

static int initialize_classes(JSRuntime *runtime, JSContext *context) {
  JS_NewClassID(runtime, &mvmcValueClassID);
  JS_NewClassID(runtime, &mvmcArrayIteratorClassID);
  JS_NewClassID(runtime, &mvmcVMClassID);
  JSClassDef valueDefinition = { "MVMValue", .finalizer = value_finalizer };
  JSClassDef iteratorDefinition = { "MVMArrayIterator", .finalizer = array_iterator_finalizer };
  JSClassDef vmDefinition = { "MVMTestVM", NULL };
  if (JS_NewClass(runtime, mvmcValueClassID, &valueDefinition) < 0 ||
      JS_NewClass(runtime, mvmcArrayIteratorClassID, &iteratorDefinition) < 0 ||
      JS_NewClass(runtime, mvmcVMClassID, &vmDefinition) < 0) return 0;

  JSValue valuePrototype = JS_NewObject(context);
  if (JS_IsException(valuePrototype)) return 0;
  if (JS_SetPropertyFunctionList(context, valuePrototype, mvmcValuePrototypeFunctions,
      sizeof(mvmcValuePrototypeFunctions) / sizeof(mvmcValuePrototypeFunctions[0])) < 0) {
    JS_FreeValue(context, valuePrototype);
    return 0;
  }
  if (set_symbol_iterator(context, valuePrototype, array_iterator_symbol, 0) < 0) {
    JS_FreeValue(context, valuePrototype);
    return 0;
  }
  JS_SetClassProto(context, mvmcValueClassID, valuePrototype);

  JSValue iteratorPrototype = JS_NewObject(context);
  if (JS_IsException(iteratorPrototype)) return 0;
  if (JS_SetPropertyFunctionList(context, iteratorPrototype, mvmcIteratorPrototypeFunctions,
      sizeof(mvmcIteratorPrototypeFunctions) / sizeof(mvmcIteratorPrototypeFunctions[0])) < 0) {
    JS_FreeValue(context, iteratorPrototype);
    return 0;
  }
  if (set_symbol_iterator(context, iteratorPrototype, iterator_self, 0) < 0) {
    JS_FreeValue(context, iteratorPrototype);
    return 0;
  }
  JS_SetClassProto(context, mvmcArrayIteratorClassID, iteratorPrototype);

  JSValue vmPrototype = JS_NewObject(context);
  if (JS_IsException(vmPrototype)) return 0;
  if (JS_SetPropertyFunctionList(context, vmPrototype, mvmcVMPrototypeFunctions,
      sizeof(mvmcVMPrototypeFunctions) / sizeof(mvmcVMPrototypeFunctions[0])) < 0) {
    JS_FreeValue(context, vmPrototype);
    return 0;
  }
  JS_SetClassProto(context, mvmcVMClassID, vmPrototype);
  return 1;
}

static int quickjs_value_to_mvm(MvmcVM *mvmc, JSValueConst source, mvm_Handle *out, JSValueConst *ancestors, unsigned depth) {
  JSContext *context = mvmc->context;
  if (JS_IsUndefined(source)) {
    mvm_handleSet(out, mvm_undefined);
    return 1;
  }
  if (JS_IsNull(source)) {
    mvm_handleSet(out, mvm_null);
    return 1;
  }
  if (JS_IsBool(source)) {
    mvm_handleSet(out, mvm_newBoolean(JS_ToBool(context, source)));
    return 1;
  }
  if (JS_IsNumber(source)) {
    double number;
    if (JS_ToFloat64(context, &number, source) < 0) return 0;
    mvm_handleSet(out, mvm_newNumber(mvmc->vm, number));
    return 1;
  }
  if (JS_IsBigInt(source)) {
    size_t length = 0;
    const char *text = JS_ToCStringLen(context, &length, source);
    if (!text) return 0;
    char buffer[64];
    if (length == 0 || length >= sizeof(buffer)) {
      JS_FreeCString(context, text);
      set_host_error(mvmc, "BigInt FFI values must fit in 64 bits");
      return 0;
    }
    memcpy(buffer, text, length);
    buffer[length] = '\0';
    JS_FreeCString(context, text);
    errno = 0;
    char *end = NULL;
    mvm_NumericValue numeric;
    memset(&numeric, 0, sizeof(numeric));
    numeric.width = 64;
    if (buffer[0] == '-') {
      numeric.kind = MVM_NUM_SIGNED;
      numeric.value.i = strtoll(buffer, &end, 10);
    } else {
      numeric.kind = MVM_NUM_UNSIGNED;
      numeric.value.u = strtoull(buffer, &end, 10);
    }
    if (errno == ERANGE || end != buffer + length) {
      set_host_error(mvmc, "BigInt FFI values must fit in 64 bits");
      return 0;
    }
    mvm_Value value;
    if (mvm_newNumeric(mvmc->vm, &numeric, &value) != MVM_E_SUCCESS) {
      set_host_error(mvmc, "Snapshot does not support typed BigInt values");
      return 0;
    }
    mvm_handleSet(out, value);
    return 1;
  }
  if (JS_IsString(source)) {
    size_t length = 0;
    const char *text = JS_ToCStringLen(context, &length, source);
    if (!text) return 0;
    mvm_Value value = mvm_newString(mvmc->vm, text, length);
    JS_FreeCString(context, text);
    mvm_handleSet(out, value);
    return 1;
  }

  MvmcValueRef *wrapped = (MvmcValueRef*)JS_GetOpaque(source, mvmcValueClassID);
  if (wrapped) {
    if (wrapped->owner != mvmc) {
      set_host_error(mvmc, "A Microvium value cannot cross between VM instances");
      return 0;
    }
    mvm_TeType type = mvm_typeOf(mvmc->vm, mvm_handleGet(&wrapped->handle));
    if (type == VM_T_FUNCTION || type == VM_T_CLASS) {
      set_host_error(mvmc, "Functions and classes cannot cross the Microvium FFI boundary");
      return 0;
    }
    mvm_handleSet(out, mvm_handleGet(&wrapped->handle));
    return 1;
  }

  if (JS_IsArray(source)) {
    if (depth >= MVMC_MAX_ARRAY_DEPTH) {
      set_host_error(mvmc, "Array nesting exceeds the test runner limit");
      return 0;
    }
    for (unsigned i = 0; i < depth; i++) {
      if (JS_IsStrictEqual(context, source, ancestors[i])) {
        set_host_error(mvmc, "Cyclic host arrays cannot be copied into Microvium");
        return 0;
      }
    }
    JSValue lengthValue = JS_GetPropertyStr(context, source, "length");
    if (JS_IsException(lengthValue)) return 0;
    uint32_t length = 0;
    if (JS_ToUint32(context, &length, lengthValue) < 0) {
      JS_FreeValue(context, lengthValue);
      return 0;
    }
    JS_FreeValue(context, lengthValue);
    JSValueConst nestedAncestors[MVMC_MAX_ARRAY_DEPTH];
    for (unsigned i = 0; i < depth; i++) nestedAncestors[i] = ancestors[i];
    nestedAncestors[depth] = source;
    mvm_TeError error = mvm_newArray(mvmc->vm, out);
    if (error != MVM_E_SUCCESS) {
      set_host_error(mvmc, "Could not allocate Microvium array");
      return 0;
    }
    for (uint32_t i = 0; i < length; i++) {
      JSValue item = JS_GetPropertyUint32(context, source, i);
      if (JS_IsException(item)) return 0;
      mvm_Handle itemHandle = {0};
      mvm_initializeHandle(mvmc->vm, &itemHandle);
      int success = quickjs_value_to_mvm(mvmc, item, &itemHandle, nestedAncestors, depth + 1);
      JS_FreeValue(context, item);
      if (success) {
        error = mvm_arrayPush(mvmc->vm, out, &itemHandle);
        if (error != MVM_E_SUCCESS) {
          set_host_error(mvmc, error == MVM_E_ARRAY_TOO_LONG ? "Microvium arrays exceed the runtime's maximum length" : "Could not append to Microvium array");
          success = 0;
        }
      }
      mvm_releaseHandle(mvmc->vm, &itemHandle);
      if (!success) return 0;
    }
    return 1;
  }

  if (JS_IsObject(source) && JS_GetTypedArrayType(source) == JS_TYPED_ARRAY_UINT8) {
    size_t byteOffset = 0;
    size_t byteLength = 0;
    size_t bytesPerElement = 0;
    JSValue buffer = JS_GetTypedArrayBuffer(context, source, &byteOffset, &byteLength, &bytesPerElement);
    if (JS_IsException(buffer)) return 0;
    size_t bufferLength = 0;
    uint8_t *bufferData = JS_GetArrayBuffer(context, &bufferLength, buffer);
    if (!bufferData || byteOffset > bufferLength || byteLength > bufferLength - byteOffset) {
      JS_FreeValue(context, buffer);
      set_host_error(mvmc, "Invalid QuickJS Uint8Array buffer");
      return 0;
    }
    mvm_handleSet(out, mvm_uint8ArrayFromBytes(mvmc->vm, bufferData + byteOffset, byteLength));
    JS_FreeValue(context, buffer);
    return 1;
  }

  set_host_error(mvmc, "Only primitives, Microvium values, arrays, and Uint8Array cross the FFI boundary");
  return 0;
}

static MvmcImport *find_import(MvmcVM *mvmc, mvm_HostFunctionID id) {
  for (uint16_t i = 0; i < mvmc->importCount; i++) {
    if (mvmc->imports[i].id == id) return &mvmc->imports[i];
  }
  return NULL;
}

static MvmcExport *find_export(MvmcVM *mvmc, const char *name, size_t nameLength) {
  for (uint16_t i = 0; i < mvmc->exportCount; i++) {
    MvmcExport *item = &mvmc->exports[i];
    if (item->name && item->nameLength == nameLength && memcmp(item->name, name, nameLength) == 0) return item;
  }
  return NULL;
}

static MvmcExport *find_export_id(MvmcVM *mvmc, mvm_VMExportID id) {
  for (uint16_t i = 0; i < mvmc->exportCount; i++) {
    if (mvmc->exports[i].id == id) return &mvmc->exports[i];
  }
  return NULL;
}

static mvm_TeError store_import(MvmcVM *mvmc, mvm_HostFunctionID id, uint8_t argumentCount, bool fixedArity, JSValue function) {
  if (find_import(mvmc, id)) return MVM_E_FFI_ABI_ERROR;
  if (mvmc->importCount == UINT16_MAX) return MVM_E_RANGE_ERROR;
  if (mvmc->importCount == mvmc->importCapacity) {
    size_t newCapacity = mvmc->importCapacity ? mvmc->importCapacity * 2 : 8;
    if (newCapacity > UINT16_MAX) newCapacity = UINT16_MAX;
    MvmcImport *imports = (MvmcImport*)realloc(mvmc->imports, newCapacity * sizeof(MvmcImport));
    if (!imports) return MVM_E_MALLOC_FAIL;
    mvmc->imports = imports;
    mvmc->importCapacity = newCapacity;
  }
  MvmcImport *item = &mvmc->imports[mvmc->importCount++];
  item->id = id;
  item->argumentCount = argumentCount;
  item->fixedArity = fixedArity;
  item->function = function;
  return MVM_E_SUCCESS;
}

static mvm_TeError resolve_numeric_import(mvm_HostFunctionID id, void *context, mvm_TfHostFunction *out_handler) {
  MvmcVM *mvmc = (MvmcVM*)context;
  *out_handler = NULL;
  if (find_import(mvmc, id)) {
    *out_handler = host_import_handler;
    return MVM_E_SUCCESS;
  }
  JSValue function = JS_GetPropertyUint32(mvmc->context, mvmc->numericImports, id);
  if (JS_IsException(function)) {
    capture_quickjs_error(mvmc, mvmc->context);
    return MVM_E_HOST_ERROR;
  }
  if (!JS_IsFunction(mvmc->context, function)) {
    char message[96];
    snprintf(message, sizeof(message), "Unbound numeric import ID %u", id);
    set_host_error(mvmc, message);
    JS_FreeValue(mvmc->context, function);
    return MVM_E_UNRESOLVED_IMPORT;
  }
  mvm_TeError error = store_import(mvmc, id, 0, false, function);
  if (error != MVM_E_SUCCESS) {
    JS_FreeValue(mvmc->context, function);
    return error;
  }
  *out_handler = host_import_handler;
  return MVM_E_SUCCESS;
}

static mvm_TeError host_import_handler(mvm_VM *vm, mvm_HostFunctionID id, mvm_Value *result, mvm_Value *args, uint8_t argumentCount) {
  MvmcVM *mvmc = (MvmcVM*)mvm_getContext(vm);
  MvmcImport *import = find_import(mvmc, id);
  if (!import || (import->fixedArity && import->argumentCount != argumentCount)) {
    set_host_error(mvmc, "Import binding no longer matches its snapshot signature");
    return MVM_E_FFI_ABI_ERROR;
  }

  JSValue qjsArgs[MVMC_MAX_ARGUMENTS];
  for (uint8_t i = 0; i < argumentCount; i++) {
    qjsArgs[i] = mvm_value_to_quickjs(mvmc, args[i]);
    if (JS_IsException(qjsArgs[i])) {
      for (uint8_t j = 0; j < i; j++) JS_FreeValue(mvmc->context, qjsArgs[j]);
      capture_quickjs_error(mvmc, mvmc->context);
      return MVM_E_HOST_ERROR;
    }
  }

  JSValue hostResult = JS_Call(mvmc->context, import->function, JS_UNDEFINED, argumentCount, qjsArgs);
  for (uint8_t i = 0; i < argumentCount; i++) JS_FreeValue(mvmc->context, qjsArgs[i]);
  if (JS_IsException(hostResult)) {
    capture_quickjs_error(mvmc, mvmc->context);
    return MVM_E_HOST_ERROR;
  }

  mvm_Handle resultHandle = {0};
  mvm_initializeHandle(vm, &resultHandle);
  JSValueConst ancestors[MVMC_MAX_ARRAY_DEPTH];
  int converted = quickjs_value_to_mvm(mvmc, hostResult, &resultHandle, ancestors, 0);
  JS_FreeValue(mvmc->context, hostResult);
  if (!converted) {
    mvm_releaseHandle(vm, &resultHandle);
    return MVM_E_HOST_RETURNED_INVALID_VALUE;
  }
  *result = mvm_handleGet(&resultHandle);
  mvm_releaseHandle(vm, &resultHandle);
  return MVM_E_SUCCESS;
}

static JSValue get_property_by_bytes(JSContext *context, JSValueConst object, const uint8_t *text, size_t length) {
  JSValue key = JS_NewStringLen(context, (const char*)text, length);
  if (JS_IsException(key)) return key;
  JSAtom atom = JS_ValueToAtom(context, key);
  JS_FreeValue(context, key);
  if (atom == JS_ATOM_NULL) return JS_EXCEPTION;
  JSValue result = JS_GetProperty(context, object, atom);
  JS_FreeAtom(context, atom);
  return result;
}

static int bind_named_imports(MvmcVM *mvmc) {
  uint16_t count = 0;
  mvm_TeError error = mvm_getNamedImportCount(mvmc->vm, &count);
  if (error != MVM_E_SUCCESS) {
    fprintf(stderr, "Could not enumerate imports (Microvium error %d)\n", error);
    return 0;
  }
  size_t scratchSize = 0;
  error = mvm_getNamedFFIScratchSize(mvmc->vm, &scratchSize);
  if (error != MVM_E_SUCCESS) {
    fprintf(stderr, "Could not allocate FFI decoder scratch (Microvium error %d)\n", error);
    return 0;
  }
  uint8_t *scratch = (uint8_t*)malloc(scratchSize ? scratchSize : 1);
  if (!scratch) {
    fprintf(stderr, "Out of memory enumerating imports\n");
    return 0;
  }
  for (uint16_t i = 0; i < count; i++) {
    mvm_TsNamedImportInfo info;
    error = mvm_getNamedImport(mvmc->vm, i, scratch, scratchSize, &info);
    if (error != MVM_E_SUCCESS) {
      fprintf(stderr, "Could not read named import %u (Microvium error %d)\n", i, error);
      free(scratch);
      return 0;
    }
    if (info.signature.resultType != MVM_FFI_T_VALUE) {
      fprintf(stderr, "Unsupported return type in import %.*s:%.*s\n", (int)info.moduleNameSize, info.moduleName, (int)info.importNameSize, info.importName);
      free(scratch);
      return 0;
    }
    for (uint8_t p = 0; p < info.signature.argumentCount; p++) {
      if (info.signature.parameterTypes[p] != MVM_FFI_T_VALUE) {
        fprintf(stderr, "Unsupported parameter type in import %.*s:%.*s\n", (int)info.moduleNameSize, info.moduleName, (int)info.importNameSize, info.importName);
        free(scratch);
        return 0;
      }
    }

    JSValue module = get_property_by_bytes(mvmc->context, mvmc->hostImports, info.moduleName, info.moduleNameSize);
    if (JS_IsException(module)) {
      capture_quickjs_error(mvmc, mvmc->context);
      fprintf(stderr, "Could not resolve import module: %s\n", mvmc->hostError);
      free(scratch);
      return 0;
    }
    JSValue function = JS_IsObject(module)
      ? get_property_by_bytes(mvmc->context, module, info.importName, info.importNameSize)
      : JS_UNDEFINED;
    JS_FreeValue(mvmc->context, module);
    if (JS_IsException(function)) {
      capture_quickjs_error(mvmc, mvmc->context);
      fprintf(stderr, "Could not resolve import: %s\n", mvmc->hostError);
      free(scratch);
      return 0;
    }
    if (!JS_IsFunction(mvmc->context, function)) {
      fprintf(stderr, "Unbound import %.*s:%.*s\n", (int)info.moduleNameSize, info.moduleName, (int)info.importNameSize, info.importName);
      JS_FreeValue(mvmc->context, function);
      free(scratch);
      return 0;
    }
    JSValue arityValue = JS_GetPropertyStr(mvmc->context, function, "length");
    int32_t actualArity = -1;
    if (JS_IsException(arityValue) || JS_ToInt32(mvmc->context, &actualArity, arityValue) < 0) {
      JS_FreeValue(mvmc->context, arityValue);
      JS_FreeValue(mvmc->context, function);
      capture_quickjs_error(mvmc, mvmc->context);
      fprintf(stderr, "Could not inspect import arity: %s\n", mvmc->hostError);
      free(scratch);
      return 0;
    }
    JS_FreeValue(mvmc->context, arityValue);
    if (actualArity != info.signature.argumentCount) {
      fprintf(stderr, "Import %.*s:%.*s declares %u parameters, harness function has length %d\n",
        (int)info.moduleNameSize, info.moduleName, (int)info.importNameSize, info.importName,
        info.signature.argumentCount, actualArity);
      JS_FreeValue(mvmc->context, function);
      free(scratch);
      return 0;
    }

    error = store_import(mvmc, info.callID, info.signature.argumentCount, true, function);
    if (error != MVM_E_SUCCESS) {
      JS_FreeValue(mvmc->context, function);
      fprintf(stderr, "Could not store named import %.*s:%.*s (Microvium error %d)\n",
        (int)info.moduleNameSize, info.moduleName, (int)info.importNameSize, info.importName, error);
      free(scratch);
      return 0;
    }
    error = mvm_bindNamedImport(mvmc->vm, info.callID, info.signature.argumentCount, host_import_handler);
    if (error != MVM_E_SUCCESS) {
      fprintf(stderr, "Could not bind import %.*s:%.*s (Microvium error %d)\n",
        (int)info.moduleNameSize, info.moduleName, (int)info.importNameSize, info.importName, error);
      free(scratch);
      return 0;
    }
  }

  error = mvm_finalizeNamedImports(mvmc->vm);
  free(scratch);
  if (error != MVM_E_SUCCESS) {
    fprintf(stderr, "Named imports are incomplete (Microvium error %d)\n", error);
    return 0;
  }
  return 1;
}

static int load_named_exports(MvmcVM *mvmc) {
  uint16_t exportCount = 0;
  mvm_TeError error = mvm_getExportCount(mvmc->vm, &exportCount);
  if (error != MVM_E_SUCCESS) {
    fprintf(stderr, "Could not enumerate exports (Microvium error %d)\n", error);
    return 0;
  }
  mvmc->exportCount = exportCount;
  mvmc->exports = (MvmcExport*)calloc(exportCount ? exportCount : 1, sizeof(MvmcExport));
  if (!mvmc->exports) {
    fprintf(stderr, "Out of memory enumerating exports\n");
    return 0;
  }
  for (uint16_t i = 0; i < exportCount; i++) {
    error = mvm_getExportID(mvmc->vm, i, &mvmc->exports[i].id);
    if (error != MVM_E_SUCCESS) {
      fprintf(stderr, "Could not read export ID %u (Microvium error %d)\n", i, error);
      return 0;
    }
  }

  uint16_t namedExportCount = 0;
  error = mvm_getNamedExportCount(mvmc->vm, &namedExportCount);
  if (error != MVM_E_SUCCESS) {
    fprintf(stderr, "Could not enumerate named exports (Microvium error %d)\n", error);
    return 0;
  }
  size_t scratchSize = 0;
  error = mvm_getNamedFFIScratchSize(mvmc->vm, &scratchSize);
  if (error != MVM_E_SUCCESS) {
    fprintf(stderr, "Could not allocate FFI decoder scratch (Microvium error %d)\n", error);
    return 0;
  }
  uint8_t *scratch = (uint8_t*)malloc(scratchSize ? scratchSize : 1);
  if (!scratch) {
    free(scratch);
    fprintf(stderr, "Out of memory enumerating exports\n");
    return 0;
  }
  for (uint16_t i = 0; i < namedExportCount; i++) {
    mvm_TsNamedExportInfo info;
    error = mvm_getNamedExport(mvmc->vm, i, scratch, scratchSize, &info);
    if (error != MVM_E_SUCCESS) {
      fprintf(stderr, "Could not read named export %u (Microvium error %d)\n", i, error);
      free(scratch);
      return 0;
    }
    if (info.signature.resultType != MVM_FFI_T_VALUE) {
      fprintf(stderr, "Unsupported return type in export %.*s\n", (int)info.exportNameSize, info.exportName);
      free(scratch);
      return 0;
    }
    for (uint8_t p = 0; p < info.signature.argumentCount; p++) {
      if (info.signature.parameterTypes[p] != MVM_FFI_T_VALUE) {
        fprintf(stderr, "Unsupported parameter type in export %.*s\n", (int)info.exportNameSize, info.exportName);
        free(scratch);
        return 0;
      }
    }
    MvmcExport *item = find_export_id(mvmc, info.callID);
    if (!item || item->name) {
      fprintf(stderr, "Named export ID %u is missing or duplicated in the export table\n", info.callID);
      free(scratch);
      return 0;
    }
    item->argumentCount = info.signature.argumentCount;
    item->name = (char*)malloc((size_t)info.exportNameSize + 1);
    if (!item->name) {
      free(scratch);
      fprintf(stderr, "Out of memory copying export name\n");
      return 0;
    }
    memcpy(item->name, info.exportName, info.exportNameSize);
    item->name[info.exportNameSize] = '\0';
    item->nameLength = info.exportNameSize;
  }
  free(scratch);
  return 1;
}

static int restore_mvmc_vm(MvmcVM *mvmc, const uint8_t *snapshot, size_t snapshotLength) {
  mvmc->hostError[0] = '\0';
  mvm_TeError error = mvm_restoreNamed(&mvmc->vm, (MVM_LONG_PTR_TYPE)snapshot, snapshotLength, mvmc, resolve_numeric_import);
  if (error != MVM_E_SUCCESS) {
    if (mvmc->hostError[0]) fprintf(stderr, "Could not restore snapshot: %s (Microvium error %d)\n", mvmc->hostError, error);
    else fprintf(stderr, "Could not restore snapshot (Microvium error %d)\n", error);
    return 0;
  }
  if (!bind_named_imports(mvmc)) return 0;
  if (!load_named_exports(mvmc)) return 0;
  return 1;
}

static void free_mvmc_vm(MvmcVM *mvmc) {
  if (!mvmc) return;
  if (mvmc->vm) {
    mvm_free(mvmc->vm);
    mvmc->vm = NULL;
  }
  if (mvmc->context && mvmc->imports) {
    for (uint16_t i = 0; i < mvmc->importCount; i++) JS_FreeValue(mvmc->context, mvmc->imports[i].function);
  }
  if (mvmc->exports) {
    for (uint16_t i = 0; i < mvmc->exportCount; i++) free(mvmc->exports[i].name);
  }
  free(mvmc->imports);
  free(mvmc->exports);
  if (mvmc->context && !JS_IsUndefined(mvmc->hostImports)) JS_FreeValue(mvmc->context, mvmc->hostImports);
  if (mvmc->context && !JS_IsUndefined(mvmc->numericImports)) JS_FreeValue(mvmc->context, mvmc->numericImports);
  mvmc->imports = NULL;
  mvmc->exports = NULL;
  mvmc->importCount = 0;
  mvmc->exportCount = 0;
  mvmc->hostImports = JS_UNDEFINED;
  mvmc->numericImports = JS_UNDEFINED;
  mvmc->importCapacity = 0;
}

static int to_export_id(JSContext *context, JSValueConst value, mvm_VMExportID *out_id) {
  if (!JS_IsNumber(value)) {
    JS_ThrowTypeError(context, "Export ID must be a Number");
    return 0;
  }
  double number;
  if (JS_ToFloat64(context, &number, value) < 0) return 0;
  if (!isfinite(number) || number < 0 || number > UINT16_MAX || floor(number) != number) {
    JS_ThrowRangeError(context, "Export ID must be an integer from 0 to 65535");
    return 0;
  }
  *out_id = (mvm_VMExportID)number;
  return 1;
}

static JSValue vm_controller_call_export(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  MvmcVM *mvmc = (MvmcVM*)JS_GetOpaque2(context, thisValue, mvmcVMClassID);
  if (!mvmc) return JS_EXCEPTION;
  if (argc < 1) return JS_ThrowTypeError(context, "callExport expects a name or numeric ID");

  MvmcExport *exported = NULL;
  if (JS_IsString(argv[0])) {
    size_t nameLength = 0;
    const char *name = JS_ToCStringLen(context, &nameLength, argv[0]);
    if (!name) return JS_EXCEPTION;
    exported = find_export(mvmc, name, nameLength);
    JS_FreeCString(context, name);
    if (!exported) return JS_ThrowReferenceError(context, "Named export not found");
  } else {
    mvm_VMExportID id;
    if (!to_export_id(context, argv[0], &id)) return JS_EXCEPTION;
    exported = find_export_id(mvmc, id);
    if (!exported) return JS_ThrowReferenceError(context, "Export ID not found");
  }

  if (argc - 1 > MVMC_MAX_ARGUMENTS) return JS_ThrowRangeError(context, "Too many Microvium export arguments");
  uint8_t argumentCount = (uint8_t)(argc - 1);
  if (exported->name && argumentCount != exported->argumentCount) {
    return JS_ThrowTypeError(context, "Export expects %u arguments, received %u", exported->argumentCount, argumentCount);
  }

  mvm_Handle argumentHandles[MVMC_MAX_ARGUMENTS];
  mvm_Value arguments[MVMC_MAX_ARGUMENTS];
  memset(argumentHandles, 0, sizeof(argumentHandles));
  for (uint8_t i = 0; i < argumentCount; i++) mvm_initializeHandle(mvmc->vm, &argumentHandles[i]);
  JSValueConst ancestors[MVMC_MAX_ARRAY_DEPTH];
  mvmc->hostError[0] = '\0';
  int converted = 1;
  for (uint8_t i = 0; i < argumentCount; i++) {
    if (!quickjs_value_to_mvm(mvmc, argv[i + 1], &argumentHandles[i], ancestors, 0)) {
      converted = 0;
      break;
    }
    arguments[i] = mvm_handleGet(&argumentHandles[i]);
  }
  if (!converted) {
    for (uint8_t i = 0; i < argumentCount; i++) mvm_releaseHandle(mvmc->vm, &argumentHandles[i]);
    return JS_ThrowTypeError(context, "%s", mvmc->hostError[0] ? mvmc->hostError : "Could not convert export argument");
  }

  mvm_Handle result = {0};
  mvm_initializeHandle(mvmc->vm, &result);
  mvm_TeError error;
  if (exported->name) {
    error = mvm_callNamedExport(mvmc->vm, exported->id, mvm_handleAt(&result), arguments, argumentCount);
  } else {
    mvm_Value function;
    error = mvm_resolveExports(mvmc->vm, &exported->id, &function, 1);
    if (error == MVM_E_SUCCESS) error = mvm_call(mvmc->vm, function, mvm_handleAt(&result), arguments, argumentCount);
  }
  for (uint8_t i = 0; i < argumentCount; i++) mvm_releaseHandle(mvmc->vm, &argumentHandles[i]);
  if (error != MVM_E_SUCCESS) {
    if (error == MVM_E_UNCAUGHT_EXCEPTION) {
      JSValue exception = mvm_value_to_quickjs(mvmc, mvm_handleGet(&result));
      mvm_releaseHandle(mvmc->vm, &result);
      return JS_IsException(exception) ? exception : JS_Throw(context, exception);
    }
    const char *message = mvmc->hostError[0] ? mvmc->hostError : "Microvium export call failed";
    JSValue exception = JS_ThrowInternalError(context, "%s (Microvium error %d)", message, error);
    mvm_releaseHandle(mvmc->vm, &result);
    return exception;
  }
  JSValue output = mvm_value_to_quickjs(mvmc, mvm_handleGet(&result));
  mvm_releaseHandle(mvmc->vm, &result);
  return output;
}

static JSValue vm_controller_get_export(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  MvmcVM *mvmc = (MvmcVM*)JS_GetOpaque2(context, thisValue, mvmcVMClassID);
  if (!mvmc) return JS_EXCEPTION;
  if (argc != 1) return JS_ThrowTypeError(context, "getExport expects one numeric ID");
  mvm_VMExportID id;
  if (!to_export_id(context, argv[0], &id)) return JS_EXCEPTION;
  if (!find_export_id(mvmc, id)) return JS_ThrowReferenceError(context, "Export ID not found");
  mvm_Value value;
  mvm_TeError error = mvm_resolveExports(mvmc->vm, &id, &value, 1);
  if (error != MVM_E_SUCCESS) return JS_ThrowInternalError(context, "Could not resolve export ID %u (Microvium error %d)", id, error);
  return mvm_value_to_quickjs(mvmc, value);
}

static JSValue vm_controller_export_names(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  MvmcVM *mvmc = (MvmcVM*)JS_GetOpaque2(context, thisValue, mvmcVMClassID);
  if (!mvmc) return JS_EXCEPTION;
  JSValue names = JS_NewArray(context);
  if (JS_IsException(names)) return names;
  uint32_t nameIndex = 0;
  for (uint16_t i = 0; i < mvmc->exportCount; i++) {
    MvmcExport *item = &mvmc->exports[i];
    if (!item->name) continue;
    JSValue name = JS_NewStringLen(context, item->name, item->nameLength);
    if (JS_IsException(name) || JS_SetPropertyUint32(context, names, nameIndex++, name) < 0) {
      JS_FreeValue(context, names);
      return JS_EXCEPTION;
    }
  }
  return names;
}

static JSValue vm_controller_export_ids(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)argc; (void)argv;
  MvmcVM *mvmc = (MvmcVM*)JS_GetOpaque2(context, thisValue, mvmcVMClassID);
  if (!mvmc) return JS_EXCEPTION;
  JSValue ids = JS_NewArray(context);
  if (JS_IsException(ids)) return ids;
  for (uint16_t i = 0; i < mvmc->exportCount; i++) {
    JSValue id = JS_NewInt32(context, mvmc->exports[i].id);
    if (JS_SetPropertyUint32(context, ids, i, id) < 0) {
      JS_FreeValue(context, ids);
      return JS_EXCEPTION;
    }
  }
  return ids;
}

static JSValue new_vm_controller(MvmcVM *mvmc) {
  JSValue object = JS_NewObjectClass(mvmc->context, mvmcVMClassID);
  if (JS_IsException(object)) return object;
  JS_SetOpaque(object, mvmc);
  return object;
}

static JSValue print_function(JSContext *context, JSValueConst thisValue, int argc, JSValueConst *argv) {
  (void)thisValue;
  for (int i = 0; i < argc; i++) {
    if (i) fputc(' ', stdout);
    const char *text = JS_ToCString(context, argv[i]);
    if (!text) return JS_EXCEPTION;
    fputs(text, stdout);
    JS_FreeCString(context, text);
  }
  fputc('\n', stdout);
  fflush(stdout);
  return JS_UNDEFINED;
}

static int install_test_globals(JSContext *context) {
  JSValue global = JS_GetGlobalObject(context);
  JS_SetPropertyStr(context, global, "print", JS_NewCFunction(context, print_function, "print", 1));
  JSValue console = JS_NewObject(context);
  JS_SetPropertyStr(context, console, "log", JS_NewCFunction(context, print_function, "log", 1));
  JS_SetPropertyStr(context, global, "console", console);
  JS_FreeValue(context, global);
  const char prelude[] =
    "globalThis.assert = function (value, message) { if (!value) throw new Error(message || 'assertion failed'); };"
    "globalThis.assertEqual = function (actual, expected, message) { if (actual !== expected) throw new Error(message || ('expected ' + actual + ' === ' + expected)); };";
  JSValue result = JS_Eval(context, prelude, sizeof(prelude) - 1, "<microvium-test-prelude>", JS_EVAL_TYPE_GLOBAL);
  if (JS_IsException(result)) {
    print_quickjs_error(context);
    return 0;
  }
  JS_FreeValue(context, result);
  return 1;
}

static int evaluate_test_harness(MvmcVM *mvmc, const char *source, size_t sourceLength) {
  JSValue result = JS_Eval(mvmc->context, source, sourceLength, "<microvium-test-harness>", JS_EVAL_TYPE_GLOBAL);
  if (JS_IsException(result)) {
    print_quickjs_error(mvmc->context);
    return 0;
  }
  JS_FreeValue(mvmc->context, result);
  JSValue global = JS_GetGlobalObject(mvmc->context);
  mvmc->hostImports = JS_GetPropertyStr(mvmc->context, global, "hostImports");
  mvmc->numericImports = JS_GetPropertyStr(mvmc->context, global, "numericImports");
  JSValue testFunction = JS_GetPropertyStr(mvmc->context, global, "runTests");
  JS_FreeValue(mvmc->context, global);
  if (JS_IsUndefined(mvmc->hostImports)) mvmc->hostImports = JS_NewObject(mvmc->context);
  if (JS_IsUndefined(mvmc->numericImports)) mvmc->numericImports = JS_NewObject(mvmc->context);
  if (JS_IsException(mvmc->hostImports) || !JS_IsObject(mvmc->hostImports)) {
    fprintf(stderr, "Harness global hostImports must be an object\n");
    JS_FreeValue(mvmc->context, testFunction);
    return 0;
  }
  if (JS_IsException(mvmc->numericImports) || !JS_IsObject(mvmc->numericImports)) {
    fprintf(stderr, "Harness global numericImports must be an object\n");
    JS_FreeValue(mvmc->context, testFunction);
    return 0;
  }
  if (!JS_IsFunction(mvmc->context, testFunction)) {
    fprintf(stderr, "Harness must define runTests(vm)\n");
    JS_FreeValue(mvmc->context, testFunction);
    return 0;
  }
  JS_FreeValue(mvmc->context, testFunction);
  return 1;
}

static int run_harness(MvmcVM *mvmc) {
  JSValue global = JS_GetGlobalObject(mvmc->context);
  JSValue testFunction = JS_GetPropertyStr(mvmc->context, global, "runTests");
  JS_FreeValue(mvmc->context, global);
  JSValue controller = new_vm_controller(mvmc);
  if (JS_IsException(testFunction) || JS_IsException(controller)) {
    JS_FreeValue(mvmc->context, testFunction);
    JS_FreeValue(mvmc->context, controller);
    print_quickjs_error(mvmc->context);
    return 0;
  }
  JSValue result = JS_Call(mvmc->context, testFunction, JS_UNDEFINED, 1, &controller);
  JS_FreeValue(mvmc->context, controller);
  JS_FreeValue(mvmc->context, testFunction);
  if (JS_IsException(result)) {
    print_quickjs_error(mvmc->context);
    return 0;
  }
  if (JS_IsPromise(result)) {
    for (;;) {
      JSPromiseStateEnum state = JS_PromiseState(mvmc->context, result);
      if (state == JS_PROMISE_FULFILLED) break;
      if (state == JS_PROMISE_REJECTED) {
        JSValue reason = JS_PromiseResult(mvmc->context, result);
        const char *message = JS_ToCString(mvmc->context, reason);
        fprintf(stderr, "%s\n", message ? message : "Test harness promise rejected");
        if (message) JS_FreeCString(mvmc->context, message);
        JS_FreeValue(mvmc->context, reason);
        JS_FreeValue(mvmc->context, result);
        return 0;
      }
      JSContext *jobContext = NULL;
      int jobResult = JS_ExecutePendingJob(JS_GetRuntime(mvmc->context), &jobContext);
      if (jobResult < 0) {
        print_quickjs_error(jobContext ? jobContext : mvmc->context);
        JS_FreeValue(mvmc->context, result);
        return 0;
      }
      if (jobResult == 0) {
        fprintf(stderr, "runTests returned a pending Promise with no queued QuickJS jobs\n");
        JS_FreeValue(mvmc->context, result);
        return 0;
      }
    }
  }
  JS_FreeValue(mvmc->context, result);
  return 1;
}

static int initialize_mvmc(MvmcVM *mvmc) {
  mvmc->hostImports = JS_UNDEFINED;
  mvmc->numericImports = JS_UNDEFINED;
  mvmc->runtime = JS_NewRuntime();
  if (!mvmc->runtime) {
    fprintf(stderr, "Could not create QuickJS runtime\n");
    return 0;
  }
  JS_SetMemoryLimit(mvmc->runtime, 512u * 1024u * 1024u);
  JS_SetMaxStackSize(mvmc->runtime, 8u * 1024u * 1024u);
  mvmc->context = JS_NewContext(mvmc->runtime);
  if (!mvmc->context) {
    fprintf(stderr, "Could not create QuickJS context\n");
    return 0;
  }
  if (!initialize_classes(mvmc->runtime, mvmc->context) || !install_test_globals(mvmc->context)) {
    fprintf(stderr, "Could not initialize native runner globals\n");
    return 0;
  }

  JSValue compilerBytecode = JS_ReadObject(
    mvmc->context,
    mvm_compiler_bundle,
    sizeof(mvm_compiler_bundle) - 1,
    JS_READ_OBJ_BYTECODE
  );
  if (JS_IsException(compilerBytecode)) {
    print_quickjs_error(mvmc->context);
    fprintf(stderr, "Could not load embedded compiler bytecode\n");
    return 0;
  }
  JSValue compilerResult = JS_EvalFunction(mvmc->context, compilerBytecode);
  if (JS_IsException(compilerResult)) {
    print_quickjs_error(mvmc->context);
    fprintf(stderr, "Could not initialize embedded compiler\n");
    return 0;
  }
  JS_FreeValue(mvmc->context, compilerResult);

  JSValue global = JS_GetGlobalObject(mvmc->context);
  JSValue compileFunction = JS_GetPropertyStr(mvmc->context, global, "__mvmCompileSource");
  JS_FreeValue(mvmc->context, global);
  if (!JS_IsFunction(mvmc->context, compileFunction)) {
    JS_FreeValue(mvmc->context, compileFunction);
    fprintf(stderr, "Embedded compiler did not expose __mvmCompileSource\n");
    return 0;
  }
  /* Keep this on the global object. compile_source receives it through lookup. */
  JS_FreeValue(mvmc->context, compileFunction);
  return 1;
}

static JSValue get_compile_function(MvmcVM *mvmc) {
  JSValue global = JS_GetGlobalObject(mvmc->context);
  JSValue function = JS_GetPropertyStr(mvmc->context, global, "__mvmCompileSource");
  JS_FreeValue(mvmc->context, global);
  return function;
}

static int run_compile_command(MvmcVM *mvmc, const char *inputName, const char *outputName) {
  size_t sourceLength = 0;
  char *source = read_file(inputName, &sourceLength);
  if (!source) return 0;
  JSValue compileFunction = get_compile_function(mvmc);
  uint8_t *snapshot = NULL;
  size_t snapshotLength = 0;
  int compiled = !JS_IsException(compileFunction) &&
    compile_source(mvmc->context, compileFunction, source, sourceLength, &snapshot, &snapshotLength);
  JS_FreeValue(mvmc->context, compileFunction);
  free(source);
  if (!compiled) {
    print_quickjs_error(mvmc->context);
    fprintf(stderr, "Compilation failed\n");
    free(snapshot);
    return 0;
  }
  int written = write_file(outputName, snapshot, snapshotLength);
  free(snapshot);
  return written;
}

static int run_test_command(MvmcVM *mvmc, const char *sourceName, const char *harnessName) {
  size_t sourceLength = 0;
  size_t harnessLength = 0;
  char *source = read_file(sourceName, &sourceLength);
  if (!source) return 0;
  char *harness = read_file(harnessName, &harnessLength);
  if (!harness) {
    free(source);
    return 0;
  }

  JSValue compileFunction = get_compile_function(mvmc);
  uint8_t *snapshot = NULL;
  size_t snapshotLength = 0;
  int compiled = !JS_IsException(compileFunction) &&
    compile_source(mvmc->context, compileFunction, source, sourceLength, &snapshot, &snapshotLength);
  JS_FreeValue(mvmc->context, compileFunction);
  free(source);
  if (!compiled) {
    print_quickjs_error(mvmc->context);
    fprintf(stderr, "Compilation failed\n");
    free(snapshot);
    free(harness);
    return 0;
  }

  int success = evaluate_test_harness(mvmc, harness, harnessLength);
  free(harness);
  if (success) success = restore_mvmc_vm(mvmc, snapshot, snapshotLength);
  if (success) success = run_harness(mvmc);
  free_mvmc_vm(mvmc);
  free(snapshot);
  if (success) puts("runTests completed");
  return success;
}

static void free_mvmc(MvmcVM *mvmc) {
  free_mvmc_vm(mvmc);
  if (mvmc->context) {
    JS_FreeContext(mvmc->context);
    mvmc->context = NULL;
  }
  if (mvmc->runtime) {
    JS_FreeRuntime(mvmc->runtime);
    mvmc->runtime = NULL;
  }
}

static void print_usage(FILE *stream) {
  fprintf(stream,
    "Usage:\n"
    "  mvmc compile <source.js|-> [snapshot|-]\n"
    "  mvmc test <source.mvm.js> <harness.js>\n"
    "  mvmc help\n"
    "\n"
    "compile writes the snapshot to stdout when the output is omitted or '-'.\n"
    "test runs the harness's runTests(vm) function; see examples/native-mvmc.\n");
}

int main(int argc, char **argv) {
  if (argc < 2 || strcmp(argv[1], "help") == 0 || strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
    print_usage(argc < 2 ? stderr : stdout);
    return argc < 2 ? 2 : 0;
  }

  MvmcVM mvmc;
  memset(&mvmc, 0, sizeof(mvmc));
  mvmc.hostImports = JS_UNDEFINED;
  if (!initialize_mvmc(&mvmc)) {
    free_mvmc(&mvmc);
    return 1;
  }

  int success = 0;
  if (strcmp(argv[1], "compile") == 0 && (argc == 3 || argc == 4)) {
    success = run_compile_command(&mvmc, argv[2], argc == 4 ? argv[3] : "-");
  } else if (strcmp(argv[1], "test") == 0 && argc == 4) {
    success = run_test_command(&mvmc, argv[2], argv[3]);
  } else {
    print_usage(stderr);
    free_mvmc(&mvmc);
    return 2;
  }

  free_mvmc(&mvmc);
  return success ? 0 : 1;
}
