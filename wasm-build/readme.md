# Microvium runtime WASM

Build with the installed Clang and LLD tools:

```sh
npm run build:runtime-wasm
npm run test:runtime-wasm
```

The output is `wasm-build/build/microvium-runtime.wasm`. It imports a four-page
WebAssembly memory and three functions from `env`: `mvm_wasm_host_import(id,
number)`, `fmod(a, b)`, and `pow(a, b)`. The C runtime reserves one aligned 64kB
page for VM RAM and one for snapshot bytes. Other memory holds the C globals
and stack.

The browser-facing exports are:

- `mvm_wasm_snapshot_buffer()` and `mvm_wasm_snapshot_capacity()` provide the
  byte range where JavaScript copies the compiled snapshot.
- `mvm_wasm_restore(length)` restores that snapshot and returns a Microvium
  error code, with zero for success.
- `mvm_wasm_call_export(id, number)` resolves and calls an export with one
  numeric argument. It returns a Microvium error code.
- `mvm_wasm_result_pointer()` points to a little-endian float result.
- `mvm_wasm_free()` releases the restored VM.

The initial ABI supports numeric arguments and results. The shared host import
callback receives the Microvium host-function ID and one numeric argument, and
returns one number. The caller owns the memory and must register the imported
functions when it instantiates the module.
