# Compiler command-line tools

The WASI compiler can run through Wasmer or Wasmtime. Install the project
dependencies and build the compiler module:

```sh
mise exec -- npm ci
mise exec -- npm run build:compiler-wasm
```

The compiler build can choose the default float width for ordinary Number
values. It defaults to f64. Build with an f32 ordinary Number default using:

```sh
MVM_DEFAULT_FLOAT_WIDTH=32 mise exec -- npm run build:compiler-wasm
```

`MVM_DEFAULT_FLOAT_WIDTH` accepts only `32` or `64`. The build writes this
compiler default to `dist-web/compiler-config.json`. It does not configure the
runtime: one compiler and runtime support explicit f32 and f64 values together.
Source files can override the ordinary Number default with the
`/* microvium: default-float=f32 */` or `/* microvium: default-float=f64 */`
header directive. See [Numeric types](../doc/numeric-types.md) for the
directive's placement rules and the arithmetic semantics.

The build fetches the pinned Javy executable for the host if it is not already
present.
Install Wasmer or Wasmtime separately and make its command available on `PATH`.
The WASI CLI prefers Wasmer, then falls back to Wasmtime.

Compile a source file from the checkout with the WASI CLI:

```sh
mise exec -- npm run compile:wasm -- test/end-to-end/tests/0.empty-export.test.mvm.js -o dist-web/empty-export.mvm-bc
```

The npm package builds and includes the WASI module when it is packed. Its
installed `microvium-compile` command is a Node.js wrapper that runs the WASI
module:

```sh
microvium-compile source.mvm.js -o output.mvm-bc
```

Input defaults to stdin and output defaults to stdout when no input file is
given. `-o -` selects stdout explicitly. Select a runtime with `--runtime`:

```sh
cat source.mvm.js | mise exec -- microvium-compile -o output.mvm-bc
mise exec -- microvium-compile --runtime wasmer test/end-to-end/tests/0.empty-export.test.mvm.js -o dist-web/empty-export.mvm-bc
mise exec -- microvium-compile --runtime wasmtime test/end-to-end/tests/0.empty-export.test.mvm.js -o - > dist-web/empty-export.mvm-bc
```

## Native Linux ELF

Build a host-matched Linux ELF that embeds Wasmer's AOT-compiled compiler:

```sh
mise exec -- npm run build:compiler
dist-native/microvium-compile test/end-to-end/tests/0.empty-export.test.mvm.js -o dist-native/empty-export.mvm-bc
```

`npm run build:compiler` builds the WASI module and then compiles it with
Wasmer's Cranelift backend, embedding that compiled module in
`dist-native/microvium-compile`. The executable accepts a source file or stdin
and writes a `.mvm-bc` snapshot. By default, it dynamically links to
`libwasmer.so` from the Wasmer installation used at build time. Select static
linking to embed Wasmer in the ELF as well:

```sh
mise exec -- npm run build:compiler -- --link static
dist-native/microvium-compile-static test/end-to-end/tests/0.empty-export.test.mvm.js -o dist-native/empty-export.mvm-bc
```

Static mode produces a larger executable and removes the runtime dependency on
`libwasmer.so`. Both modes are host-specific and currently build on Linux only.

The generated `.mvm-bc` file is a Microvium snapshot. This command compiles the
source; it does not execute the snapshot.
