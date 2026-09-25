#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#include "wasmer.h"

extern const unsigned char compiler_wasmu_start[];
extern const unsigned char compiler_wasmu_end[];

static void usage(FILE *stream) {
  fprintf(stream,
    "Usage: microvium-compile [options] [input.js|-]\n\n"
    "Compile Microvium JavaScript source into a .mvm-bc snapshot using the\n"
    "embedded Wasmer AOT compiler. Input defaults to stdin; output defaults\n"
    "to stdout for stdin input, or to an adjacent .mvm-bc file for a named input.\n\n"
    "Options:\n"
    "  -o, --output FILE       Snapshot path, or - for stdout\n"
    "  -h, --help              Show this help\n");
}

static int fail_trap(const char *message, wasm_trap_t *trap) {
  if (trap) {
    wasm_message_t text;
    wasm_trap_message(trap, &text);
    fprintf(stderr, "%s: %s\n", message, text.data ? text.data : "Wasm trap");
    wasm_byte_vec_delete(&text);
    wasm_trap_delete(trap);
  } else {
    fprintf(stderr, "%s\n", message);
  }
  return 1;
}

static char *default_output(const char *input) {
  size_t input_length = strlen(input);
  size_t stem_length = input_length;
  const char *slash = strrchr(input, '/');
  const char *dot = strrchr(input, '.');

  if (input_length >= 7 && strcmp(input + input_length - 7, ".mvm.js") == 0) {
    stem_length -= 7;
  } else if (dot && (!slash || dot > slash)) {
    stem_length = (size_t)(dot - input);
  }

  char *result = malloc(stem_length + sizeof(".mvm-bc"));
  if (!result) return NULL;
  memcpy(result, input, stem_length);
  memcpy(result + stem_length, ".mvm-bc", sizeof(".mvm-bc"));
  return result;
}

int main(int argc, char **argv) {
  const char *input = "-";
  const char *output = NULL;
  int has_input = 0;

  for (int i = 1; i < argc; i++) {
    if (strcmp(argv[i], "--help") == 0 || strcmp(argv[i], "-h") == 0) {
      usage(stdout);
      return 0;
    } else if (strcmp(argv[i], "--output") == 0 || strcmp(argv[i], "-o") == 0) {
      if (++i >= argc) {
        fprintf(stderr, "%s requires a path\n", argv[i - 1]);
        return 2;
      }
      output = argv[i];
    } else if (strcmp(argv[i], "-") == 0 || argv[i][0] != '-') {
      if (has_input) {
        fprintf(stderr, "Expected at most one input file\n");
        return 2;
      }
      input = argv[i];
      has_input = 1;
    } else {
      fprintf(stderr, "Unknown option: %s\n", argv[i]);
      return 2;
    }
  }

  char *allocated_output = NULL;
  if (!output) {
    output = input[0] == '-' && input[1] == '\0' ? "-" : (allocated_output = default_output(input));
    if (!output) {
      fprintf(stderr, "Could not allocate output path\n");
      return 1;
    }
  }

  if (strcmp(input, "-") != 0 && !freopen(input, "rb", stdin)) {
    perror(input);
    free(allocated_output);
    return 1;
  }
  if (strcmp(output, "-") != 0 && !freopen(output, "wb", stdout)) {
    perror(output);
    free(allocated_output);
    return 1;
  }

  size_t module_size = (size_t)(compiler_wasmu_end - compiler_wasmu_start);
  wasm_config_t *config = wasm_config_new();
  wasm_config_set_backend(config, CRANELIFT);
  wasm_engine_t *engine = wasm_engine_new_with_config(config);
  if (!engine) {
    fprintf(stderr, "Could not initialize Wasmer engine\n");
    free(allocated_output);
    return 1;
  }

  wasm_store_t *store = wasm_store_new(engine);
  wasm_byte_vec_t bytes;
  wasm_byte_vec_new(&bytes, module_size, (const char *)compiler_wasmu_start);
  wasm_module_t *module = wasm_module_deserialize(store, &bytes);
  wasm_byte_vec_delete(&bytes);
  if (!module) {
    fprintf(stderr, "Could not load embedded Wasmer compiler module\n");
    free(allocated_output);
    return 1;
  }

  wasi_config_t *wasi_config = wasi_config_new(argv[0]);
  wasi_config_inherit_stdin(wasi_config);
  wasi_config_inherit_stdout(wasi_config);
  wasi_config_inherit_stderr(wasi_config);
  wasi_env_t *wasi_env = wasi_env_new(store, wasi_config);
  wasm_extern_vec_t imports = WASM_EMPTY_VEC;
  if (!wasi_get_imports(store, wasi_env, module, &imports)) {
    fprintf(stderr, "Could not initialize WASI imports\n");
    free(allocated_output);
    return 1;
  }

  wasm_trap_t *trap = NULL;
  wasm_instance_t *instance = wasm_instance_new(store, module, &imports, &trap);
  wasm_extern_vec_delete(&imports);
  if (!instance) {
    free(allocated_output);
    return fail_trap("Could not instantiate embedded compiler", trap);
  }
  if (!wasi_env_initialize_instance(wasi_env, store, instance)) {
    fprintf(stderr, "Could not initialize WASI instance\n");
    free(allocated_output);
    return 1;
  }

  wasm_func_t *start = wasi_get_start_function(instance);
  wasm_val_vec_t args = WASM_EMPTY_VEC;
  wasm_val_vec_t results = WASM_EMPTY_VEC;
  trap = wasm_func_call(start, &args, &results);
  if (trap) {
    free(allocated_output);
    return fail_trap("Compiler failed", trap);
  }

  if (strcmp(output, "-") != 0) {
    struct stat output_stat;
    if (stat(output, &output_stat) == 0) {
      fprintf(stderr, "Output generated: %s\n%lld bytes\n", output, (long long)output_stat.st_size);
    }
  }
  free(allocated_output);
  return 0;
}
