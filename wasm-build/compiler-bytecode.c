#include <quickjs.h>

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static void report_exception(JSContext *context) {
  JSValue exception = JS_GetException(context);
  const char *message = JS_ToCString(context, exception);
  fprintf(stderr, "%s\n", message ? message : "QuickJS bytecode compilation failed");
  if (message) JS_FreeCString(context, message);
  JS_FreeValue(context, exception);
}

int main(int argc, char **argv) {
  if (argc != 3) {
    fprintf(stderr, "usage: %s input.js output.qbc\n", argv[0]);
    return 2;
  }

  FILE *input = fopen(argv[1], "rb");
  if (!input) {
    fprintf(stderr, "Could not open compiler bundle: %s\n", argv[1]);
    return 3;
  }
  if (fseek(input, 0, SEEK_END) != 0) {
    fprintf(stderr, "Could not seek compiler bundle: %s\n", argv[1]);
    fclose(input);
    return 3;
  }
  long input_length = ftell(input);
  if (input_length < 0 || fseek(input, 0, SEEK_SET) != 0) {
    fprintf(stderr, "Could not read compiler bundle: %s\n", argv[1]);
    fclose(input);
    return 3;
  }

  char *source = malloc((size_t)input_length + 1);
  if (!source) {
    fclose(input);
    return 4;
  }
  size_t bytes_read = fread(source, 1, (size_t)input_length, input);
  fclose(input);
  if (bytes_read != (size_t)input_length) {
    fprintf(stderr, "Short read from compiler bundle: %s\n", argv[1]);
    free(source);
    return 4;
  }
  source[input_length] = '\0';

  JSRuntime *runtime = JS_NewRuntime();
  if (!runtime) {
    free(source);
    return 5;
  }
  JSContext *context = JS_NewContext(runtime);
  if (!context) {
    free(source);
    JS_FreeRuntime(runtime);
    return 5;
  }

  JSValue function = JS_Eval(
    context,
    source,
    (size_t)input_length,
    "<microvium-compiler>",
    JS_EVAL_TYPE_GLOBAL | JS_EVAL_FLAG_COMPILE_ONLY
  );
  free(source);
  if (JS_IsException(function)) {
    report_exception(context);
    JS_FreeContext(context);
    JS_FreeRuntime(runtime);
    return 6;
  }

  size_t bytecode_length = 0;
  uint8_t *bytecode = JS_WriteObject(
    context,
    &bytecode_length,
    function,
    JS_WRITE_OBJ_BYTECODE | JS_WRITE_OBJ_STRIP_SOURCE | JS_WRITE_OBJ_STRIP_DEBUG
  );
  JS_FreeValue(context, function);
  if (!bytecode || !bytecode_length) {
    report_exception(context);
    JS_FreeContext(context);
    JS_FreeRuntime(runtime);
    return 7;
  }

  FILE *output = fopen(argv[2], "wb");
  if (!output || fwrite(bytecode, 1, bytecode_length, output) != bytecode_length) {
    fprintf(stderr, "Could not write compiler bytecode: %s\n", argv[2]);
    if (output) fclose(output);
    free(bytecode);
    JS_FreeContext(context);
    JS_FreeRuntime(runtime);
    return 8;
  }
  if (fclose(output) != 0) {
    fprintf(stderr, "Could not close compiler bytecode: %s\n", argv[2]);
    free(bytecode);
    JS_FreeContext(context);
    JS_FreeRuntime(runtime);
    return 8;
  }

  /* JS_NewRuntime uses QuickJS's default libc allocator. */
  free(bytecode);
  JS_FreeContext(context);
  JS_FreeRuntime(runtime);
  return 0;
}
