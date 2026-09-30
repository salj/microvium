import type * as IL from './il';

export type IntegerNumericType = { kind: 'integer'; signed: boolean; width: number };
export type FloatNumericType = { kind: 'float'; width: 32 | 64 };
export type NumericType = IntegerNumericType | FloatNumericType;
export type NumericFlavor = { kind: 'ordinary' } | NumericType;

export interface NumericValueData {
  flavor: NumericFlavor;
  value: number | bigint;
}

export type NumericErrorCode =
  | 'invalid-type'
  | 'mixed-signedness'
  | 'division-by-zero'
  | 'remainder-by-zero'
  | 'negative-exponent'
  | 'invalid-shift-count'
  | 'float-bitwise-operation'
  | 'non-finite-integer-conversion'
  | 'invalid-numeric-value';

export class NumericError extends Error {
  public readonly code: NumericErrorCode;

  constructor(code: NumericErrorCode, message: string) {
    super(message);
    this.name = 'NumericError';
    this.code = code;
  }
}

export function parseNumericTypeName(name: string): NumericType | undefined {
  if (name === 'f32') return { kind: 'float', width: 32 };
  if (name === 'f64') return { kind: 'float', width: 64 };
  const match = /^([iu])([1-9][0-9]*)$/.exec(name);
  if (!match) return undefined;
  const width = Number(match[2]);
  if (width < 1 || width > 64) return undefined;
  return { kind: 'integer', signed: match[1] === 'i', width };
}

export function numericTypeName(type: NumericType): string {
  if (type.kind === 'float') return `f${type.width}`;
  return `${type.signed ? 'i' : 'u'}${type.width}`;
}

function assertNumericType(type: NumericType): void {
  if (type.kind === 'integer') {
    if (!Number.isInteger(type.width) || type.width < 1 || type.width > 64) {
      throw new NumericError('invalid-type', `Invalid integer width: ${type.width}`);
    }
  } else if (type.width !== 32 && type.width !== 64) {
    throw new NumericError('invalid-type', `Invalid float width: ${type.width}`);
  }
}

function modulus(width: number): bigint {
  return 1n << BigInt(width);
}

function normalizeUnsigned(value: bigint, width: number): bigint {
  const m = modulus(width);
  return ((value % m) + m) % m;
}

function normalizeInteger(value: bigint, type: IntegerNumericType): bigint {
  const unsigned = normalizeUnsigned(value, type.width);
  if (!type.signed) return unsigned;
  const sign = 1n << BigInt(type.width - 1);
  return (unsigned & sign) === 0n ? unsigned : unsigned - modulus(type.width);
}

function asInteger(value: number | bigint): bigint {
  if (typeof value === 'bigint') return value;
  if (!Number.isFinite(value)) {
    throw new NumericError('non-finite-integer-conversion', 'NaN and infinity cannot be converted to an integer');
  }
  return BigInt(Math.trunc(value));
}

function asFloat(value: number | bigint, width: 32 | 64): number {
  const number = typeof value === 'bigint' ? Number(value) : value;
  return width === 32 ? Math.fround(number) : number;
}

export function convertNumeric(value: NumericValueData, target: NumericType, ordinaryDefault: 32 | 64): NumericValueData {
  assertNumericType(target);
  if (target.kind === 'integer') {
    return { flavor: target, value: normalizeInteger(asInteger(value.value), target) };
  }
  return { flavor: target, value: asFloat(value.value, target.width) };
}

function isIntegerType(type: NumericType): type is IntegerNumericType {
  return type.kind === 'integer';
}

interface ResolvedValue {
  type: NumericType;
  value: number | bigint;
  sourceWasOrdinary: boolean;
}

function resolveValue(value: NumericValueData, context: NumericType | undefined, ordinaryDefault: 32 | 64): ResolvedValue {
  if (value.flavor.kind !== 'ordinary') {
    assertNumericType(value.flavor);
    if (value.flavor.kind === 'integer') {
      return { type: value.flavor, value: normalizeInteger(asInteger(value.value), value.flavor), sourceWasOrdinary: false };
    }
    return { type: value.flavor, value: asFloat(value.value, value.flavor.width), sourceWasOrdinary: false };
  }
  if (context) {
    const converted = convertNumeric(value, context, ordinaryDefault);
    return { type: context, value: converted.value, sourceWasOrdinary: true };
  }
  return {
    type: { kind: 'float', width: ordinaryDefault },
    value: asFloat(value.value, ordinaryDefault),
    sourceWasOrdinary: true,
  };
}

function commonFloatType(left: ResolvedValue, right: ResolvedValue, ordinaryDefault: 32 | 64, context: NumericType | undefined): FloatNumericType {
  let width: 32 | 64 = context?.kind === 'float'
    ? context.width
    : context
      ? 32
      : left.sourceWasOrdinary || right.sourceWasOrdinary
        ? ordinaryDefault
        : 32;
  if (left.type.kind === 'float') width = Math.max(width, left.type.width) as 32 | 64;
  if (right.type.kind === 'float') width = Math.max(width, right.type.width) as 32 | 64;
  if (context?.kind === 'float') width = Math.max(width, context.width) as 32 | 64;
  return { kind: 'float', width };
}

function compareValues(left: number | bigint, right: number | bigint, op: '<' | '>' | '<=' | '>=' | '===' | '!=='): boolean {
  if (op === '===' || op === '!==') {
    let equal: boolean;
    if (typeof left === 'bigint' && typeof right === 'bigint') {
      equal = left === right;
    } else if (typeof left === 'number' && typeof right === 'number') {
      equal = left === right;
    } else {
      const integer = typeof left === 'bigint' ? left : right as bigint;
      const number = typeof left === 'number' ? left : right as number;
      equal = Number.isFinite(number) && Number.isInteger(number) && BigInt(number) === integer;
    }
    return op === '===' ? equal : !equal;
  }
  switch (op) {
    case '<': return left < (right as any);
    case '>': return left > (right as any);
    case '<=': return left <= (right as any);
    case '>=': return left >= (right as any);
  }
}

export function compareNumeric(
  op: '<' | '>' | '<=' | '>=' | '===' | '!==',
  left: NumericValueData,
  right: NumericValueData,
): boolean {
  return compareValues(left.value, right.value, op);
}

function modularPower(base: bigint, exponent: bigint, width: number, signed: boolean): bigint {
  if (exponent < 0n) throw new NumericError('negative-exponent', 'A typed integer exponent cannot be negative');
  const m = modulus(width);
  let result = 1n % m;
  let factor = normalizeUnsigned(base, width);
  let power = exponent;
  while (power > 0n) {
    if (power & 1n) result = (result * factor) % m;
    factor = (factor * factor) % m;
    power >>= 1n;
  }
  const type: IntegerNumericType = { kind: 'integer', signed, width };
  return normalizeInteger(result, type);
}

function floatResultFlavor(
  left: ResolvedValue,
  right: ResolvedValue,
  type: FloatNumericType,
  context: NumericType | undefined,
): NumericFlavor {
  // An operation context controls conversion and precision. It does not by
  // itself turn ordinary Number values into explicitly flavored floats.
  // Explicit flavors still promote the result to a Float.
  if ((!left.sourceWasOrdinary && left.type.kind !== 'integer') ||
    (!right.sourceWasOrdinary && right.type.kind !== 'integer') ||
    (context?.kind === 'float' && (!left.sourceWasOrdinary || !right.sourceWasOrdinary))) return type;
  return { kind: 'ordinary' };
}

export function binaryNumeric(
  op: IL.BinOpCode,
  leftData: NumericValueData,
  rightData: NumericValueData,
  context: NumericType | undefined,
  ordinaryDefault: 32 | 64,
): NumericValueData | boolean {
  if (context) assertNumericType(context);
  const left = resolveValue(leftData, context, ordinaryDefault);
  const right = resolveValue(rightData, context, ordinaryDefault);

  if (op === '===' || op === '!==') return compareValues(left.value, right.value, op);
  if (op === '<' || op === '>' || op === '<=' || op === '>=') return compareValues(left.value, right.value, op);

  const leftType = left.type;
  const rightType = right.type;
  if (op === '<<' || op === '>>' || op === '>>>') {
    if (!isIntegerType(leftType) || (!isIntegerType(rightType) && !right.sourceWasOrdinary)) {
      throw new NumericError('float-bitwise-operation', 'Typed shifts require integer operands');
    }
    const count = asInteger(right.value);
    if (count < 0n) throw new NumericError('invalid-shift-count', 'Shift count cannot be negative');
    let result: bigint;
    if (count >= BigInt(leftType.width)) {
      result = op === '>>' && leftType.signed && (left.value as bigint) < 0n
        ? -1n
        : 0n;
    } else if (op === '<<') {
      result = (left.value as bigint) << count;
    } else if (op === '>>' && leftType.signed) {
      result = (left.value as bigint) >> count;
    } else {
      result = normalizeUnsigned(left.value as bigint, leftType.width) >> count;
    }
    const resultType = op === '>>>' && leftType.signed
      ? { kind: 'integer' as const, signed: false, width: leftType.width }
      : leftType;
    return { flavor: resultType, value: normalizeInteger(result, resultType) };
  }

  const bothInteger = isIntegerType(leftType) && isIntegerType(rightType);
  if (bothInteger) {
    if (leftType.signed !== rightType.signed) {
      throw new NumericError('mixed-signedness', 'Implicit signed/unsigned integer arithmetic is not allowed');
    }
    const resultType: IntegerNumericType = {
      kind: 'integer', signed: leftType.signed, width: Math.max(leftType.width, rightType.width),
    };
    const a = asInteger(left.value);
    const b = asInteger(right.value);
    let result: bigint;
    switch (op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/':
      case 'DIVIDE_AND_TRUNC':
        if (b === 0n) throw new NumericError('division-by-zero', 'Integer division by zero');
        result = a / b;
        break;
      case '%':
        if (b === 0n) throw new NumericError('remainder-by-zero', 'Integer remainder by zero');
        result = a % b;
        break;
      case '**': return { flavor: resultType, value: modularPower(a, b, resultType.width, resultType.signed) };
      case '&': result = a & b; break;
      case '|': result = a | b; break;
      case '^': result = a ^ b; break;
      default: throw new NumericError('invalid-numeric-value', `Unsupported typed numeric operator: ${op}`);
    }
    return { flavor: resultType, value: normalizeInteger(result, resultType) };
  }

  if (op === '&' || op === '|' || op === '^' || op === 'DIVIDE_AND_TRUNC') {
    throw new NumericError('float-bitwise-operation', `Operator ${op} requires integer operands in a numeric context`);
  }

  const floatType = commonFloatType(left, right, ordinaryDefault, context);
  const a = asFloat(left.value, floatType.width);
  const b = asFloat(right.value, floatType.width);
  let result: number;
  switch (op) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/': result = a / b; break;
    case '%': result = a % b; break;
    case '**': result = a ** b; break;
    default: throw new NumericError('invalid-numeric-value', `Unsupported typed numeric operator: ${op}`);
  }
  return { flavor: floatResultFlavor(left, right, floatType, context), value: asFloat(result, floatType.width) };
}

export function unaryNumeric(
  op: IL.UnOpCode,
  value: NumericValueData,
  context: NumericType | undefined,
  ordinaryDefault: 32 | 64,
): NumericValueData {
  if (context) assertNumericType(context);
  const resolved = resolveValue(value, context, ordinaryDefault);
  if (op === '++' || op === '--') {
    const increment = op === '++';
    if (resolved.type.kind === 'integer') {
      const amount = increment ? 1n : -1n;
      return {
        flavor: resolved.type,
        value: normalizeInteger((resolved.value as bigint) + amount, resolved.type),
      };
    }
    const result = asFloat(resolved.value, resolved.type.width) + (increment ? 1 : -1);
    const flavor = value.flavor.kind === 'ordinary' && context?.kind !== 'integer'
      ? { kind: 'ordinary' as const }
      : resolved.type;
    return { flavor, value: asFloat(result, resolved.type.width) };
  }
  if (op === '+') {
    return {
      flavor: context?.kind === 'integer' || value.flavor.kind !== 'ordinary'
        ? resolved.type
        : { kind: 'ordinary' },
      value: resolved.value,
    };
  }
  if (op === '-' && resolved.type.kind === 'integer') {
    return { flavor: resolved.type, value: normalizeInteger(-(resolved.value as bigint), resolved.type) };
  }
  if (op === '~' && resolved.type.kind === 'integer') {
    return { flavor: resolved.type, value: normalizeInteger(~(resolved.value as bigint), resolved.type) };
  }
  if ((op === '-' || op === '~') && resolved.type.kind === 'float') {
    if (op === '~') throw new NumericError('float-bitwise-operation', 'Bitwise complement requires an integer flavor');
    const result = -(resolved.value as number);
    const flavor = value.flavor.kind === 'ordinary' && context?.kind !== 'integer'
      ? { kind: 'ordinary' as const }
      : resolved.type;
    return { flavor, value: asFloat(result, resolved.type.width) };
  }
  throw new NumericError('invalid-numeric-value', `Unsupported typed numeric unary operator: ${op}`);
}

export function encodeNumericTypeDescriptor(type: NumericType): number {
  assertNumericType(type);
  if (type.kind === 'float') return type.width === 32 ? 0x80 : 0x81;
  return (type.signed ? 0x40 : 0) | (type.width - 1);
}

export function decodeNumericTypeDescriptor(byte: number): NumericType {
  if (!Number.isInteger(byte) || byte < 0 || byte > 0xff) {
    throw new NumericError('invalid-type', `Invalid numeric descriptor byte: ${byte}`);
  }
  if (byte === 0x80) return { kind: 'float', width: 32 };
  if (byte === 0x81) return { kind: 'float', width: 64 };
  if ((byte & 0x80) !== 0) throw new NumericError('invalid-type', `Reserved numeric descriptor byte: ${byte}`);
  return { kind: 'integer', signed: (byte & 0x40) !== 0, width: (byte & 0x3f) + 1 };
}
