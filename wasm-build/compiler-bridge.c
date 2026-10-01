#include <quickjs.h>

#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "compiler-bundle.h"

static JSRuntime *runtime;
static JSContext *context;
static JSValue compile_function = JS_UNDEFINED;
static JSValue compile_result = JS_UNDEFINED;
static char error_buffer[4096];
static uint32_t error_length;

static void set_error(JSValueConst error) {
  size_t length = 0;
  const char *text = JS_ToCStringLen(context, &length, error);
  if (!text) {
    error_length = 0;
    return;
  }
  if (length >= sizeof(error_buffer)) length = sizeof(error_buffer) - 1;
  memcpy(error_buffer, text, length);
  error_buffer[length] = '\0';
  error_length = (uint32_t)length;
  JS_FreeCString(context, text);
}

static void set_exception(void) {
  JSValue exception = JS_GetException(context);
  set_error(exception);
  JS_FreeValue(context, exception);
}

int mvm_init(void) {
  if (context) return 0;

  runtime = JS_NewRuntime();
  if (!runtime) return 1;
  JS_SetMemoryLimit(runtime, 128u * 1024u * 1024u);
  JS_SetMaxStackSize(runtime, 2u * 1024u * 1024u);

  context = JS_NewContext(runtime);
  if (!context) return 2;

  JSValue eval_result = JS_Eval(
    context,
    mvm_compiler_bundle,
    sizeof(mvm_compiler_bundle) - 1,
    "<microvium-compiler>",
    JS_EVAL_TYPE_GLOBAL
  );
  if (JS_IsException(eval_result)) {
    set_exception();
    return 3;
  }
  JS_FreeValue(context, eval_result);

  JSValue global = JS_GetGlobalObject(context);
  compile_function = JS_GetPropertyStr(context, global, "__mvmCompileSource");
  JS_FreeValue(context, global);
  if (!JS_IsFunction(context, compile_function)) return 4;
  return 0;
}

int mvm_compile(uint8_t *source, uint32_t source_length) {
  if (!context || !JS_IsFunction(context, compile_function)) return 1;
  if (!JS_IsUndefined(compile_result)) {
    JS_FreeValue(context, compile_result);
    compile_result = JS_UNDEFINED;
  }
  error_length = 0;

  JSValue argument = JS_NewStringLen(context, (const char *)source, source_length);
  if (JS_IsException(argument)) {
    set_exception();
    return 2;
  }
  compile_result = JS_Call(context, compile_function, JS_UNDEFINED, 1, &argument);
  JS_FreeValue(context, argument);
  if (JS_IsException(compile_result)) {
    set_exception();
    JS_FreeValue(context, compile_result);
    compile_result = JS_UNDEFINED;
    return 3;
  }
  return 0;
}

uint8_t *mvm_result_pointer(void) {
  if (!context || JS_IsUndefined(compile_result)) return NULL;
  size_t byte_offset = 0;
  size_t byte_length = 0;
  size_t bytes_per_element = 0;
  JSValue buffer = JS_GetTypedArrayBuffer(
    context, compile_result, &byte_offset, &byte_length, &bytes_per_element
  );
  if (JS_IsException(buffer)) {
    JS_FreeValue(context, JS_GetException(context));
    return NULL;
  }
  uint8_t *data = JS_GetArrayBuffer(context, NULL, buffer);
  JS_FreeValue(context, buffer);
  return data ? data + byte_offset : NULL;
}

uint32_t mvm_result_size(void) {
  if (!context || JS_IsUndefined(compile_result)) return 0;
  size_t byte_offset = 0;
  size_t byte_length = 0;
  size_t bytes_per_element = 0;
  JSValue buffer = JS_GetTypedArrayBuffer(
    context, compile_result, &byte_offset, &byte_length, &bytes_per_element
  );
  if (JS_IsException(buffer)) {
    JS_FreeValue(context, JS_GetException(context));
    return 0;
  }
  JS_FreeValue(context, buffer);
  return byte_length > UINT32_MAX ? 0 : (uint32_t)byte_length;
}

uint8_t *mvm_error_pointer(void) { return (uint8_t *)error_buffer; }
uint32_t mvm_error_size(void) { return error_length; }

void *mvm_alloc(uint32_t size) { return malloc(size); }
void mvm_free(void *ptr) { free(ptr); }

/* Emscripten's standalone libc routes a few unused hosted calls through its
 * WASI syscall layer. This compiler never performs file I/O, so satisfy those
 * internal hooks locally instead of shipping a WASI import surface. */
__wasi_errno_t __wasi_fd_close(__wasi_fd_t fd) {
  (void)fd;
  return 0;
}

__wasi_errno_t __wasi_fd_write(
  __wasi_fd_t fd,
  const __wasi_ciovec_t *vectors,
  size_t vector_count,
  __wasi_size_t *written
) {
  (void)fd;
  (void)vectors;
  (void)vector_count;
  *written = 0;
  return 0;
}

int clock_gettime(clockid_t clock_id, struct timespec *time_value) {
  (void)clock_id;
  time_value->tv_sec = 0;
  time_value->tv_nsec = 0;
  return 0;
}

void emscripten_notify_memory_growth(size_t memory_index) {
  (void)memory_index;
}
