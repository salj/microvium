# Numeric types

Microvium numbers can carry an explicit numeric flavor. A flavor belongs to the
number value, not to a variable declaration, so it survives assignment,
function calls, object properties, and array elements. Every flavor still has
`typeof value === "number"`.

`iN` is a signed integer flavor and `uN` an unsigned integer flavor, for widths
1 through 64 bits. `f32` and `f64` are explicit binary32 and binary64 floating
flavors. An unannotated value is an ordinary Number; its default floating
precision is configured separately below.

## Boundaries and casts

Numeric annotations are single-line block comments. A bare flavor comment sets
a **numeric boundary** for the complete expression that follows:

```js
const sample = /*u12*/ 4095;
const ratio = /*f32*/ 1.25;
const signed = /*i7*/ -64;
```

A boundary gives numeric operations inside the expression an evaluation
context and converts the expression's final result to the annotated flavor.
Ordinary operands inherit that context at each numeric operation. An explicit
operand can promote an operation beyond the context; the final boundary
conversion still applies. This means an `f32` boundary rounds ordinary
operands and intermediate operations as f32, then rounds the final value to
f32.

A parenthesized flavor comment is a **cast**. It converts the next operand,
without setting a context for the surrounding operation. A parenthesized
operand lets the cast cover a compound expression:

```js
/* microvium: default-float=f64 */
const base = 16777216;
const castOfFirstSum = /*(f32)*/ (base + 1) - base; // 0
const castOfWholeExpression = /*(f32)*/ (base + 1 - base); // 1
const f32Boundary = /*f32*/ (base + 1 - base); // 0
```

The first cast covers only `base + 1`, rounds it to f32, then subtracts `base`.
The second cast covers the entire parenthesized expression, evaluates it in the
surrounding f64 default, gets `1`, then converts that result to f32. The bare
boundary evaluates both operations in f32, where `base + 1` rounds back to
`base`.

A boundary must cover a complete expression slot, such as a variable
initializer, return value, call argument, or array element. If it would annotate
only one operand inside a larger expression, the compiler asks you to
parenthesize that expression. A cast binds to the next tight operand; use
parentheses to make its scope obvious. `//` comments are not numeric
annotations.

Use a bare integer boundary for an integer literal that must be read exactly:

```js
const aboveBinary64IntegerPrecision = /*u64*/ 9007199254740993;
```

The compiler reads the literal digits under the integer boundary. A cast cannot
recover digits already rounded when an unannotated literal was parsed as an
ordinary Number.

## Arithmetic and conversion

- Same-signed integer operands use the wider operand width. The result wraps to
  that width. Mixing signed and unsigned integer flavors is an error; convert
  explicitly when that is intended.
- Integer `/` truncates toward zero; `%` is the remainder from that division.
  Division and remainder by zero raise a numeric error. Integer `**` wraps at
  the result width and rejects negative exponents.
- Integer conversions truncate finite floating values toward zero, then wrap
  modulo `2^N`. Signed values use the two's-complement range for that width.
  NaN and infinity cannot be converted to an integer.
- A typed integer combined with an explicit f32 or f64 value promotes to that
  float flavor; f32 combined with f64 promotes to f64. Outside a narrower
  numeric context, an ordinary Number uses the file's default precision, so
  combining it with explicit f32 is f64 in an f64-default file. f32 rounds
  after each typed operation; f64 uses binary64 arithmetic. Converting a wide
  integer to a float can lose low bits.
- Typed shifts use the left operand's width. Negative shift counts are errors;
  counts at least as large as the width produce zero, except signed `>>` of a
  negative value produces `-1`. `>>>` produces an unsigned result of the same
  width.
- Numeric comparisons ignore flavor. Integer comparisons stay exact at 64
  bits, including values above `2^53`.

An ordinary Number mixed with a typed integer needs a numeric context when the
compiler can determine that combination statically. A boundary supplies that
context. Explicit f32/f64 values can be mixed with integers and produce a
floating result.

Numeric flavors do not add `Math.*` functions or flavor-preserving overloads.
See [supported builtins](./supported-builtins.md) for the functions Microvium
provides.

The Microvium byte-array numeric methods read integer fields as exact `iN` or
`uN` values, including widths above binary64's exact-integer range. Fields can
start at any bit and cross byte boundaries; writes preserve bits outside the
field. Writes convert the input to the requested width, truncate finite floats
toward zero, and keep the low bits. The native runtime operates directly on
Microvium's byte array without allocating a temporary VM buffer.

## Ordinary Number precision

The compiler's ordinary Number default is f64 unless built with
`MVM_DEFAULT_FLOAT_WIDTH=32`. A source file can override that setting with one
header directive:

```js
/* microvium: default-float=f32 */
```

Use `default-float=f64` for binary64. Only one directive is allowed; it must
appear before source code, though whitespace, a shebang, and comments may
precede it. It sets the ordinary Number default for that file. It does not give
each ordinary value an explicit `f32` or `f64` flavor, and explicit flavors can
coexist in either mode. The compiler build option is described in
[Compiler command-line tools](../docs/compiler-cli.md).

Snapshots using an explicit numeric flavor, f32 ordinary-number mode, or a
per-file default that differs from the compiler build default require a runtime
with numeric-types support (engine minor version 1). Legacy f64-only snapshots
use engine minor version 0 and still run on the newer runtime.

The compiler API accepts `allowNumericTypes: false` to reject any source that
requires this feature. The `microvium-compile` CLI exposes the same restriction
as `--no-numeric-types`. With the restriction enabled, use the f64 ordinary
Number default; explicit numeric annotations and per-file precision overrides
fail compilation instead of silently changing their semantics.

## Introspection

`Number.kind(value)` returns `"number"`, `"iN"`, `"uN"`, `"f32"`, or `"f64"`
for a Number, and `undefined` for a non-number. `Number.isInteger` returns true
for typed integers, including exact 64-bit values above `2^53`; for other
values, it returns true only for finite integral Numbers. Numeric `===` and
`!==` compare values and ignore flavor.

See [supported builtins](./supported-builtins.md) for the short API reference.
[`examples/mixed-numeric-types.mvm.js`](../examples/mixed-numeric-types.mvm.js)
is an executable example covering mixed precision, the boundary/cast
distinction, integer wrapping and promotion, and exact wide-integer comparison.
The end-to-end suite runs it in both the reference and native VMs.

## C API and external interfaces

The C API provides `mvm_newNumeric` and `mvm_getNumeric` to construct and inspect
exact flavors without converting integer payloads through a host double. The
older `mvm_newNumber` and `mvm_toFloat64` APIs use binary64; converting a typed
integer above `2^53` with `mvm_toFloat64` can lose precision. See the
[C interface guide](./ffi-guide.md).

The browser wrapper also passes arguments and results through binary64 and
does not preserve numeric flavor. See its [ABI limits](../docs/browser-wasm.md).
