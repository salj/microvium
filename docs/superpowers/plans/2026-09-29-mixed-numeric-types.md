# Mixed Numeric Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unreleased configurable-float implementation with one engine-minor-1 mixed-numeric runtime supporting ordinary Number defaults, explicit f32/f64 flavors, arbitrary iN/uN widths from 1 through 64, exact fixed-width arithmetic, source comment annotations, dynamic fallback dispatch, typed bytecode specialization, exact C FFI, and semantic introspection.

**Architecture:** Numeric flavor is a property of Number values, never bindings. A shared TypeScript numeric-semantics module is the reference oracle for compiler folding and the reference VM; source annotations lower to first-class numeric IL; engine-minor-1 snapshots encode tagged Number allocations and numeric options; the native runtime implements the same semantics through generic flavor dispatch and specialized typed bytecode when the compiler knows enough. Released 8.0/f64 snapshots remain valid, while the unreleased `MVM_FLOAT_WIDTH`/`FF_FLOAT32` format is deleted rather than supported.

**Tech Stack:** TypeScript 4.8, Babel parser AST, Microvium IL and snapshot encoder/decoder, C11 native VM, generated opcode/type synchronization via `scripts/sync-opcodes.ts`, Mocha/Chai tests, native C harnesses compiled with the host C compiler.

**Spec:** `docs/superpowers/specs/2026-09-29-mixed-numeric-types-design.md`

## Global Constraints

- Every JavaScript-visible numeric flavor remains `typeof value === "number"`; bindings remain dynamically typed.
- Integer flavors are `iN` and `uN` for every width `1..64`; f32 and f64 are the only explicit floating flavors.
- Same-signed integer binary arithmetic returns width `max(lhs.width, rhs.width)` and wraps modulo `2^width`; multiplication does not widen automatically.
- Implicit signed/unsigned integer arithmetic is rejected statically when syntax proves it and fails at runtime when discovered dynamically.
- f32 arithmetic rounds at every typed operation/boundary; f64 uses binary64; integer plus float promotes to that float flavor.
- Bare `/*type*/` comments create an evaluation/result boundary; `/*(type)*/` comments are tight casts; a file header may set `/* microvium: default-float=f32 */` or f64.
- Typed integer literals and folding must preserve exact values through 64 bits using `bigint` or equivalent exact arithmetic.
- Engine major stays 8; engine minor becomes 1 for numeric-types snapshots. New encoders emit required minor 0 only for genuine legacy f64 semantics and minor 1 for numeric-types semantics.
- Feature bit 2 becomes `FF_NUMERIC_TYPES`; the old `FF_FLOAT32` meaning and all compatibility logic for the unreleased configurable-float snapshot format are removed.
- Header byte 3 becomes `numericOptions` in engine minor 1; bit 0 means ordinary Number default f32, clear means f64; other bits are zero. Engine-minor-0 snapshots require byte 3 to be zero.
- New runtimes accept released engine-minor-0 snapshots; old 8.0 runtimes reject engine-minor-1 snapshots via `requiredEngineVersion` before interpreting new fields or opcodes.
- `MVM_FLOAT_WIDTH` is removed as a production semantic/build switch. The host convenience ABI returns to `MVM_FLOAT64`/`double`; exact typed values use the new generic numeric FFI.
- Physical storage is not semantic flavor. int14/int32 and future box-elision optimizations may be used only when they cannot alter observable numeric kind or arithmetic.
- Focused tests must compare constant folding, reference-VM dynamic execution, specialized bytecode, and native generic dispatch for the same semantics before any box-elision or density optimization is attempted.

---

## File Structure

Create two focused TypeScript modules instead of spreading numeric rules through the compiler and VM:

- `lib/numeric-types.ts`: semantic numeric descriptors, exact conversion/promotion/arithmetic/comparison helpers, bytecode descriptor encode/decode, string kind formatting.
- `lib/src-to-il/numeric-annotations.ts`: source-comment parsing, file default parsing, annotation-to-AST binding, exact raw integer literal parsing.

Keep C implementation in the existing single-file native VM layout so generated `dist-c/microvium.c` remains self-contained:

- `native-vm/microvium.h`: public version, errors, stable float ABI, typed FFI declarations.
- `native-vm/microvium_bytecode.h`: header field and feature-bit definitions.
- `native-vm/microvium_internals.h`: internal numeric descriptor/value helpers.
- `native-vm/microvium_opcodes.h`: typed/context numeric opcodes.
- `native-vm/microvium.c`: tagged Number representation, generic dispatch, typed execution, comparison, casts, FFI.

The following TypeScript files are synchronized/generated from C declarations and should be updated by `scripts/sync-opcodes.ts`, not hand-maintained independently:

- `lib/bytecode-opcodes.ts`
- `lib/runtime-types.ts`
- `lib/snapshot-il.ts` engine version constants

Tests are split by responsibility:

- `test/numeric-types/numeric-types.test.ts`: pure semantic oracle tests across widths and boundary values.
- `test/virtual-machine/numeric-types.test.ts`: reference VM values, generic/context execution, equality, `Number.kind`.
- `test/src-to-il/numeric-annotations.test.ts`: comment binding, exact literals, diagnostics, file default.
- `test/decode-snapshot/numeric-types.test.ts`: version/header/feature/tagged-value encoding and validation.
- `test/native/numeric-runtime.test.ts` + `test/native/numeric-runtime.c`: native generic/specialized execution and compatibility.
- `test/native/numeric-api.test.ts` + `test/native/numeric-api.c`: exact C FFI and stable binary64 convenience ABI.

---

### Task 1: Add the shared numeric descriptor and exact semantic oracle

**Files:**
- Create: `lib/numeric-types.ts`
- Create: `test/numeric-types/numeric-types.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type IntegerNumericType = { kind: 'integer'; signed: boolean; width: number };
  export type FloatNumericType = { kind: 'float'; width: 32 | 64 };
  export type NumericType = IntegerNumericType | FloatNumericType;
  export type NumericFlavor = { kind: 'ordinary' } | NumericType;

  export interface NumericValueData {
    flavor: NumericFlavor;
    value: number | bigint;
  }

  export function parseNumericTypeName(name: string): NumericType | undefined;
  export function numericTypeName(type: NumericType): string;
  export function convertNumeric(value: NumericValueData, target: NumericType, ordinaryDefault: 32 | 64): NumericValueData;
  export function binaryNumeric(op: IL.BinOpCode, left: NumericValueData, right: NumericValueData, context: NumericType | undefined, ordinaryDefault: 32 | 64): NumericValueData | boolean;
  export function unaryNumeric(op: IL.UnOpCode, value: NumericValueData, context: NumericType | undefined, ordinaryDefault: 32 | 64): NumericValueData;
  export function compareNumeric(op: '<' | '>' | '<=' | '>=' | '===' | '!==', left: NumericValueData, right: NumericValueData): boolean;
  export function encodeNumericTypeDescriptor(type: NumericType): number;
  export function decodeNumericTypeDescriptor(byte: number): NumericType;
  ```
- [ ] **Step 1: Write the pure semantic tests first**

Create `test/numeric-types/numeric-types.test.ts` with table-driven cases that directly exercise the shared helpers before wiring them into the VM. Include all widths `1..64` in loops and representative explicit cases:

```ts
suite('numeric type semantics', () => {
  test('parses arbitrary integer widths and fixed float widths', () => {
    assert.deepEqual(parseNumericTypeName('u12'), { kind: 'integer', signed: false, width: 12 });
    assert.deepEqual(parseNumericTypeName('i37'), { kind: 'integer', signed: true, width: 37 });
    assert.deepEqual(parseNumericTypeName('f32'), { kind: 'float', width: 32 });
    assert.isUndefined(parseNumericTypeName('u0'));
    assert.isUndefined(parseNumericTypeName('i65'));
    assert.isUndefined(parseNumericTypeName('f48'));
  });

  test('same-signed integer operations use max width and wrap', () => {
    const u12 = { flavor: { kind: 'integer', signed: false, width: 12 }, value: 4095n } as const;
    const u20 = { flavor: { kind: 'integer', signed: false, width: 20 }, value: 1n } as const;
    assert.deepEqual(binaryNumeric('+', u12, u20, undefined, 64), {
      flavor: { kind: 'integer', signed: false, width: 20 },
      value: 4096n,
    });
    assert.deepEqual(binaryNumeric('+', u12, { ...u12, value: 1n }, undefined, 64), {
      flavor: { kind: 'integer', signed: false, width: 12 },
      value: 0n,
    });
  });

  test('u64 comparison stays exact above 2^53', () => {
    const a = { flavor: { kind: 'integer', signed: false, width: 64 }, value: 9007199254740993n } as const;
    const b = { flavor: { kind: 'integer', signed: false, width: 64 }, value: 9007199254740992n } as const;
    assert.isTrue(compareNumeric('>', a, b));
    assert.isFalse(compareNumeric('===', a, b));
  });
});
```

Add looped cases for min/max, adjacent values, signed wrap, division truncation, remainder, nonnegative integer exponentiation/wrap plus negative-exponent failure, all shift edge cases, f32 per-operation rounding, f32/f64 promotion, integer-to-float promotion, NaN/infinity integer conversion errors, and descriptor round-trips for every `i1..i64` and `u1..u64`.

- [ ] **Step 2: Run only the new semantic test and verify it fails**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/numeric-types/numeric-types.test.ts
```

Expected: FAIL because `lib/numeric-types.ts` does not exist yet.

- [ ] **Step 3: Implement the exact semantic helpers**

In `lib/numeric-types.ts`, use `import type * as IL from './il'` so Task 2 can later import numeric descriptor types into IL without creating a runtime module cycle. Implement integer normalization only with `bigint`, never JS bitwise operators:

```ts
function modulus(width: number) {
  return 1n << BigInt(width);
}

function normalizeUnsigned(value: bigint, width: number) {
  const m = modulus(width);
  return ((value % m) + m) % m;
}

function normalizeSigned(value: bigint, width: number) {
  const u = normalizeUnsigned(value, width);
  const sign = 1n << BigInt(width - 1);
  return (u & sign) === 0n ? u : u - modulus(width);
}
```

Use explicit rules from the spec for mixed signedness, shift counts, division/remainder by zero, float conversions, f32 `Math.fround` boundaries, exact comparisons, and ordinary/default-float promotion. Apply the spec's same-signed binary-arithmetic width rule to integer `**` as well: promote the base/exponent widths by the normal max-width rule, compute by modular exponentiation in exact `bigint`, and wrap to the result width after the operation. A negative typed-integer exponent raises `MVM_E_NUMERIC_ERROR` because its mathematical result is not an integer. Float `**` follows f32/f64 semantics.

Use this one-byte descriptor layout for typed bytecode:

```text
bit 7 = 0: integer; bit 6 = signed; bits 5..0 = width - 1
0x80: f32
0x81: f64
0x82..0xFF: invalid/reserved
```

- [ ] **Step 4: Run the focused semantic tests**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/numeric-types/numeric-types.test.ts
```

Expected: PASS. This task is intentionally pure and does not alter the existing VM or snapshot format yet.

- [ ] **Step 5: Commit**

```bash
git add lib/numeric-types.ts test/numeric-types/numeric-types.test.ts
git commit -m "feat: define mixed numeric semantics"
```

---

### Task 2: Add first-class numeric IL and make the reference VM the semantic oracle

**Files:**
- Modify: `lib/il.ts`
- Modify: `lib/il-opcodes.ts`
- Modify: `lib/stringify-il.ts`
- Modify: `lib/normalize-il.ts`
- Modify: `lib/virtual-machine.ts`
- Modify: `lib/virtual-machine-friendly.ts`
- Modify: `lib/encode-snapshot-function-body.ts`
- Modify: `lib/encode-snapshot.ts`
- Modify: `lib/decode-snapshot.ts`
- Create: `test/virtual-machine/numeric-types.test.ts`

**Interfaces:**
- Consumes: `NumericType`, `binaryNumeric`, `unaryNumeric`, `convertNumeric`, `compareNumeric` from Task 1.
- Produces these IL operations:
  ```text
  NumericBinOp(op, contextType)       // dynamic operands under an explicit numeric context
  NumericBinOpTyped(op, resultType)   // compiler-proven typed operation
  NumericUnOp(op, contextType)
  NumericUnOpTyped(op, resultType)
  NumericCast(targetType)
  NumericKindOf
  NumericIsInteger
  ```
- Produces `NumericTypeOperand` in `lib/il.ts`.
- Changes `IL.NumberValue` to `value: number | bigint` plus optional `numericType`; ordinary values remain numbers, typed integers use exact `bigint`, and typed floats use numbers.
- Reference VM preserves `NumberValue.numericType` through object/array/closure storage because it is part of the value itself.

- [ ] **Step 1: Write direct IL/reference-VM tests**

Create `test/virtual-machine/numeric-types.test.ts`. Construct small custom IL functions so these tests do not depend on source-comment parsing yet. Cover:

```ts
test('typed u12 add wraps while the binding remains dynamic', () => {
  // Push u12(4095), push u12(1), NumericBinOpTyped('+', u12), return.
  // Assert value is 0 and Number.kind is u12 through the VM helper.
});

test('context operation promotes explicit f64 inside f32 context then boundary can narrow', () => {
  // Exercise NumericBinOp with f32 context and an explicit f64 operand.
});

test('generic equality ignores flavor and compares wide integers exactly', () => {
  // u64(9007199254740993) !== u64(9007199254740992)
  // u12(3) === f64(3)
});

test('dynamic signed/unsigned arithmetic raises numeric type error', () => {
  // Feed i12 and u12 through NumericBinOp rather than a compiler-proven typed op.
});
```

Also verify `typeOf` still returns `"number"` for every flavor and `NumericIsInteger` returns true for every integer flavor, including exact `u64` values above `2^53`, while preserving ordinary JavaScript integrality for ordinary/floating values.

- [ ] **Step 2: Run the focused reference-VM test and verify it fails**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/virtual-machine/numeric-types.test.ts
```

Expected: FAIL because numeric IL operations are not defined.

- [ ] **Step 3: Add numeric NumberValue representation, operands, and operations to IL**

Change `NumberValue` and add constructors:

```ts
export interface NumberValue {
  type: 'NumberValue';
  value: number | bigint;
  numericType?: NumericType;
}

export const typedIntegerValue = (signed: boolean, width: number, value: bigint): NumberValue => ({
  type: 'NumberValue',
  value,
  numericType: { kind: 'integer', signed, width },
});

export const typedFloatValue = (width: 32 | 64, value: number): NumberValue => ({
  type: 'NumberValue',
  value,
  numericType: { kind: 'float', width },
});

export interface NumericTypeOperand {
  type: 'NumericTypeOperand';
  numericType: NumericType;
}
```

Update every pre-existing NumberValue consumer imported by the reference VM path so ordinary-only code narrows through a helper rather than accidentally treating `bigint` as a JS number. In particular:

- `virtual-machine-friendly.ts` projects flavored integer values to host JS with `Number(value.value)` so the host membrane still exposes a JavaScript number, never a BigInt;
- `stringify-il.ts` stringifies bigint payloads without an `n` source suffix;
- `encode-snapshot-function-body.ts` refuses small-literal encoding for flavored/bigint values and leaves them for `encodeValue`;
- `encode-snapshot.ts` and `decode-snapshot.ts` continue to support ordinary numeric snapshots at this checkpoint and explicitly reject a flavored/bigint value if snapshot creation is attempted before Task 4 adds the tagged format.

Extend `lib/il-opcodes.ts` with exact stack effects:

```ts
'NumericBinOp':      { operands: ['OpOperand', 'NumericTypeOperand'], stackChange: -1 },
'NumericBinOpTyped': { operands: ['OpOperand', 'NumericTypeOperand'], stackChange: -1 },
'NumericUnOp':       { operands: ['OpOperand', 'NumericTypeOperand'], stackChange: 0 },
'NumericUnOpTyped':  { operands: ['OpOperand', 'NumericTypeOperand'], stackChange: 0 },
'NumericCast':       { operands: ['NumericTypeOperand'], stackChange: 0 },
'NumericKindOf':     { operands: [], stackChange: 0 },
'NumericIsInteger':  { operands: [], stackChange: 0 },
```

Update stringification and normalization switches so these operations survive IL diagnostics and normalization without falling into unreachable/default cases.

- [ ] **Step 4: Delegate reference VM numeric behavior to the shared oracle**

Add conversion helpers in `lib/virtual-machine.ts`:

```ts
private numberValueData(value: IL.Value): NumericValueData;
private pushNumeric(value: NumericValueData): void;
private operationNumericBinOp(op: IL.BinOpCode, context: NumericType, typed: boolean): void;
private operationNumericUnOp(op: IL.UnOpCode, context: NumericType, typed: boolean): void;
private operationNumericCast(target: NumericType): void;
private operationNumericKindOf(): void;
private operationNumericIsInteger(): void;
```

`BinOp`/`UnOp` retain ordinary JS semantics. New numeric operations call the Task 1 helpers. `NumericKindOf` returns a VM string (`"number"`, `"u12"`, `"i7"`, `"f32"`, `"f64"`) or `undefined` for non-Numbers. `NumericIsInteger` returns a boolean using the exact internal numeric value rather than a double projection.

Remove the reference VM's semantic dependence on `roundFloat` for explicit flavors. Ordinary Number fallback continues to use the current VM floating-default accessor at this checkpoint; Task 3 renames the public option to `defaultFloatWidth`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/numeric-types/numeric-types.test.ts test/virtual-machine/numeric-types.test.ts
```

Expected: PASS.

Also run the ordinary VM test file to ensure generic JavaScript operations still behave as before:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/virtual-machine/virtual-machine.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/il.ts lib/il-opcodes.ts lib/stringify-il.ts lib/normalize-il.ts lib/virtual-machine.ts lib/virtual-machine-friendly.ts lib/encode-snapshot-function-body.ts lib/encode-snapshot.ts lib/decode-snapshot.ts test/virtual-machine/numeric-types.test.ts
git commit -m "feat: execute typed numeric IL"
```

---

### Task 3: Parse numeric comments, exact literals, defaults, and compiler diagnostics

**Files:**
- Create: `lib/src-to-il/numeric-annotations.ts`
- Create: `test/src-to-il/numeric-annotations.test.ts`
- Modify: `lib/src-to-il/src-to-il.ts`
- Modify: `lib/src-to-il/common.ts`
- Modify: `lib/src-to-il/supported-babel-types.ts`
- Modify: `lib/virtual-machine.ts`
- Modify: `lib/virtual-machine-types.ts`
- Modify: `lib.ts`

**Interfaces:**
- Consumes: numeric IL from Task 2 and semantic helpers from Task 1.
- Produces:
  ```ts
  export interface NumericSourceInfo {
    fileDefaultFloatWidth?: 32 | 64;
    annotationAt(node: B.Node, slot: NumericExpressionSlot): NumericAnnotation | undefined;
  }

  export type NumericAnnotation =
    | { form: 'boundary'; numericType: NumericType }
    | { form: 'cast'; numericType: NumericType };

  export function analyzeNumericAnnotations(filename: string, sourceText: string, ast: B.File): NumericSourceInfo;
  export function parseExactIntegerLiteral(raw: string): bigint;
  ```
- `compileExpression` gains an explicit numeric-context parameter internal to source lowering; it does not type bindings.
- Adds public compiler option `defaultFloatWidth?: 32 | 64` with default 64. Keep the existing `floatWidth` option as temporary in-tree migration scaffolding only until Task 8 updates browser/build callers and removes it.

- [ ] **Step 1: Write syntax and diagnostic tests**

Create `test/src-to-il/numeric-annotations.test.ts` with source snippets covering all binding rules:

```ts
test('bare annotation covers the entire initializer', () => {
  const il = compile('let x = /*u12*/ a + b;');
  assert.include(il, 'NumericBinOp');
  assert.include(il, 'u12');
});

test('cast binds tightly to the following operand', () => {
  const il = compile('let x = /*(f64)*/ a * b;');
  assert.match(il, /NumericCast.*f64[\s\S]*BinOp/);
});

test('ambiguous bare operand annotation is rejected', () => {
  assert.throws(() => compile('a + /*u12*/ b * c;'), 'numeric boundary');
});

test('parenthesized bare subexpression is accepted', () => {
  compile('a + /*u12*/ (b * c);');
});

test('u64 literal is captured exactly from raw source text', () => {
  const value = extractLiteral('/*u64*/ 9_007_199_254_740_993');
  assert.equal(value.value, 9007199254740993n);
});

test('file default header changes ordinary floating default', () => {
  const vm = compileAndRun('/* microvium: default-float=f32 */\nvmExport(1, 33554434 / 2);');
  assert.equal(vm, 16777216);
});
```

Add compile-error cases for `u0`, `i65`, `f48`, constant division/remainder by zero, negative constant shift counts, statically evident signed/unsigned mixing, and statically evident ordinary Number plus typed integer outside a numeric boundary. Add source-level behavior cases for `++`, `--`, and compound assignments on dynamically bound flavored values, including postfix returning the previous flavor/value and reassignment of the same binding to a non-number afterward.

- [ ] **Step 2: Run only the source-annotation test and verify failure**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/src-to-il/numeric-annotations.test.ts
```

Expected: FAIL because the annotation pass and lowering are absent.

- [ ] **Step 3: Implement the dedicated comment annotation pass**

Parse comments by source offsets, not Babel's lossy `leadingComments` association. Recognize exactly:

```text
/*u1*/ through /*u64*/
/*i1*/ through /*i64*/
/*f32*/ and /*f64*/
/*(uN)*/, /*(iN)*/, /*(f32)*/, /*(f64)*/
/* microvium: default-float=f32 */
/* microvium: default-float=f64 */
```

Reject annotation comments containing line terminators. Bind bare annotations only to complete expression slots (initializer, assignment RHS, return expression, call argument, array element, object property value, conditional arm) or an explicitly parenthesized subexpression. Bind cast annotations to the immediate following operand expression.

Store annotation lookup in compiler context so the normal traversal does not repeatedly rescan source text.

- [ ] **Step 4: Lower boundaries/casts and preserve exact integer literals**

Refactor expression lowering around an internal signature like:

```ts
function compileExpression(
  cur: Cursor,
  expression: B.Expression | B.PrivateName,
  numericContext?: NumericType,
): void;
```

When a bare boundary applies, compile the subtree under that context and emit `NumericCast` at the boundary if the subtree result is not already guaranteed to have the target flavor. When a cast applies, compile the operand under its existing context and then emit only `NumericCast`.

For numeric literals under an integer context, obtain the raw source spelling from the AST/source range, call `parseExactIntegerLiteral`, and emit a flavored `NumberValue` carrying `bigint`. Do not use `NumericLiteral.value` for typed integer exactness.

Where both operand flavors are syntactically established, emit `NumericBinOpTyped`/`NumericUnOpTyped`; where a boundary supplies context but runtime operand flavor may vary, emit `NumericBinOp`/`NumericUnOp` with the context. Ordinary source remains `BinOp`/`UnOp`.

- [ ] **Step 5: Add project/file default plumbing**

Rename exposed compiler options to:

```ts
export interface MicroviumCreateOpts {
  debugConfiguration?: { port: number };
  noLib?: boolean;
  outputIL?: boolean;
  defaultFloatWidth?: 32 | 64;
  /** Temporary migration alias, removed in Task 8. */
  floatWidth?: 32 | 64;
}
```

Resolve the VM default as `opts.defaultFloatWidth ?? opts.floatWidth ?? 64`. A valid file header overrides the numeric context for that compilation unit without mutating global VM state. Record whether any engine-minor-1 semantics are used so snapshot creation can set the capability in Task 4. Task 8 removes the temporary alias after all in-tree build callers have moved to the new name.

- [ ] **Step 6: Run focused compiler/reference tests**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/src-to-il/numeric-annotations.test.ts test/virtual-machine/numeric-types.test.ts test/src-to-il/src-to-il.test.ts
```

Expected: PASS.


- [ ] **Step 7: Commit**

```bash
git add lib/src-to-il/numeric-annotations.ts lib/src-to-il/src-to-il.ts lib/src-to-il/common.ts lib/src-to-il/supported-babel-types.ts lib/virtual-machine.ts lib/virtual-machine-types.ts lib.ts test/src-to-il/numeric-annotations.test.ts
git commit -m "feat: compile numeric annotations"
```

---

### Task 4: Replace the configurable-float snapshot format with engine-minor-1 numeric snapshots

**Files:**
- Modify: `native-vm/microvium.h`
- Modify: `native-vm/microvium_bytecode.h`
- Modify: `lib/snapshot-il.ts` via opcode/version sync
- Modify: `lib/il.ts`
- Modify: `lib/virtual-machine.ts`
- Modify: `lib/encode-snapshot.ts`
- Modify: `lib/decode-snapshot.ts`
- Modify: `lib/runtime-types.ts` via sync
- Create: `test/decode-snapshot/numeric-types.test.ts`
- Delete after replacement tests pass: `test/decode-snapshot/float-width.test.ts`
- Delete because the superseded wire format is no longer executable: `test/native/float-width-runtime.c`
- Delete because the superseded wire format is no longer executable: `test/native/float-width-runtime.test.ts`

**Interfaces:**
- Produces `MVM_ENGINE_MINOR_VERSION 1`.
- Replaces feature enum member `FF_FLOAT32 = 2` with `FF_NUMERIC_TYPES = 2`.
- Renames bytecode header field `reserved` to `numericOptions` for minor 1.
- Adds snapshot metadata:
  ```ts
  export interface NumericOptions {
    defaultFloatWidth: 32 | 64;
  }
  ```
- Reinterprets heap type code `0x2` as tagged `TC_REF_NUMBER` only when `FF_NUMERIC_TYPES` is set; legacy minor-0 snapshots keep old float64 type-2 decoding.

- [ ] **Step 1: Write version/header/tagged-value tests**

Create `test/decode-snapshot/numeric-types.test.ts` covering:

```ts
test('legacy f64-only source still emits engine minor 0', () => {
  const snapshot = compile('vmExport(1, 1.5);', { defaultFloatWidth: 64 });
  assert.equal(snapshot.data[2], 0); // requiredEngineVersion
  assert.equal(snapshot.data[3], 0); // legacy reserved byte
  assert.equal(snapshot.data.readUInt32LE(8) & (1 << 2), 0);
});

test('f32 default uses numeric-types feature and minor 1', () => {
  const snapshot = compile('vmExport(1, 1.5);', { defaultFloatWidth: 32 });
  assert.equal(snapshot.data[2], 1);
  assert.equal(snapshot.data[3] & 1, 1);
  assert.notEqual(snapshot.data.readUInt32LE(8) & (1 << 2), 0);
});

test('explicit u12 uses tagged number allocation and minor 1', () => {
  const snapshot = compile('vmExport(1, /*u12*/ 4095);');
  const decoded = decodeSnapshot(snapshot);
  assert.include(decoded.disassembly, 'TC_REF_NUMBER');
  assert.include(decoded.disassembly, 'u12');
});

test('decoder accepts required minor <= implemented minor', () => {
  // Decode a genuine minor-0 f64 snapshot with the minor-1 decoder.
});
```

Add malformed descriptor/payload-size tests by copying a valid snapshot buffer, mutating one descriptor/size/header bit, recomputing CRC if needed, and asserting decode/validation failure.

- [ ] **Step 2: Run the new snapshot test and verify failure**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/decode-snapshot/numeric-types.test.ts
```

Expected: FAIL on version, feature, and representation expectations.

- [ ] **Step 3: Change version/header definitions at the C source of truth**

In `native-vm/microvium.h`:

```c
#define MVM_ENGINE_MAJOR_VERSION 8
#define MVM_ENGINE_MINOR_VERSION 1
```

In `native-vm/microvium_bytecode.h`:

```c
typedef struct mvm_TsBytecodeHeader {
  uint8_t bytecodeVersion;
  uint8_t headerSize;
  uint8_t requiredEngineVersion;
  uint8_t numericOptions;
  /* unchanged remaining fields */
} mvm_TsBytecodeHeader;

typedef enum mvm_TeFeatureFlags {
  FF_FLOAT_SUPPORT = 0,
  FF_NUMERIC_TYPES = 2,
} mvm_TeFeatureFlags;

#define MVM_NUMERIC_OPTION_DEFAULT_F32 0x01u
```

Run:

```bash
npx ts-node scripts/sync-opcodes.ts
```

This updates `lib/snapshot-il.ts` and synchronized enums.

- [ ] **Step 4: Make required minor and numeric options data-driven in the encoder**

Change `SnapshotIL` to carry `numericOptions.defaultFloatWidth`. In `encode-snapshot.ts`, compute:

```ts
const usesNumericTypes = snapshot.flags.has(IL.ExecutionFlag.NumericTypes);
const requiredEngineVersion = usesNumericTypes ? 1 : 0;
const numericOptions = usesNumericTypes && snapshot.numericOptions.defaultFloatWidth === 32 ? 0x01 : 0x00;
```

Write `requiredEngineVersion` rather than blindly writing `ENGINE_MINOR_VERSION`.

Rename `ExecutionFlag.Float32` to `ExecutionFlag.NumericTypes`. The VM marks NumericTypes when any explicit numeric flavor is emitted, any typed/context numeric IL is present, or ordinary default f32 is required.

- [ ] **Step 5: Encode and decode tagged Number allocations**

For numeric-types snapshots, encode type code `0x2` as:

```text
allocation body:
  uint16 descriptorWord
  payload bucket (16/32/64 bits, or f32/f64 bits)
```

Use the low byte of the descriptor word for explicit typed descriptors from Task 1. Reserve descriptor words `0x0100` and `0x0101` for ordinary f32 and ordinary f64 heap payloads respectively; reject other high-byte combinations.

For legacy minor-0 snapshots with feature bit 2 clear, decode type code `0x2` as the original raw binary64 float allocation. No branch recognizes the unreleased `FF_FLOAT32` format.

Change TypeScript version validation from equality to:

```ts
if (requiredEngineVersion > ENGINE_MINOR_VERSION) {
  return invalidOperation(`Engine version ${requiredEngineVersion} requires a later engine (implemented ${ENGINE_MINOR_VERSION})`);
}
```

Validate `numericOptions === 0` for minor 0 and when `FF_NUMERIC_TYPES` is absent; for numeric-types snapshots reject unknown option bits.

- [ ] **Step 6: Run focused snapshot/compiler tests and remove the obsolete float-width snapshot test**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/decode-snapshot/numeric-types.test.ts test/src-to-il/numeric-annotations.test.ts
```

Expected: PASS.

Delete `test/decode-snapshot/float-width.test.ts`, because its snapshot-format contract has been superseded rather than retained. Delete `test/native/float-width-runtime.c` and `test/native/float-width-runtime.test.ts` in the same commit: they specifically test the unreleased `FF_FLOAT32`/matching-runtime-width contract that this task removes, and keeping them would deliberately leave the repository with a test for a format that no longer exists.

- [ ] **Step 7: Commit**

```bash
git add native-vm/microvium.h native-vm/microvium_bytecode.h lib/snapshot-il.ts lib/runtime-types.ts lib/il.ts lib/virtual-machine.ts lib/encode-snapshot.ts lib/decode-snapshot.ts test/decode-snapshot/numeric-types.test.ts
git rm test/decode-snapshot/float-width.test.ts test/native/float-width-runtime.c test/native/float-width-runtime.test.ts
git commit -m "feat: encode numeric-types snapshots"
```

---

### Task 5: Implement tagged Numbers and generic numeric dispatch in the native VM

**Files:**
- Modify: `native-vm/microvium_internals.h`
- Modify: `native-vm/microvium.c`
- Modify: `native-vm/microvium.h`
- Create: `test/native/numeric-runtime.c`
- Create: `test/native/numeric-runtime.test.ts`

**Interfaces:**
- Consumes engine-minor-1 tagged Number format from Task 4.
- Produces internal numeric representation helpers conceptually equivalent to:
  ```c
  typedef enum vm_TeNumericClass {
    VM_NUM_ORDINARY,
    VM_NUM_SIGNED,
    VM_NUM_UNSIGNED,
    VM_NUM_FLOAT
  } vm_TeNumericClass;

  typedef struct vm_TsNumeric {
    vm_TeNumericClass kind;
    uint8_t width;
    union { int64_t i; uint64_t u; float f32; double f64; } value;
  } vm_TsNumeric;
  ```
- Produces generic helpers:
  ```c
  static mvm_TeError vm_readNumeric(VM* vm, Value value, vm_TsNumeric* out);
  static mvm_TeError vm_writeNumeric(VM* vm, const vm_TsNumeric* value, Value* out);
  static mvm_TeError vm_numericBinary(VM* vm, vm_TeNumberOp op, const vm_TsNumeric* a, const vm_TsNumeric* b, const vm_TsNumericType* context, vm_TsNumeric* out);
  static mvm_TeError vm_numericUnary(...);
  static mvm_TeError vm_numericCast(...);
  static int vm_compareNumericExact(...);
  ```

- [ ] **Step 1: Write the native generic-dispatch harness**

Create a TypeScript test that compiles snapshots whose operands escape through objects/properties so specialization cannot be relied upon:

```js
const box = {};
box.a = /*u12*/ 4095;
box.b = /*u12*/ 1;
vmExport(1, () => box.a + box.b);          // numerically 0
vmExport(2, () => (box.a + box.b + /*u12*/ 1) === (/*u12*/ 1)); // proves u12 flavor survived the first add
vmExport(3, () => (/*u64*/ 9007199254740993) > (/*u64*/ 9007199254740992));
```

The C harness restores the snapshot, calls exports, and checks small integer/boolean results with existing public conversion helpers. For wide comparisons, have the script return boolean so no wide FFI is required yet.

Also include a snapshot with an f32 default and assert native ordinary arithmetic matches the reference VM.

- [ ] **Step 2: Run the focused native test and verify failure**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/native/numeric-runtime.test.ts
```

Expected: FAIL because the native VM does not understand tagged Number allocations or numeric-types generic dispatch.

- [ ] **Step 3: Replace build-selected float internals with dual float helpers**

Remove all semantic/runtime dependence on `MVM_FLOAT_WIDTH` from `microvium_internals.h` and `microvium.c`. Keep the public `MVM_FLOAT_WIDTH`/`MVM_FLOAT` compatibility surface in `microvium.h` temporarily until Task 7 changes the public ABI, but do not consult it for snapshot acceptance or arithmetic semantics. Define explicit f32/f64 helpers/macros instead:

```c
#define MVM_FLOAT32 float
#define MVM_FLOAT64 double
#define MVM_FLOAT32_FMOD(a,b) fmodf((a),(b))
#define MVM_FLOAT64_FMOD(a,b) fmod((a),(b))
#define MVM_FLOAT32_POW(a,b) powf((a),(b))
#define MVM_FLOAT64_POW(a,b) pow((a),(b))
```

Keep `MVM_SUPPORT_FLOAT` as the capability switch. A no-float build rejects any snapshot that advertises float support exactly as before.

- [ ] **Step 4: Decode, validate, compare, and allocate tagged Numbers**

At restore time, validate minor/version/feature/options before reading numeric allocations. For `FF_NUMERIC_TYPES`, type code `0x2` uses the descriptor/payload layout from Task 4. For legacy minor 0, type code `0x2` remains binary64.

Implement fixed-width integer math through `uint64_t` operations plus mask/sign-extension helpers. Never rely on signed C overflow or implementation-defined oversized shifts. Special-case width 64 masks so code never performs `1ULL << 64`.

Implement exact mixed-flavor comparison without routing i64/u64 through double.

- [ ] **Step 5: Route generic native number/bit operations through the new dispatcher for numeric snapshots**

Keep the current compact legacy fast path for minor-0 snapshots. For numeric-types snapshots, generic number/bit operations call `vm_readNumeric` and the shared C promotion rules. Ordinary unflavored operands use the snapshot default from `numericOptions`; explicit flavors retain their stronger type.

String concatenating `+` outside typed numeric context remains unchanged. Typed numeric operations on non-Numbers return the new numeric runtime error instead of invoking JS coercion.

Reuse former unreleased error slot 58 as:

```c
/* 58 */ MVM_E_NUMERIC_ERROR,
```

and keep internal reason codes in `microvium_internals.h` for diagnostics/assertions rather than expanding the public error enum for every arithmetic failure.

- [ ] **Step 6: Run focused native/reference parity tests**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/native/numeric-runtime.test.ts test/virtual-machine/numeric-types.test.ts test/decode-snapshot/numeric-types.test.ts
```

Expected: PASS.

Keep the compile-only float API tests passing at this checkpoint because the public header has not changed yet; they are removed in Task 7 when the stable binary64 API replaces the temporary build-selected ABI.

- [ ] **Step 7: Commit**

```bash
git add native-vm/microvium_internals.h native-vm/microvium.c native-vm/microvium.h test/native/numeric-runtime.c test/native/numeric-runtime.test.ts
git commit -m "feat: execute mixed numeric values natively"
```

---

### Task 6: Add specialized typed and context-aware bytecode operations

**Files:**
- Modify: `native-vm/microvium_opcodes.h`
- Modify: `lib/bytecode-opcodes.ts` via sync
- Modify: `lib/encode-snapshot-function-body.ts`
- Modify: `lib/decode-snapshot.ts`
- Modify: `native-vm/microvium.c`
- Modify: `lib/virtual-machine.ts`
- Create: `test/decode-snapshot/numeric-opcodes.test.ts`
- Extend: `test/native/numeric-runtime.test.ts`

**Interfaces:**
- Consumes typed/context IL from Tasks 2 and 3 and native numeric helpers from Task 5.
- Produces dedicated `vm_TeOpcodeEx4` values for each typed binary/unary/cast operation and corresponding context-aware generic forms.
- Every typed/context instruction carries exactly one one-byte numeric descriptor after the Ex4 opcode, yielding a three-byte instruction for the common form.

- [ ] **Step 1: Write bytecode-selection tests**

Create `test/decode-snapshot/numeric-opcodes.test.ts` that compiles three forms of the same operation:

```js
vmExport(1, () => /*u12*/ (3 + 4));           // foldable: no runtime add
vmExport(2, x => /*u12*/ x + 4);              // context-aware or typed depending local proof
vmExport(3, (a, b) => /*(u12)*/ a + /*(u12)*/ b); // both operand flavors explicit, specialized
```

Assert the disassembly contains the expected typed/context opcode names and descriptor `u12`, and that a purely ordinary `3 + 4` still uses existing legacy/generic bytecode when no engine-minor-1 semantics are needed.

Add f32/f64 and odd-width examples (`i7`, `u37`) so descriptor decoding is exercised.

- [ ] **Step 2: Run the focused opcode test and verify failure**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/decode-snapshot/numeric-opcodes.test.ts
```

Expected: FAIL because numeric IL is not encodable yet.

- [ ] **Step 3: Allocate Ex4 opcodes at the native source of truth**

Add contiguous Ex4 entries starting at `0x0E`. Use dedicated opcodes so each instruction remains Ex4 byte + one descriptor byte:

```c
VM_OP4_NUM_ADD_TYPED,
VM_OP4_NUM_SUB_TYPED,
VM_OP4_NUM_MUL_TYPED,
VM_OP4_NUM_DIV_TYPED,
VM_OP4_NUM_REM_TYPED,
VM_OP4_NUM_POW_TYPED,
VM_OP4_NUM_NEG_TYPED,
VM_OP4_NUM_AND_TYPED,
VM_OP4_NUM_OR_TYPED,
VM_OP4_NUM_XOR_TYPED,
VM_OP4_NUM_NOT_TYPED,
VM_OP4_NUM_SHL_TYPED,
VM_OP4_NUM_SHR_TYPED,
VM_OP4_NUM_USHR_TYPED,
VM_OP4_NUM_CAST,
VM_OP4_NUM_KIND,
VM_OP4_NUM_IS_INTEGER,

VM_OP4_NUM_ADD_CONTEXT,
VM_OP4_NUM_SUB_CONTEXT,
VM_OP4_NUM_MUL_CONTEXT,
VM_OP4_NUM_DIV_CONTEXT,
VM_OP4_NUM_REM_CONTEXT,
VM_OP4_NUM_POW_CONTEXT,
VM_OP4_NUM_NEG_CONTEXT,
VM_OP4_NUM_AND_CONTEXT,
VM_OP4_NUM_OR_CONTEXT,
VM_OP4_NUM_XOR_CONTEXT,
VM_OP4_NUM_NOT_CONTEXT,
VM_OP4_NUM_SHL_CONTEXT,
VM_OP4_NUM_SHR_CONTEXT,
VM_OP4_NUM_USHR_CONTEXT,
```

Comparisons may continue through generic comparison bytecode because their result is boolean and exact flavor-aware comparison is already implemented in Task 5; add specialized comparison opcodes only if the current encoder cannot preserve exact wide comparison semantics otherwise.

Run:

```bash
npx ts-node scripts/sync-opcodes.ts
```

- [ ] **Step 4: Encode/decode numeric IL to the new opcodes**

Add encoder methods:

```ts
operationNumericBinOp(...)
operationNumericBinOpTyped(...)
operationNumericUnOp(...)
operationNumericUnOpTyped(...)
operationNumericCast(...)
operationNumericKindOf(...)
operationNumericIsInteger(...)
```

Each emits `VM_OP2_EXTENDED_4`, the Ex4 operation byte, and `encodeNumericTypeDescriptor(type)`.

Teach `decode-snapshot.ts` disassembly to consume and label the descriptor, rejecting invalid descriptor bytes before continuing to the next instruction.

- [ ] **Step 5: Execute typed/context opcodes directly in native C**

Typed forms skip flavor inspection for operands whose flavor contract is established by the bytecode and call fixed semantic helpers directly. Context forms still inspect runtime operand flavors but supply the encoded default context to generic dispatch.

If a typed instruction encounters a malformed/non-numeric runtime value in safe execution, return `MVM_E_NUMERIC_ERROR` rather than trusting compiler provenance blindly.

- [ ] **Step 6: Cross-check constant folding, specialized bytecode, and generic dispatch**

Extend native tests so the same operand table runs by three routes:

```text
constant source expression
compiler-provable typed locals
object/property escape forcing dynamic dispatch
```

For each route compare returned values and follow-up arithmetic that is sensitive to retained flavor. Also assert the disassembly carries the expected typed/context descriptor. `Number.kind` is wired into the source-level builtins in Task 7, so this task does not depend on that public introspection API yet. Include every integer width `1..64` in a generated loop for add/multiply/wrap and representative widths for the rest of the operator matrix.

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/decode-snapshot/numeric-opcodes.test.ts test/native/numeric-runtime.test.ts test/numeric-types/numeric-types.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add native-vm/microvium_opcodes.h lib/bytecode-opcodes.ts lib/encode-snapshot-function-body.ts lib/decode-snapshot.ts native-vm/microvium.c lib/virtual-machine.ts test/decode-snapshot/numeric-opcodes.test.ts test/native/numeric-runtime.test.ts
git commit -m "feat: specialize numeric bytecode operations"
```

---

### Task 7: Add `Number.kind`, exact C numeric FFI, and restore the stable binary64 host API

**Files:**
- Modify: `lib/virtual-machine.ts`
- Modify: `lib/builtin-globals.ts`
- Modify: `native-vm/microvium.h`
- Modify: `native-vm/microvium_internals.h`
- Modify: `native-vm/microvium.c`
- Create: `test/native/numeric-api.c`
- Create: `test/native/numeric-api.test.ts`
- Delete after replacement test passes: `test/native/float-api-smoke.c`
- Delete after replacement test passes: `test/native/float-width-compile.test.ts`

**Interfaces:**
- Produces script API:
  ```js
  Number.kind(value)      // "number", "u12", "i7", "f32", "f64", or undefined
  Number.isInteger(value) // exact for flavored integers, including u64/i64 above 2^53
  ```
- Produces stable C convenience API:
  ```c
  MVM_EXPORT mvm_Value mvm_newNumber(mvm_VM* vm, MVM_FLOAT64 value);
  MVM_EXPORT MVM_FLOAT64 mvm_toFloat64(mvm_VM* vm, mvm_Value value);
  ```
- Produces exact typed C API:
  ```c
  typedef enum mvm_TeNumericKind {
    MVM_NUM_ORDINARY,
    MVM_NUM_SIGNED,
    MVM_NUM_UNSIGNED,
    MVM_NUM_FLOAT,
  } mvm_TeNumericKind;

  typedef struct mvm_NumericValue {
    mvm_TeNumericKind kind;
    uint8_t width;
    union {
      int64_t i;
      uint64_t u;
      float f32;
      double f64;
    } value;
  } mvm_NumericValue;

  MVM_EXPORT mvm_TeError mvm_newNumeric(mvm_VM* vm, const mvm_NumericValue* value, mvm_Value* out);
  MVM_EXPORT mvm_TeError mvm_getNumeric(mvm_VM* vm, mvm_Value value, mvm_NumericValue* out);
  ```

- [ ] **Step 1: Write `Number.kind` and C API tests**

In the TypeScript/native API test, compile a snapshot exporting values:

```js
vmExport(1, /*u12*/ 4095);
vmExport(2, /*i37*/ -1234567);
vmExport(3, /*u64*/ 9007199254740993);
vmExport(4, /*f32*/ 1.5);
vmExport(5, /*f64*/ 1.5);
vmExport(6, 1.5);
vmExport(7, Number.kind);
```

In C, round-trip each exact flavor through `mvm_getNumeric`, then construct equivalent values with `mvm_newNumeric` and call script `Number.kind`/comparison functions to verify semantics. Assert `mvm_toFloat64` explicitly rounds/loses precision for wide integers as documented, while `mvm_getNumeric` does not.

Add a compile-only assertion that client code no longer needs `MVM_FLOAT_WIDTH` and that `mvm_newNumber`/`mvm_toFloat64` use `MVM_FLOAT64`.

- [ ] **Step 2: Run the new API test and verify failure**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/native/numeric-api.test.ts
```

Expected: FAIL because the new APIs and `Number.kind` are absent.

- [ ] **Step 3: Expose `Number.kind` and exact `Number.isInteger` through custom IL**

Use the existing custom-IL builtin mechanism rather than trying to implement flavor inspection in ordinary JavaScript. In `VirtualMachine.addBuiltinGlobals`, add `Microvium.numericKindOf` and `Microvium.numericIsInteger` custom IL functions backed by `NumericKindOf` and `NumericIsInteger`. In `builtin-globals.ts`, wire the user-facing Number object:

```ts
const Number = global.Number = vm.newObject();
Number.isNaN = runtimeLib.Number_isNaN;
Number.kind = global.Microvium.numericKindOf;
Number.isInteger = global.Microvium.numericIsInteger;
```

`Number.kind` returns `undefined` for non-Numbers and semantic flavor strings only; it never reveals payload bucket or boxing. `Number.isInteger` uses the exact VM numeric value so wide flavored integers remain integers even when their host-JS projection would be lossy.

- [ ] **Step 4: Restore the public binary64 convenience ABI**

Remove `MVM_FLOAT_WIDTH` and build-selected `MVM_FLOAT` from `microvium.h`. Restore/define:

```c
#ifndef MVM_FLOAT64
#define MVM_FLOAT64 double
#endif

MVM_EXPORT MVM_FLOAT64 mvm_toFloat64(mvm_VM* vm, mvm_Value value);
MVM_EXPORT mvm_Value mvm_newNumber(mvm_VM* vm, MVM_FLOAT64 value);
```

Do not retain the unreleased `MVM_FLOAT`, `mvm_toFloat`, or `MVM_FLOAT_WIDTH` API as compatibility aliases. Update all in-tree native callers to `MVM_FLOAT64`/`mvm_toFloat64`. Remove `MVM_E_BYTECODE_FLOAT_WIDTH_MISMATCH` references entirely; error slot 58 is already repurposed by Task 5.

When the snapshot default is f32, `mvm_newNumber` must `float`-round before testing whether the value can use an integer physical representation.

- [ ] **Step 5: Implement exact numeric FFI validation and round-trip**

`mvm_newNumeric` validates:

```text
MVM_NUM_ORDINARY: width == 0, source is value.f64, apply VM ordinary default
MVM_NUM_SIGNED:   1 <= width <= 64, normalize value.i to width
MVM_NUM_UNSIGNED: 1 <= width <= 64, normalize value.u to width
MVM_NUM_FLOAT:    width == 32 or 64, use matching union member
```

`mvm_getNumeric` reports exact semantic kind/width and exact integer bits without converting through double. Ordinary Number returns `kind=MVM_NUM_ORDINARY`, `width=0`, `value.f64`.

- [ ] **Step 6: Run focused API/native tests**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/native/numeric-api.test.ts test/native/numeric-runtime.test.ts
```

Expected: PASS.

- [ ] **Step 7: Delete the superseded build-selected API tests**

```bash
git rm test/native/float-api-smoke.c test/native/float-width-compile.test.ts
```

- [ ] **Step 8: Commit**

```bash
git add lib/virtual-machine.ts lib/builtin-globals.ts native-vm/microvium.h native-vm/microvium_internals.h native-vm/microvium.c test/native/numeric-api.c test/native/numeric-api.test.ts
git commit -m "feat: expose exact numeric FFI"
```

---

### Task 8: Supersede configurable-float build plumbing and complete integration parity

**Files:**
- Modify: `native-vm/microvium_port_example.h`
- Modify: `scripts/build-compiler-bundle.mjs`
- Modify: `scripts/build-compiler-wasm.mjs`
- Modify: `scripts/build-compiler-native.mjs`
- Modify: `web/compiler/build-config.d.ts`
- Modify: `web/compiler/entry.ts`
- Modify: `web/compiler/compiler-wasm.test.ts`
- Modify: `test/end-to-end/end-to-end.test.ts`
- Modify: `test/getting-started/getting-started.test.ts` only as required by regenerated public C output
- Modify: `doc/supported-language.md`
- Modify: `doc/supported-builtins.md`
- Modify: `docs/compiler-cli.md`
- Delete: `test/virtual-machine/float-width.test.ts`
- Regenerate: `dist-c/microvium.c`
- Regenerate: `dist-c/microvium.h`
- Regenerate: `dist-c/microvium_port_example.h`
- Regenerate through getting-started test only if that test intentionally refreshes checked-in examples: `test/getting-started/code/microvium/*`

**Interfaces:**
- Replaces build environment `MVM_FLOAT_WIDTH` with compiler default option `MVM_DEFAULT_FLOAT_WIDTH` only where a build artifact wants a baked ordinary-Number default.
- Browser compiler metadata becomes:
  ```json
  { "defaultFloatWidth": 32 }
  ```
  or 64.
- No native runtime binary is specialized by float width.

- [ ] **Step 1: Replace the browser/compiler build tests before changing scripts**

Change `web/compiler/compiler-wasm.test.ts` to expect one mixed-capability compiler whose build-time option only chooses the ordinary default:

```ts
test('f32-default compiler emits engine-minor-1 numeric snapshots', function () {
  const build = spawnSync(process.execPath, ['scripts/build-compiler-wasm.mjs'], {
    env: { ...process.env, MVM_DEFAULT_FLOAT_WIDTH: '32' },
    encoding: 'utf8',
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);
  assert.deepEqual(JSON.parse(fs.readFileSync('dist-web/compiler-config.json', 'utf8')), {
    defaultFloatWidth: 32,
  });
  const decoded = decodeSnapshot(runCompiler(path.resolve('dist-web/compiler.wasm'), 'vmExport(1, 1.5);'));
  assert.isTrue(decoded.snapshotInfo.flags.has(IL.ExecutionFlag.NumericTypes));
});
```

Add a source program using both `/*f32*/` and `/*f64*/` in the same compiler build and assert successful snapshot decoding.

- [ ] **Step 2: Run the focused web compiler test and verify failure**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd web/compiler/compiler.test.ts web/compiler/compiler-wasm.test.ts
```

Expected: FAIL on old `MVM_FLOAT_WIDTH` plumbing/metadata.

- [ ] **Step 3: Remove configurable-float build specialization**

Update scripts and web entry:

```text
MVM_FLOAT_WIDTH       -> removed
__MVM_FLOAT_WIDTH__   -> removed
VirtualMachineOptions.floatWidth -> removed temporary alias
MVM_DEFAULT_FLOAT_WIDTH -> optional 32|64 compiler default only
__MVM_DEFAULT_FLOAT_WIDTH__ -> 32|64 injected into browser compiler bundle
compiler-config.json  -> { "defaultFloatWidth": 32|64 }
```

`web/compiler/entry.ts` constructs `VirtualMachineFriendly` with `{ defaultFloatWidth: compilerDefaultFloatWidth }`. `scripts/build-compiler-native.mjs` validates metadata but no longer rejects a runtime/compiler because native float width differs; there is no runtime float width.

Rewrite `microvium_port_example.h` comments to describe `MVM_SUPPORT_FLOAT` only. Remove all claims that snapshots and runtime must share a configured float width.

- [ ] **Step 4: Add final end-to-end parity cases**

Add one end-to-end source fixture inline in the existing test harness that covers:

```js
const bag = {};
bag.u = /*u12*/ 4095;
bag.i = /*i7*/ -64;
bag.f = /*f32*/ 1.0000001;

vmExport(1, () => /*u12*/ bag.u + 1);
vmExport(2, () => (/*u64*/ 9007199254740993) > (/*u64*/ 9007199254740992));
vmExport(3, () => /*f64*/ bag.f + /*f64*/ 1);
vmExport(4, () => Number.kind(bag.u));
```

Exercise the reference VM, generated snapshot decode, and native VM. Assert values and kinds agree. Include a legacy-f64-only program and assert its snapshot still records required minor 0 and runs on the new runtime.

- [ ] **Step 5: Document the numeric dialect and compiler default**

Update `doc/supported-language.md` with the exact `/*uN*/`, `/*iN*/`, `/*f32*/`, `/*f64*/`, cast-form, and file-header syntax, including the 1..64 integer-width range, dynamic-binding rule, same-signed width promotion, explicit signed/unsigned conversion requirement, and the distinction between a numeric boundary and a cast.

Update `doc/supported-builtins.md` with `Number.kind` and the exact `Number.isInteger` behavior. Explicitly state that `typeof` remains `"number"`, semantic flavor is ignored by ordinary numeric equality, and storage representation is not exposed.

Update `docs/compiler-cli.md` to replace the superseded `MVM_FLOAT_WIDTH` build mode with `MVM_DEFAULT_FLOAT_WIDTH=32|64` as a compiler ordinary-Number default only. Document that one compiler/runtime supports explicit f32 and f64 together, and that source files can override the default with the file-header directive. State that flavor-preserving `Math.*` overloads are intentionally not part of this implementation; existing `Math.*` behavior remains ordinary Number behavior.

- [ ] **Step 6: Regenerate synchronized/generated outputs**

Run:

```bash
npx ts-node scripts/sync-opcodes.ts
npx ts-node scripts/preprocess-microvium.ts
```

Do not hand-edit `dist-c` output.

- [ ] **Step 7: Run the focused touched-code verification set**

Run:

```bash
npx mocha --no-config --require ts-node/register --ui tdd \
  test/numeric-types/numeric-types.test.ts \
  test/virtual-machine/numeric-types.test.ts \
  test/src-to-il/numeric-annotations.test.ts \
  test/decode-snapshot/numeric-types.test.ts \
  test/decode-snapshot/numeric-opcodes.test.ts \
  test/native/numeric-runtime.test.ts \
  test/native/numeric-api.test.ts \
  web/compiler/compiler.test.ts \
  web/compiler/compiler-wasm.test.ts
```

Expected: PASS.

Then run the existing end-to-end and getting-started tests because this task changes generated public C artifacts and snapshot compatibility:

```bash
npx mocha --no-config --require ts-node/register --ui tdd test/end-to-end/end-to-end.test.ts test/getting-started/getting-started.test.ts
```

Expected: PASS.

Do not run the entire repository suite in this task; the touched-code and public-artifact tests above are the intended checkpoint.

- [ ] **Step 8: Delete the final obsolete configurable-float test**

```bash
git rm test/virtual-machine/float-width.test.ts
```

Confirm no production/configuration references remain:

```bash
rg -n "MVM_FLOAT_WIDTH|FF_FLOAT32|ExecutionFlag\.Float32|floatWidth|BYTECODE_FLOAT_WIDTH_MISMATCH" native-vm lib scripts web test
```

Expected: no matches except historical design text if intentionally retained under `docs/superpowers/specs/`.

- [ ] **Step 9: Commit**

```bash
git add native-vm/microvium_port_example.h scripts/build-compiler-bundle.mjs scripts/build-compiler-wasm.mjs scripts/build-compiler-native.mjs web/compiler/build-config.d.ts web/compiler/entry.ts web/compiler/compiler-wasm.test.ts test/end-to-end/end-to-end.test.ts test/getting-started/getting-started.test.ts doc/supported-language.md doc/supported-builtins.md docs/compiler-cli.md dist-c/microvium.c dist-c/microvium.h dist-c/microvium_port_example.h test/getting-started/code/microvium/microvium.c test/getting-started/code/microvium/microvium.h test/getting-started/code/microvium_port.h
git rm test/virtual-machine/float-width.test.ts
git commit -m "build: replace configurable float mode"
```

---

## Post-plan verification notes

The first correct implementation intentionally boxes flavored values whenever their flavor must survive dynamically. Do not add box elision, immediate flavored tags, or dedicated dense i32/u32/f32/f64 short opcodes during these tasks. Those are follow-up optimizations only after the three semantic execution paths agree.

The implementation is complete when the focused test matrix demonstrates all of the following in both reference and native execution:

```text
ordinary f64 legacy source -> engine minor 0 snapshot
ordinary f32 default       -> engine minor 1 + FF_NUMERIC_TYPES + numericOptions bit 0
explicit f32/f64 together  -> one runtime, correct per-operation rounding
all iN/uN widths 1..64     -> exact wrapping semantics
u64/i64 above 2^53         -> exact comparison and exact FFI
bare boundary vs cast      -> distinct documented evaluation behavior
known typed arithmetic      -> specialized bytecode
escaped/dynamic arithmetic  -> generic flavor dispatch
Number.kind                 -> semantic flavor only
released 8.0 f64 snapshot   -> accepted by engine 8.1
engine 8.1 numeric snapshot -> rejected by engine 8.0 via required minor
```
