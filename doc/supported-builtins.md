# Supported Builtins

### Standard builtin functions and objects

`Reflect.ownKeys` - returns an array of keys for an object (only supported on non-array, non-function objects)

### Numeric introspection

`Number.kind(value)` returns the semantic numeric flavor: `number` for an
ordinary Number, `iN` or `uN` for a typed integer, and `f32` or `f64` for an
explicit float. It returns `undefined` for non-numbers.

`Number.isInteger(value)` returns true for every typed integer, including exact
64-bit values above `2^53`. For ordinary Numbers and floating flavors it is true
only for finite integral values; it returns false for non-numbers.

`typeof` remains `"number"` for every numeric flavor. Numeric `===` and `!==`
ignore flavor and compare numeric values. The VM's physical storage choice is
not exposed by these builtins. See [Numeric types](./numeric-types.md) for
arithmetic, conversion, and precision rules.

## Additional builtin function and objects

### vmExport(id, func)

Export a function to be accessible to the host at the given ID.

The ID can be any integer in the range 0 to 65535.

(This function is only available at compile-time)

### vmImport(id)

Import a host function to be accessed by JS code in the VM.

The ID can be any integer in the range 0 to 65535.

(This function is only available at compile-time)

### Microvium.newUint8Array(size)

Create a Uint8Array buffer with the given size. Sizes up to 4095 bytes are supported.
