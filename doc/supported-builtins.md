# Supported builtins

Microvium does not provide the full ECMAScript standard library. The globals
and methods below are the builtins currently supplied by the VM or its default
host setup. A custom host can provide additional globals.

## VM builtins

- `Infinity`, `NaN`, and `undefined` are available as globals.
- `Number.isNaN(value)` returns true only for NaN.
- `Number.kind(value)` returns `number`, `iN`, `uN`, `f32`, or `f64` for a
  number, and `undefined` for any other value.
- `Number.isInteger(value)` returns true for every typed integer, including
  exact 64-bit values above `2^53`. For ordinary Numbers and floating flavors,
  it is true only for finite integral values.
- `Reflect.ownKeys(object)` returns the own keys of a plain object. It rejects
  arrays, functions, and other non-plain values. Internal VM slots are not
  included.
- `Promise` is available for the VM's async functions. The VM implements the
  promise behavior needed by `async`, `await`, and the Promise constructor; it
  is not a full ECMAScript Promise library.

`typeof` reports `number` for every numeric flavor. Numeric `===` and `!==`
ignore flavor and compare values. See [Numeric types](./numeric-types.md) for
arithmetic, conversion, and precision rules.

## Microvium-specific globals

- `Microvium.newUint8Array(size)` creates a byte array with an integer length
  from 0 through 4092.
- `Microvium.typeCodeOf(value)` returns the Microvium type code for a value.
- `Microvium.numericKindOf(value)` and `Microvium.numericIsInteger(value)` are
  the underlying operations used by `Number.kind` and `Number.isInteger`.
- `Microvium.noOpFunction` is a function that returns `undefined` without
  doing work.

When the VM's default library is enabled, arrays also have `Array.prototype.push`.
There is no general Array method library; for example, `map`, `filter`, and
`join` are not provided.

## Host and compile-time globals

These are supplied by a host setup rather than being ECMAScript builtins:

- `vmImport(id)` and `vmExport(id, value)` register numeric FFI links while
  evaluating source at compile time.
- `console.log` is supplied by the default host setup. A program that needs it
  after restore must bind it through `vmImport`.
- `globalThis` is supplied by the default host setup as a proxy to the VM's
  compile-time globals. It is not a runtime global in a restored snapshot.
- `JSON.parse` and `JSON.stringify` are available in the default compile-time
  host setup; they are not runtime library functions.

For named imports and exports, see [Named FFI linking](../docs/named-ffi.md).
