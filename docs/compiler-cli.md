# Compiler command-line tools

The compiler CLI is a Node.js adapter around the compiler bundle. It reads
source from a file or stdin, then writes a Microvium snapshot to a file or
stdout. It does not need Wasmer, Wasmtime, or a WASI runtime.

Build the bundle and compile a file:

```sh
npm ci
npm run build:compiler-bundle
npm run compile -- test/end-to-end/tests/0.empty-export.test.mvm.js -o empty-export.mvm-bc
```

The compiler bundle defaults ordinary Number values to f64. Build with f32 as
the default using:

```sh
MVM_DEFAULT_FLOAT_WIDTH=32 npm run build:compiler-bundle
```

`MVM_DEFAULT_FLOAT_WIDTH` accepts `32` or `64`. A source file can override the
default with `/* microvium: default-float=f32 */` or
`/* microvium: default-float=f64 */`. One compiler and runtime support
explicit f32 and f64 values together. See [Numeric types](../doc/numeric-types.md)
for directive placement and arithmetic semantics.

Input defaults to stdin and output defaults to stdout when no input file is
given. `-o -` selects stdout explicitly:

```sh
cat source.mvm.js | npm run compile -- -o output.mvm-bc
npm run compile -- source.mvm.js
npm run compile -- source.mvm.js -o - > output.mvm-bc
```

## Browser compiler WebAssembly

The browser compiler is built from the same JavaScript bundle using Emscripten
and the vendored QuickJS-NG source. It exposes direct memory functions for
passing source and snapshot bytes. The output module has no imports.

```sh
npm run build:compiler-wasm
npm run test:compiler-wasm
npm run build:web-demo
```

`build:compiler-wasm` requires Clang on `PATH` to generate QuickJS bytecode and
`emcc` to build the WebAssembly module. Set `HOST_CC` or `EMCC` to use
different compiler commands. The vendored QuickJS-NG source is under
[`wasm-build/quickjs-ng`](../wasm-build/quickjs-ng).
