# Browser WebAssembly demo

The demo compiles Microvium source in the browser, restores the generated
snapshot in the C runtime compiled to WebAssembly, then calls an exported
function. Its sample also calls host import `1` from the Microvium program.

## Tool versions

Install the versions selected by [`mise.toml`](../mise.toml):

```sh
mise install
```

Mise selects Node `>=22.20.0, <22.21.0`, npm `>=10.9.0, <10.10.0`, and Python
`>=3.14.0, <3.15.0`. These ranges are encoded as Node `22.20`, npm `10.9`, and
Python `3.14` in the config. Python is needed by node-gyp to build the existing
native addon during npm installation. The browser compiler does not use
Python.

The native WebAssembly runtime build also requires Clang and wasm-ld from an
LLVM installation. The compiler WASM build downloads the pinned Javy 9.1.0
host release on first use. The fetch script maps x86_64 and AArch64 Linux,
macOS, and Windows hosts to the matching release asset and checks its SHA-256.
Javy labels its AArch64 assets `arm`.

## Build and run

From a clean checkout:

```sh
mise exec -- npm ci --lockfile-version=2
mise exec -- npm run build:web-demo
mise exec -- python -m http.server 8000 --directory dist-web
```

Open <http://127.0.0.1:8000/>. The generated files under `dist-web/` are
ignored by Git. The sample should report that host import `1` received `7` and
export `1` returned `28`.

## Verification

```sh
mise exec -- npm run test:compiler-wasm
mise exec -- npm run test:runtime-wasm
mise exec -- npm run test:web-integration
mise exec -- npm audit --audit-level=low
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
