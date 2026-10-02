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
  from 0 through 8191. It supports numeric indexing and `.length`; it is not an
  ECMAScript `Uint8Array` backed by an `ArrayBuffer`. `ArrayBuffer` and the
  standard `DataView` API are not provided.
- `MicroviumBytes.readInteger(bytes, bitOffset, width, signed, littleEndian)`
  reads an `iN` or `uN` value from 1 to 64 bits. A field can start at any bit
  and span byte boundaries.
- `MicroviumBytes.writeInteger(bytes, bitOffset, width, value, littleEndian)`
  writes the low `width` bits of `value`, preserves surrounding bits, and
  returns `bytes`.
- `MicroviumBytes.readFloat(bytes, byteOffset, width, littleEndian)` reads an IEEE
  f32 or f64 value. `MicroviumBytes.writeFloat(bytes, byteOffset, width, value,
  littleEndian)` writes one and returns `bytes`.

`MicroviumBytes` is a separate global so snapshots only include this numeric
bytecode when they use the byte operations. Such snapshots require engine
minor 3.

The native runtime reads and writes the VM byte array directly; it does not
allocate a temporary VM buffer for these operations. For integer methods,
`littleEndian: true` maps the first addressed bit to the
least significant value bit and visits bits low-to-high inside each byte.
`false` visits bits high-to-low and maps the first addressed bit to the most
significant value bit. Float methods require byte offsets and widths of 32 or
64. Endianness and signedness arguments must be booleans. Reads return numeric
flavors (`iN`, `uN`, `f32`, or `f64`), so snapshots that use these methods carry
the numeric-types feature. Writes use the numeric conversion rules in
[Numeric types](./numeric-types.md).
- `Microvium.typeCodeOf(value)` returns the Microvium type code for a value.
- `Microvium.numericKindOf(value)` and `Microvium.numericIsInteger(value)` are
  the underlying operations used by `Number.kind` and `Number.isInteger`.
- `Microvium.noOpFunction` is a function that returns `undefined` without
  doing work.

```js
const packet = Microvium.newUint8Array(5000);
packet[4095] = 0xA5;
packet[4096] = 0x5A;
```

Pack fields across byte boundaries without building temporary arrays:

```js
const packet = Microvium.newUint8Array(3);
MicroviumBytes.writeInteger(packet, 0, 3, /*(u3)*/ 5, true);    // flags
MicroviumBytes.writeInteger(packet, 3, 10, /*(i10)*/ -17, true); // sensor delta
MicroviumBytes.writeInteger(packet, 13, 11, /*(u11)*/ 1400, true); // sample

const flags = MicroviumBytes.readInteger(packet, 0, 3, false, true);
const delta = MicroviumBytes.readInteger(packet, 3, 10, true, true);
const sample = MicroviumBytes.readInteger(packet, 13, 11, false, true);
```

`writeFloat` exposes the IEEE representation of a value in the byte array:

```js
const floatBytes = Microvium.newUint8Array(4);
MicroviumBytes.writeFloat(floatBytes, 0, 32, 1.5, true);
const floatBits = MicroviumBytes.readInteger(floatBytes, 0, 32, false, true); // 0x3FC00000
```

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
