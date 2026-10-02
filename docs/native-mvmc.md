# Native compiler and FFI runner

`mvmc` is a native executable that embeds the JavaScript compiler in QuickJS-NG
and links the Microvium C runtime. It builds without Emscripten and does not
load the compiler WASM at runtime. The host executable reads source and harness
files; the embedded compiler receives source strings and has no filesystem API.

Build it with:

```sh
npm run build:mvmc
```

Set `MVM_DEFAULT_FLOAT_WIDTH=32` before building to use binary32 as the
compiler's default ordinary-number width. The default is 64.

The executable is `dist-native/mvmc`. For example:

```sh
dist-native/mvmc compile examples/native-mvmc/arrays-and-numerics.mvm.js out.mvm
dist-native/mvmc test examples/native-mvmc/arrays-and-numerics.mvm.js examples/native-mvmc/arrays-and-numerics.harness.js
```

Copy that file onto `PATH` as `mvmc` to install it for your user. On Linux,
`install -m 755 dist-native/mvmc ~/.local/bin/mvmc` does the copy.

`compile` reads `-` from stdin and writes to stdout if the output path is
omitted or `-`. The npm script forwards arguments too:

```sh
npm run mvmc -- test source.mvm.js harness.js
```

## Test harness API

The harness is ordinary JavaScript evaluated by QuickJS. Define `hostImports`
as a nested module/name object for named FFI, and `numericImports` as an object
keyed by numeric call IDs for `vmImport(id)`. Then define `runTests(vm)`. Every
named import must exist and its function's `length` must match the declared FFI
arity. Numeric imports keep their variable-arity behavior.

`vm.callExport(name, ...args)` invokes a named Microvium export;
`vm.callExport(id, ...args)` calls a numeric export; `vm.getExport(id)` reads a
numeric export value that is not a function. Functions and classes still cannot
cross as returned values. `vm.exportNames()` lists named exports and
`vm.exportIDs()` lists all numeric IDs, including IDs assigned to named exports.

The runner provides `assert`, `assertEqual`, `print`, and `console.log`. A
returned Promise is pumped through QuickJS's pending job queue. There are no
timers or external event loop.

Ordinary values cross as JavaScript primitives. Typed numeric values cross as
`MVMValue` objects; call `.numeric()` to inspect the exact kind, width, and
payload. Integer payloads are `BigInt`, so widths above 53 bits remain exact.
Microvium arrays cross as lazy iterable `MVMValue` objects. Nested arrays are
iterable the same way. Use `for..of` to keep memory proportional to the
consumer's working set; `Array.from` materializes only when the harness asks
for it. Plain host arrays returned by an import are copied recursively into
Microvium arrays. Cyclic arrays are rejected. Functions and classes cannot
cross the boundary; other Microvium references stay opaque.

The [array and numeric example](../examples/native-mvmc/arrays-and-numerics.mvm.js)
checks named and numeric imports/exports, nested streaming, arrays returned by
the host, binary32/binary64 values, and signed and unsigned integers with widths
from 12 to 64 bits.

On Linux, `NATIVE_MVMC_STATIC=1 npm run build:mvmc` asks the linker for a static
binary. This only works when the host toolchain has its static system libraries
installed. Otherwise the executable is dynamically linked to the platform C
runtime.
