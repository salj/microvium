# Microvium Mixed Numeric Types Design

## Goal

Replace Microvium's current configurable FP32/FP64 implementation with one runtime and bytecode model that can represent and execute mixed numeric semantics while remaining recognizably JavaScript at the language boundary. The configurable-float branch is an intermediate implementation, not a compatibility surface: this design supersedes its build-time float-width semantics and its `FF_FLOAT32` wire-format flag.

The design adds:

- ordinary JavaScript `Number` with a configurable default floating precision;
- explicit `f32` and `f64` Number flavors;
- explicit signed and unsigned integer Number flavors `iN` and `uN` for any width `1..64`;
- source annotations and casts expressed through semantic comments, so existing JavaScript parsing remains usable;
- exact fixed-width integer arithmetic, including odd widths such as `u12` or `i37`;
- hybrid bytecode execution: specialized typed operations when the compiler knows enough, generic runtime dispatch when it does not;
- flavor-preserving heap values, snapshots, FFI, and debugging introspection;
- backward compatibility for released pre-configurable-float 8.0 snapshots, with an engine-minor compatibility gate for the new format. The unreleased configurable-float snapshot format is not a compatibility surface and requires no migration or recognition logic.

This is intentionally not a static type system. Numeric flavor belongs to values and expression boundaries, not to JavaScript bindings.

## Baseline

The current branch already contains an intermediate configurable-float implementation:

- `MVM_FLOAT_WIDTH` selects either `float` or `double` at C compile time;
- `FF_FLOAT32` (feature bit 2) records snapshot floating width;
- the TypeScript VM has a `floatWidth` option and rounds FP32 operations through `Math.fround`;
- snapshot encoding writes non-integral `NumberValue` allocations as either 32-bit or 64-bit float payloads;
- the native VM has one configured `TC_REF_FLOAT` representation;
- int14 immediates and boxed signed int32 values remain existing storage optimizations for ordinary Number values.

This design replaces that model rather than layering another feature on top of it. `MVM_FLOAT_WIDTH` ceases to select Number semantics, `FF_FLOAT32` is removed from the new wire format, and feature bit 2 is reassigned to the new numeric-types capability.

The current bytecode engine is major version 8, minor version 0. The new format requires engine minor 1. The native runtime already accepts snapshots whose required minor version is less than or equal to the runtime minor version; the TypeScript decoder currently checks minor equality and must be corrected as part of this work. New encoders must write the minimum required engine minor for the features actually used rather than blindly writing the encoder's own current minor.

The existing public C API in this branch exposes `MVM_FLOAT` through `mvm_toFloat` and `mvm_newNumber`. Before the configurable-width work, the stable host boundary was `double`/`mvm_toFloat64`. Mixed precision makes a build-selected public floating ABI undesirable, so the new design returns the convenience API to a stable `double` boundary and adds an exact typed numeric API alongside it.

## Semantic Model

### JavaScript-visible identity

Every numeric value remains a JavaScript Number:

```js
typeof /*u12*/ 3      // "number"
typeof /*i7*/ -3      // "number"
typeof /*f32*/ 1.5    // "number"
typeof /*f64*/ 1.5    // "number"
```

No new JavaScript primitive types are introduced. `instanceof Number` retains normal JavaScript behavior and remains unrelated to numeric flavor.

Internally, a Number has one semantic flavor:

```text
ordinary Number
Integer(signedness, width=1..64)
Float(width=32|64)
```

Useful internal category relationships are:

```text
u12 is a Number, Integer, UnsignedInteger
i17 is a Number, Integer, SignedInteger
f32 is a Number, Float
```

These categories are implementation concepts for dispatch and diagnostics, not user-visible classes.

### Flavor is independent of physical representation

Semantic flavor must never be inferred from the storage optimization used for a value.

An ordinary Number `3` may use an int14 immediate while remaining semantically ordinary. A `u12(3)` may eventually use an equally compact carrier under a proven specialized path, but it remains semantically `u12`. Heap layout, immediate encoding, or native register width never changes language behavior.

This distinction is mandatory because otherwise arithmetic semantics could change when a value crosses an allocation threshold or an optimizer chooses a different representation.

### Bindings remain dynamically typed

Annotations do not type variables, properties, parameters, or other bindings:

```js
let x = /*u12*/ 3;
x = /*f64*/ 1.5;
x = "banana";
```

All are legal. The values have flavor; `x` does not.

The compiler may infer flavor for temporaries or bindings while optimizing a region, but this information is non-observable and may be forgotten at any point. Losing compiler knowledge falls back to runtime flavor dispatch, not to a language error.

A future typed frontend may choose to interpret syntax such as `x: u12` as a typed binding, but that is outside this design and must not be required by the core VM.

## Source Syntax

The source compiler recognizes semantic numeric comments in a dedicated annotation pass rather than reusing the existing lossy `leadingComments` diagnostic plumbing. Numeric annotations use the exact compact forms shown below and may not contain a line terminator; this avoids accidental interaction with JavaScript automatic semicolon insertion.

### Numeric boundaries

Bare annotations establish a numeric evaluation context and guarantee the flavor of the value leaving the boundary:

```js
/*u12*/ expr
/*i7*/ expr
/*f32*/ expr
/*f64*/ expr
```

Examples:

```js
let sample = /*u12*/ adcRaw;
return /*f64*/ x * scale + offset;
foo(/*i17*/ a - b);
```

A bare annotation is deliberately low-precedence. It applies to the whole expression value in the surrounding syntactic slot, such as an initializer, assignment RHS, return expression, function argument, array element, object-property value, or conditional arm.

A bare annotation may also precede an explicitly parenthesized subexpression:

```js
a + /*u12*/ (b * c)
```

A bare annotation in an otherwise ambiguous operand position is rejected:

```js
a + /*u12*/ b * c   // error
```

Use either the parenthesized subexpression above or the cast form below.

The boundary supplies its type as the default for otherwise-unflavored arithmetic under that expression, but explicit flavored values still participate according to promotion rules. The boundary finally converts the resulting value to its declared flavor.

For example, with an outer `f32` boundary, an explicit `f64` operand can make an inner operation execute as f64; the outer boundary then rounds the final result back to f32.

### Numeric casts

Parenthesized annotation names are cast-like prefix operators:

```js
/*(u12)*/ expr
/*(i7)*/ expr
/*(f32)*/ expr
/*(f64)*/ expr
```

They bind tightly to the following operand. The operand is evaluated under its existing context and only the resulting value is converted.

For example:

```js
let x = /*(f64)*/ a * b;
```

casts `a` to f64 and then performs the surrounding multiplication according to normal promotion. To cast an entire expression, parenthesize it explicitly:

```js
let x = /*(f64)*/ (a * b);
```

### Default floating precision

The compiler has a project/default floating precision, f32 or f64. A source file may override it with one header directive:

```js
/* microvium: default-float=f32 */
```

The directive is legal only as a file-header directive. There is no mutable mid-file pragma state.

The snapshot header retains one default floating mode for compact generic operations. In numeric-types snapshots this is no longer encoded by a feature flag. Engine-minor-1 snapshots repurpose the header byte currently named `reserved` as `numericOptions`; bit 0 selects ordinary-Number default f32 when set and f64 when clear, and all other bits are initially required to be zero. `numericOptions` is meaningful only when `FF_NUMERIC_TYPES` is set. Engine-minor-0 snapshots continue to require that byte to be zero.

If a compilation unit uses a different file default, operations that require runtime context encode that source-level default explicitly in bytecode rather than changing global VM state.

## Integer Types

Integers are parametric rather than an enum of blessed C widths:

```text
iN, uN where 1 <= N <= 64
```

Examples include `u1`, `i7`, `u12`, `u24`, `i31`, `u37`, `i63`, and `u64`.

The semantic width is independent of the implementation storage bucket. A `u12` remains a 12-bit unsigned integer even if represented using a 16-bit or 32-bit C object.

### Same-signedness promotion

For binary integer arithmetic with the same signedness:

```text
result width = max(lhs.width, rhs.width)
```

This applies to addition, subtraction, multiplication, division, remainder, and bitwise operations unless an operator has a more specific rule below.

Examples:

```text
u12 + u20 -> u20
u12 * u20 -> u20
i7  + i19 -> i19
```

Multiplication does not automatically widen to the sum of operand widths. A widened product must be requested explicitly with a boundary or cast.

### Modular arithmetic

Typed integer arithmetic has true fixed-width semantics. Results are reduced modulo `2^N` at the operation result width.

Examples:

```js
/*u12*/ 4095 + 1   // 0
/*i12*/  2047 + 1  // -2048
/*u8*/  -1         // 255
```

Signed values use two's-complement interpretation. Native C signed overflow must not be relied upon; the implementation performs arithmetic through defined unsigned operations, masking, and sign extension as needed.

### Signed and unsigned mixing

Implicit signed/unsigned integer arithmetic is forbidden:

```js
/*i12*/ a + /*u12*/ b   // error if known statically
```

If such a combination is discovered only at runtime through a generic operation, the VM raises the corresponding numeric-type error.

The programmer must choose the intended interpretation explicitly with a cast or boundary.

This intentionally does not reproduce C's usual arithmetic conversions.

### Division and remainder

Integer division truncates toward zero. Remainder is defined consistently with truncating division.

Division or remainder by zero raises a runtime numeric error. If constant folding proves the case statically, compilation fails instead.

Signed `min / -1` is computed mathematically and then reduced to the fixed result width, so it has defined wrapping behavior rather than C undefined behavior.

### Shifts

The RHS of a shift is a count and does not participate in width promotion.

For a typed integer LHS:

```text
x << n    -> preserves x flavor
x >> n    -> arithmetic for signed x, logical for unsigned x
x >>> n   -> logical shift; signed x yields unsigned same-width result
```

Negative shift counts are errors.

For `n >= width`:

- left shift returns zero;
- logical right shift returns zero;
- arithmetic right shift returns all sign bits.

These semantics are explicit and do not inherit C implementation-defined or undefined shift behavior.

### Unary and compound operations

Unary `~`, unary `-`, `++`, `--`, and compound assignments preserve or promote flavor according to the same numeric rules as their corresponding primitive operations.

Bindings remain dynamic:

```js
let x = /*u8*/ 255;
x++;             // x now contains u8(0)
x = "string";    // still legal
```

Postfix increment/decrement returns the previous flavored value.

## Float Types

Explicit float flavors are:

```text
f32
f64
```

f32 operations use binary32 semantics at each typed operation or boundary. They must not be implemented as binary64 arithmetic followed by a final cast when that would change intermediate rounding. The native runtime therefore uses actual `float` operations and the appropriate libc functions where required; the reference VM uses `Math.fround` at the corresponding semantic points.

f64 operations use binary64 semantics.

Promotion is:

```text
f32 + f32 -> f32
f32 + f64 -> f64
f64 + f64 -> f64
```

Integer plus float promotes to the float flavor:

```text
iN/uN + f32 -> f32
iN/uN + f64 -> f64
```

Conversions from sufficiently wide integers may lose precision. The conversion is allowed and is not a runtime error; optional conversion warnings are outside this design.

Explicitly flavored NaN and negative zero retain their flavor and must not collapse to flavorless canonical immediates:

```js
Number.kind(/*f32*/ NaN) // "f32"
Number.kind(/*f32*/ -0)  // "f32"
```

Ordinary NaN and negative zero retain the existing canonical representations.

## Ordinary Number Semantics and Context

An ordinary Number remains JavaScript-like and uses the configured default floating precision when floating representation is required.

Untyped integer literals inside a typed numeric boundary may inherit that boundary context:

```js
/*u12*/ x + 1
```

Here the literal `1` is contextually u12 rather than first becoming an ordinary floating Number.

Outside an explicit numeric boundary, mixing a statically known typed integer with a statically known ordinary Number is diagnosed as surprising implicit conversion and requires an explicit cast or boundary. This rule does not apply to contextually typed literals.

If runtime values are genuinely dynamic and the compiler cannot know the flavors, generic dispatch remains legal. Outside an explicit numeric context, an ordinary Number mixed with a typed integer follows ordinary/default-float promotion.

Inside a numeric boundary, generic operations carry the boundary's default numeric context. Ordinary operands are interpreted under that context, while explicitly flavored runtime operands retain their stronger semantic flavor and participate in the normal promotion rules. This distinction requires a context-aware generic bytecode path in addition to fully specialized typed operations.

Typed arithmetic boundaries do not perform JavaScript string/object coercion. A non-Number encountered where a numeric boundary or typed numeric operator requires a Number raises a numeric-type error. Outside a typed numeric context, the existing generic `+` operator retains normal JavaScript coercion/concatenation behavior.

Typed bitwise and shift semantics apply to Integer flavors. An explicitly flavored Float used by a typed bitwise/shift operation requires an explicit integer cast. Ordinary unflavored Number bitwise operations outside a typed numeric context retain existing JavaScript/Microvium behavior.

## Comparison and Equality

Numeric flavor does not participate in JavaScript numeric equality or ordering.

Examples:

```js
(/*u12*/ 3) === (/*i16*/ 3)   // true
(/*f32*/ 3) === (/*f64*/ 3)   // true
(/*i12*/ -1) < (/*u12*/ 1)    // true
```

Comparisons operate on the exact represented numeric values. In particular, `i64` and `u64` values must not be coerced through binary64 before comparison.

NaN retains normal JavaScript comparison behavior. `Object.is` retains its ordinary JavaScript distinctions for NaN and signed zero at the value level; numeric flavor is not part of the equality relation.

## Conversion Semantics

Explicit integer conversions are fully defined:

```text
float -> iN/uN:
    truncate toward zero
    reduce modulo 2^N
    interpret signedness

integer -> iN/uN:
    reduce modulo 2^N
    interpret signedness

integer -> float:
    IEEE conversion, possibly lossy

f64 -> f32:
    IEEE binary32 rounding

f32 -> f64:
    exact widening
```

NaN or infinity converted to an integer raises a numeric conversion error.

Examples:

```js
/*(u12)*/ -1.9   // 4095
/*(i12)*/ 4095   // -1
```

## Debug Introspection

Expose one intentionally small semantic introspection API:

```js
Number.kind(value)
```

It returns:

```text
"number" for ordinary Number
"u12", "i7", "u64", ... for integer flavors
"f32" or "f64" for float flavors
```

`Number.kind` exposes semantic flavor only. It does not expose boxing, payload bucket width, immediate representation, or other storage details. When called with a non-Number, it returns `undefined`; this keeps it convenient for debugging unknown dynamic values without turning it into a coercion operation.

Existing JavaScript mechanisms retain their normal meaning:

- `typeof` returns `"number"` for all numeric flavors;
- `Number.isInteger` tests mathematical integrality and should work exactly for flavored wide integers;
- equality ignores flavor as described above.

## IL Representation

Numeric semantics are first-class IL, not metadata hidden in the existing `staticInfo` escape hatch.

The IL gains concepts equivalent to:

```text
NumericType =
    Integer { signed, width }
    Float { width }

NumericBoundary(type, expression)
NumericCast(type, expression)
NumericBinOp(type-or-context, op)
NumericUnOp(type-or-context, op)
```

Existing generic `BinOp` remains the ordinary JavaScript operation.

The compiler propagates numeric flavor opportunistically. If the result type is statically known, it emits a specialized typed operation. If operands are not known well enough, it emits a generic runtime operation, optionally with a numeric context descriptor when required by a boundary or per-file default.

Compiler analysis is an optimization only. It does not establish source-level binding types.

## Compiler Exactness

### Exact integer literals

Typed integer literals must not pass through JavaScript `number` before their exact value is captured.

For example:

```js
/*u64*/ 9007199254740993
```

must preserve the exact integer rather than becoming `9007199254740992` during parsing/lowering.

The compiler reparses the literal's raw source text and uses JavaScript `bigint` or an equivalent exact internal representation for typed integer literals and constant folding. Hexadecimal, binary, octal, decimal, and numeric separators are all handled through the exact path.

Ordinary untyped literals preserve existing JavaScript Number semantics.

### Constant folding

Typed integer constant folding uses exact integer arithmetic and reduces to the target width after every typed operation.

Typed f32 constant folding rounds at the same semantic points as runtime f32 execution. Typed f64 folding uses binary64 semantics.

Constant folding, specialized bytecode execution, and generic runtime dispatch must be semantically identical.

### Static diagnostics

The compiler rejects cases it can prove are invalid or need an explicit conversion, including:

- integer widths outside `1..64`;
- floating widths other than 32 or 64;
- statically known signed/unsigned integer mixing;
- division or remainder by zero when constant;
- negative constant shift counts;
- statically known non-Number operands at typed numeric boundaries;
- explicitly evident ordinary Number plus typed integer mixes outside an explicit numeric context when an explicit conversion is required for clarity.

Diagnostics that affect whether source is legal may depend on explicit syntax, literal form, and local constant evaluation, but not on opportunistic optimizer/flow inference. Optimization-only knowledge must never make previously legal source fail to compile. Equivalent dynamically discovered cases are handled by runtime dispatch and errors.

## Bytecode Execution Model

The runtime uses a hybrid execution strategy.

### Specialized typed operations

When the compiler knows the operation's numeric semantics, it emits a typed extended instruction conceptually equivalent to:

```text
NUM_ADD u20
NUM_MUL i12
NUM_DIV u37
NUM_ADD f32
NUM_SHR i17
```

The current extended-4 opcode space is a suitable home for the initial implementation. A typed instruction consists of an extended opcode plus a compact numeric descriptor.

A one-byte descriptor is sufficient for the language model:

- integer class;
- signedness;
- integer width minus one in six bits for `1..64`;
- float class with f32/f64 subtype.

This avoids an opcode explosion for arbitrary integer widths.

Common `i32`, `u32`, `f32`, or `f64` forms may later receive denser dedicated encodings if measurement justifies them. Such shortcuts are bytecode optimizations only and do not alter language semantics.

### Generic runtime operations

Existing generic numeric operations remain for ordinary JavaScript and for dynamic values whose flavors cannot be proven statically.

For numeric-type snapshots, generic dispatch examines runtime Number flavor and applies the same promotion/error rules as the specialized path.

Inside a numeric boundary or compilation unit whose numeric default differs from the snapshot default, a context-aware generic opcode carries the preferred numeric context. This allows an unknown ordinary Number to inherit the source expression's context while still allowing an explicitly flavored dynamic operand to promote the operation according to its actual flavor.

The specialized and generic paths are two implementations of one semantic model, not separate language modes.

## Runtime Value Representation

### Tagged flavored Numbers

In numeric-types snapshots, any non-immediate Number that uses heap type code `0x2` is represented as a tagged Number allocation containing:

```text
numeric descriptor
payload
```

The descriptor records semantic class, signedness, and width where semantic flavor has one. It also distinguishes an ordinary Number payload from an explicitly flavored Float. Ordinary Number payloads may physically be binary32 or binary64 as required to preserve their current value, but `Number.kind` still reports `"number"`; the storage width is not semantic flavor. The payload uses convenient storage buckets rather than mirroring every source width:

```text
integer width 1..16       -> 16-bit payload
integer width 17..32      -> 32-bit payload
integer width 33..64      -> 64-bit payload
explicit f32              -> 32-bit payload
explicit f64              -> 64-bit payload
ordinary floating Number  -> 32- or 64-bit payload as encoded
```

Heap alignment may make some smaller payloads occupy a full VM word; this is an implementation detail.

The allocation descriptor should use a full VM word internally even though bytecode operation descriptors fit in one byte. Saving one byte inside an aligned allocation is not worth constraining future representation changes.

### Type-code use

The heap type-code namespace is already constrained. Do not spend one type code per numeric flavor.

Reuse the current non-container numeric type code `0x2`:

- legacy snapshots interpret it as the existing configured-width `TC_REF_FLOAT` payload;
- snapshots advertising the new numeric-types capability interpret it as a tagged `TC_REF_NUMBER` payload.

Internally the new runtime should rename the new-mode meaning toward `TC_REF_NUMBER` while keeping version-dependent decoding explicit.

Existing ordinary int14 immediates and boxed signed int32 allocations remain valid physical optimizations for ordinary Number values.

### Boxing and optimization

The initial implementation may materialize flavored Number allocations aggressively for correctness.

Later optimization may keep statically known flavored temporaries in cheaper carriers while specialized bytecode supplies the missing semantic knowledge. Before flavor can become dynamically observable, the value must be materialized in a form that preserves its kind.

Possible escape/materialization points include object/array storage, generic calls, closure capture, generic bytecode paths, and `Number.kind`.

Box elision is explicitly an optimization and must not be required to implement the first correct version.

## Snapshot Versioning and Compatibility

The mixed-numeric format supersedes the current configurable-float format rather than extending it. Remove `FF_FLOAT32` from the new format and reuse feature bit 2 as `FF_NUMERIC_TYPES`. There is no separate float-width feature bit in engine-minor-1 snapshots; the ordinary-Number default float width lives in `numericOptions` in the header as described above.

Increase the engine minor version from 0 to 1. The configurable-float work is superseded before release, so its intermediate snapshot encoding is ignored completely: there are no snapshots to recognize, reject specially, or migrate.

`requiredEngineVersion` is the minimum engine minor needed by the encoded snapshot, not necessarily the encoder's own engine minor. Version rules are:

- pre-configurable-float 8.0 snapshots, with feature bit 2 clear and the reserved header byte zero, require engine minor 0 and remain supported;
- numeric-types snapshots set feature bit 2 as `FF_NUMERIC_TYPES`, use the engine-minor-1 `numericOptions` meaning of the former reserved byte, and require engine minor 1; this includes any snapshot whose ordinary Number default is f32, even if it uses no explicit flavored values;
- a new compiler may still emit an engine-minor-0 snapshot when the program uses only legacy semantics, the ordinary Number default is f64, feature bit 2 is clear, and the header option byte is zero;
- an 8.0 runtime rejects every new numeric-types snapshot because its `requiredEngineVersion` is 1, before it can misinterpret feature bit 2, the header option byte, new allocations, or typed instructions;
- the native runtime accepts snapshots whose required minor version is less than or equal to its implemented minor version;
- the TypeScript decoder is changed from equality checking to the same `implemented >= required` rule.

New runtimes therefore execute released legacy 8.0 snapshots using the legacy type-2 float64 interpretation and execute engine-minor-1 numeric snapshots using tagged `TC_REF_NUMBER` semantics. The unreleased configurable-float encoding has no compatibility behavior at all and should not appear in runtime branching, validation, migration, or tests.

Safe/untrusted-bytecode validation verifies:

- integer width is `1..64`;
- float width is 32 or 64;
- numeric descriptors are structurally valid;
- allocation descriptor and payload size agree;
- typed opcodes carry valid descriptors;
- `FF_NUMERIC_TYPES` requires engine minor 1 or later, and new numeric allocations/instructions are present only when that capability is advertised;
- `numericOptions` contains only defined bits, is zero for engine-minor-0 snapshots, and is non-semantic/required zero when `FF_NUMERIC_TYPES` is absent;
- legacy type-2 float allocations use the original binary64 layout.

## C FFI

### Stable ordinary Number convenience API

The host convenience boundary returns to an ABI-stable binary64 interface rather than exposing the build-selected `MVM_FLOAT` type.

Restore the pre-configurable binary64 API using the existing `MVM_FLOAT64` typedef:

```c
mvm_Value mvm_newNumber(mvm_VM* vm, MVM_FLOAT64 value);
MVM_FLOAT64 mvm_toFloat64(mvm_VM* vm, mvm_Value value);
```

The current configurable-width API is superseded along with its bytecode format. `MVM_FLOAT_WIDTH` is removed as a semantic/build-selection knob. `MVM_FLOAT` and `mvm_toFloat` may be retained only as deprecated source-compatibility aliases to the binary64 API during migration; they do not preserve configurable-width behavior. Optional backend-removal/footprint switches, if added later, are capability controls rather than Number semantics.

When `mvm_newNumber` creates an ordinary Number under an f32 default, it first applies f32 rounding and only then applies integer-representation optimizations. This prevents exact-int storage from preserving precision that an f32 Number could not represent.

`mvm_toFloat64` may lose precision when explicitly converting exact wide integers; the function name and API contract make that conversion explicit.

### Exact typed numeric API

Add one generic exact typed numeric interface rather than one function per width:

```c
typedef struct {
  enum {
    MVM_NUM_ORDINARY,
    MVM_NUM_SIGNED,
    MVM_NUM_UNSIGNED,
    MVM_NUM_FLOAT
  } kind;

  uint8_t width;

  union {
    int64_t i;
    uint64_t u;
    float f32;
    double f64;
  } value;
} mvm_NumericValue;
```

with these API entry points:

```c
mvm_TeError mvm_newNumeric(
  mvm_VM* vm, const mvm_NumericValue* value, mvm_Value* out);
mvm_TeError mvm_getNumeric(
  mvm_VM* vm, mvm_Value value, mvm_NumericValue* out);
```

The ABI losslessly round-trips every `iN`, `uN`, f32, f64, and ordinary Number flavor, including 64-bit integers above `2^53`. For `MVM_NUM_ORDINARY`, `width` is zero and the union uses `f64`; `mvm_newNumeric` applies the VM default ordinary-Number precision just like `mvm_newNumber`.

A C value's native type does not automatically assign a Microvium flavor. Host code must use the typed constructor when it wants typed semantics.

## Runtime Errors

Numeric failures use one coherent numeric error family with internally distinguishable reasons suitable for diagnostics:

- mixed signed/unsigned integer arithmetic;
- integer division by zero;
- integer remainder by zero;
- invalid shift count;
- NaN or infinity converted to integer;
- non-Number used by a typed numeric boundary/operator;
- malformed runtime numeric descriptor or payload.

The compiler reports equivalent conditions statically when provable.

Expected numeric errors are VM errors rather than C traps or undefined behavior.

## Testing Strategy

The TypeScript/reference VM is the semantic oracle. It uses exact `bigint` arithmetic for typed integers and explicit f32 rounding for binary32 operations.

Tests are table/property driven across every integer width `1..64`, using boundary values and representative patterns rather than a hand-written Cartesian test swamp.

For each width and signedness, include:

- zero and one;
- signed `-1` where applicable;
- minimum and maximum;
- values adjacent to minimum/maximum;
- representative alternating and sparse bit patterns.

The critical cross-check is that three execution paths agree on both value and `Number.kind`:

1. compile-time constant folding;
2. specialized typed bytecode;
3. generic runtime dispatch.

Focused regression coverage includes:

- odd widths such as `u1`, `i7`, `u12`, `i31`, `u37`, and `i63`;
- exact `i64/u64` values above `2^53`;
- wrapping addition, subtraction, multiplication, unary minus, and increment/decrement;
- division/remainder and zero errors;
- all shift boundary cases;
- f32 per-operation rounding and f64 behavior;
- f32/f64 promotion;
- integer/float promotion;
- signed/unsigned static rejection and dynamic failure;
- bare numeric boundaries versus cast annotations;
- context-aware generic operations inside boundaries and per-file defaults;
- NaN, infinities, positive zero, and negative zero;
- equality/comparison across flavors without double coercion;
- object, array, closure, and call escape preserving flavor;
- `Number.kind` behavior;
- exact C FFI round trips;
- snapshot encode/decode preserving type descriptors and payloads;
- malformed numeric descriptors rejected in safe mode;
- genuine pre-configurable 8.0 snapshots executing unchanged on the new runtime;
- new numeric-types snapshots being rejected cleanly by an engine below minor version 1;
- `numericOptions` carrying the ordinary default f32/f64 choice only for engine-minor-1 snapshots.

During migration, the current branch's FP32-only and FP64-only implementations remain useful behavioral test oracles. They are not retained as production language modes: the mixed runtime supersedes `MVM_FLOAT_WIDTH` and the old `FF_FLOAT32` snapshot format.

## Non-goals

This first implementation does not include:

- static typing of JavaScript bindings;
- TypeScript syntax or a TypeScript frontend;
- BigInt as a source-language primitive;
- arbitrary floating formats beyond f32/f64;
- flavor-preserving overloads for the entire `Math.*` library;
- public reflection of physical storage/boxing details;
- C-style implicit signed/unsigned conversion rules;
- automatic width growth for multiplication or other arithmetic;
- optimizer-dependent semantics.

In the first implementation, existing `Math.*` functions retain ordinary Number behavior. Explicit boundaries/casts can control their inputs and results. Flavor-aware mathematical builtins can be added later using the same numeric descriptor machinery without changing the value model.

## Implementation Shape

The implementation should proceed in separable layers:

1. introduce first-class numeric descriptors and reference-VM semantics;
2. add source annotation parsing, exact typed literals, IL nodes, and constant folding;
3. replace the configurable-float feature/header semantics with engine-minor-1 numeric snapshot/version support and tagged Number allocations;
4. add native generic runtime dispatch;
5. add specialized typed bytecode operations and compiler selection;
6. add C FFI and `Number.kind`;
7. add box-elision/density optimizations only after semantic parity is proven.

Each layer must remain testable against the reference VM. No optimization is allowed to change numeric flavor, rounding points, integer width, or error behavior.
