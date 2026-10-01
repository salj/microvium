# Browser WebAssembly demo

The demo compiles Microvium source in the browser, restores the generated
snapshot in the C runtime compiled to WebAssembly, then calls an exported
function. The compiler module has no imports. The runtime module imports only
WebAssembly memory and `mvm_wasm_host_import`; its math functions are linked
into the module.

## Requirements

Install the versions selected by [`mise.toml`](../mise.toml):

```sh
mise install
```

The builds need Node.js, Clang, `wasm-ld`, and Emscripten (`emcc`). Python is
needed by node-gyp when npm installs the native addon; neither WebAssembly
build uses Python. The compiler bytecode builder uses Clang as its host C
compiler; set `HOST_CC` to select another one. Set `EMCC` if Emscripten is not
on `PATH`.

## Build and run

From a clean checkout:

```sh
mise exec -- npm ci
mise exec -- npm run build:web-demo
mise exec -- python -m http.server 8000 --directory dist-web
```

Open <http://127.0.0.1:8000/>. The generated files under `dist-web/` are
ignored by Git. The sample should report that host import `1` received `7` and
export `1` returned `28`.

The compiler WASM embeds source-free QuickJS-NG bytecode generated from the
JavaScript compiler bundle. QuickJS-NG is vendored under
[`wasm-build/quickjs-ng`](../wasm-build/quickjs-ng), so the compiler build does
not fetch a runner or require a WASI host. The wrapper passes source and
snapshots directly through the WebAssembly memory buffer.

## Verification

```sh
mise exec -- npm run test:compiler-wasm
mise exec -- npm run test:runtime-wasm
mise exec -- npm run test:web-integration
```

The browser-independent integration test uses the same compiler and runtime
wrappers as the page. `THIRD_PARTY.md` records the packages redistributed in
the generated browser deliverable and their licenses.

## ABI limits

The browser runtime wrapper accepts one numeric argument when calling an
exported function and returns one numeric result. A host import also accepts
one numeric argument and must return a number. The wrapper does not provide
general object or string marshalling, nor does the browser compiler expose
Microvium's debugger.

The JavaScript and WebAssembly boundary transports binary64 numbers and does
not preserve a Microvium numeric flavor. On input, the C glue calls
`mvm_newNumber`, which applies the snapshot's ordinary-number default. On
output, it calls `mvm_toFloat64`. An exact typed integer above `2^53` can lose
precision when returned through this wrapper. The VM and C API support wider
exact numeric values; this limit is specific to the browser wrapper ABI.
