import { assert } from 'chai';
import {
  binaryNumeric,
  compareNumeric,
  convertNumeric,
  decodeNumericTypeDescriptor,
  encodeNumericTypeDescriptor,
  NumericError,
  NumericValueData,
  numericTypeName,
  parseNumericTypeName,
  unaryNumeric,
} from '../../lib/numeric-types';

function numberResult(value: NumericValueData | boolean): NumericValueData {
  assert.notTypeOf(value, 'boolean');
  return value as NumericValueData;
}

suite('numeric type semantics', () => {
  test('parses arbitrary integer widths and fixed float widths', () => {
    assert.deepEqual(parseNumericTypeName('u12'), { kind: 'integer', signed: false, width: 12 });
    assert.deepEqual(parseNumericTypeName('i37'), { kind: 'integer', signed: true, width: 37 });
    assert.deepEqual(parseNumericTypeName('f32'), { kind: 'float', width: 32 });
    assert.deepEqual(parseNumericTypeName('f64'), { kind: 'float', width: 64 });
    assert.equal(numericTypeName({ kind: 'integer', signed: true, width: 7 }), 'i7');
    assert.equal(numericTypeName({ kind: 'float', width: 32 }), 'f32');
    assert.isUndefined(parseNumericTypeName('u0'));
    assert.isUndefined(parseNumericTypeName('i65'));
    assert.isUndefined(parseNumericTypeName('f48'));
    assert.isUndefined(parseNumericTypeName('u012'));
  });

  test('same-signed integer operations use max width and wrap', () => {
    const u12 = { flavor: { kind: 'integer' as const, signed: false, width: 12 }, value: 4095n };
    const u20 = { flavor: { kind: 'integer' as const, signed: false, width: 20 }, value: 1n };
    assert.deepEqual(binaryNumeric('+', u12, u20, undefined, 64), {
      flavor: { kind: 'integer', signed: false, width: 20 }, value: 4096n,
    });
    assert.deepEqual(binaryNumeric('+', u12, { ...u12, value: 1n }, undefined, 64), {
      flavor: { kind: 'integer', signed: false, width: 12 }, value: 0n,
    });
    assert.deepEqual(binaryNumeric('*', u12, u20, undefined, 64), {
      flavor: { kind: 'integer', signed: false, width: 20 }, value: 4095n,
    });
  });

  test('normalizes signed and unsigned boundaries at every width', () => {
    for (let width = 1; width <= 64; width++) {
      const mod = 1n << BigInt(width);
      const signedMax = (1n << BigInt(width - 1)) - 1n;
      const signedMin = -(1n << BigInt(width - 1));
      const signed = { kind: 'integer' as const, signed: true, width };
      const unsigned = { kind: 'integer' as const, signed: false, width };
      assert.equal(convertNumeric({ flavor: signed, value: signedMax + 1n }, signed, 64).value, signedMin);
      assert.equal(convertNumeric({ flavor: signed, value: signedMin - 1n }, signed, 64).value, signedMax);
      assert.equal(convertNumeric({ flavor: unsigned, value: -1n }, unsigned, 64).value, mod - 1n);
      assert.equal(convertNumeric({ flavor: unsigned, value: mod }, unsigned, 64).value, 0n);
    }
  });

  test('u64 comparison stays exact above 2^53 and ignores flavor', () => {
    const a = { flavor: { kind: 'integer' as const, signed: false, width: 64 }, value: 9007199254740993n };
    const b = { flavor: { kind: 'integer' as const, signed: false, width: 64 }, value: 9007199254740992n };
    assert.isTrue(compareNumeric('>', a, b));
    assert.isFalse(compareNumeric('===', a, b));
    assert.isTrue(compareNumeric('===',
      { flavor: { kind: 'integer', signed: false, width: 12 }, value: 3n },
      { flavor: { kind: 'float', width: 64 }, value: 3 }));
  });

  test('integer division truncates toward zero and remainder follows division', () => {
    const i8 = { flavor: { kind: 'integer' as const, signed: true, width: 8 } };
    assert.equal(numberResult(binaryNumeric('/', { ...i8, value: -7n }, { ...i8, value: 3n }, undefined, 64)).value, -2n);
    assert.equal(numberResult(binaryNumeric('%', { ...i8, value: -7n }, { ...i8, value: 3n }, undefined, 64)).value, -1n);
    assert.throws(() => binaryNumeric('/', { ...i8, value: 1n }, { ...i8, value: 0n }, undefined, 64), NumericError);
  });

  test('integer powers wrap at the promoted width and reject negative exponents', () => {
    const u8 = { flavor: { kind: 'integer' as const, signed: false, width: 8 } };
    const i8 = { flavor: { kind: 'integer' as const, signed: true, width: 8 } };
    assert.equal(numberResult(binaryNumeric('**', { ...u8, value: 3n }, { ...u8, value: 6n }, undefined, 64)).value, 217n);
    assert.throws(() => binaryNumeric('**', { ...i8, value: 2n }, { ...i8, value: -1n }, undefined, 64), NumericError);
  });

  test('floating powers preserve JavaScript infinity edge cases', () => {
    const result = numberResult(binaryNumeric('**',
      { flavor: { kind: 'ordinary' }, value: 1 },
      { flavor: { kind: 'ordinary' }, value: Infinity },
      undefined,
      64,
    ));
    assert.isTrue(Number.isNaN(result.value as number));
  });

  test('shifts use lhs width, reject negative counts, and define oversized counts', () => {
    const u8 = { flavor: { kind: 'integer' as const, signed: false, width: 8 } };
    const i8 = { flavor: { kind: 'integer' as const, signed: true, width: 8 } };
    assert.equal(numberResult(binaryNumeric('<<', { ...u8, value: 1n }, { ...u8, value: 8n }, undefined, 64)).value, 0n);
    assert.equal(numberResult(binaryNumeric('>>', { ...i8, value: -1n }, { ...u8, value: 8n }, undefined, 64)).value, -1n);
    assert.equal(numberResult(binaryNumeric('>>>', { ...i8, value: -1n }, { ...u8, value: 1n }, undefined, 64)).value, 127n);
    assert.throws(() => binaryNumeric('<<', { ...u8, value: 1n }, { ...i8, value: -1n }, undefined, 64), NumericError);
    for (let width = 1; width <= 64; width++) {
      const signed = { flavor: { kind: 'integer' as const, signed: true, width } };
      const maxCount = { flavor: { kind: 'integer' as const, signed: false, width: 7 }, value: BigInt(width) };
      assert.equal(numberResult(binaryNumeric('<<', { ...signed, value: 1n }, maxCount, undefined, 64)).value, 0n);
      assert.equal(numberResult(binaryNumeric('>>', { ...signed, value: -1n }, maxCount, undefined, 64)).value, -1n);
    }
  });

  test('float promotion and f32 rounding happen at each operation', () => {
    const f32 = { flavor: { kind: 'float' as const, width: 32 as const } };
    const f64 = { flavor: { kind: 'float' as const, width: 64 as const } };
    const roundedProduct = Math.fround(Math.fround(16777216) * Math.fround(1.0000001));
    assert.equal(numberResult(binaryNumeric('*', { ...f32, value: 16777216 }, { ...f32, value: 1.0000001 }, undefined, 64)).value, roundedProduct);
    assert.deepEqual(numberResult(binaryNumeric('+', { ...f32, value: 1 }, { ...f64, value: 2 }, undefined, 64)).flavor, f64.flavor);
    assert.deepEqual(numberResult(binaryNumeric('+', { flavor: { kind: 'integer', signed: false, width: 64 }, value: 3n }, { ...f32, value: 2 }, undefined, 64)).flavor, f32.flavor);
    assert.deepEqual(numberResult(binaryNumeric('+', { flavor: { kind: 'ordinary' }, value: 3 }, { flavor: { kind: 'integer', signed: false, width: 8 }, value: 2n }, undefined, 64)).flavor, { kind: 'ordinary' });
    assert.equal(numberResult(unaryNumeric('-', { flavor: { kind: 'integer', signed: true, width: 8 }, value: -128n }, undefined, 64)).value, -128n);
    assert.equal(numberResult(unaryNumeric('~', { flavor: { kind: 'integer', signed: false, width: 8 }, value: 0n }, undefined, 64)).value, 255n);
  });

  test('ordinary operands inherit a numeric context', () => {
    const context = { kind: 'integer' as const, signed: false, width: 8 };
    assert.deepEqual(binaryNumeric('+', { flavor: { kind: 'ordinary' }, value: 255 }, { flavor: { kind: 'ordinary' }, value: 1 }, context, 64), {
      flavor: context, value: 0n,
    });
  });

  test('float to integer conversion truncates and rejects non-finite values', () => {
    const u12 = { kind: 'integer' as const, signed: false, width: 12 };
    assert.equal(convertNumeric({ flavor: { kind: 'float', width: 64 }, value: -1.9 }, u12, 64).value, 4095n);
    assert.throws(() => convertNumeric({ flavor: { kind: 'float', width: 64 }, value: Infinity }, u12, 64), NumericError);
    assert.throws(() => convertNumeric({ flavor: { kind: 'float', width: 64 }, value: NaN }, u12, 64), NumericError);
  });

  test('descriptors round-trip every integer width', () => {
    for (let width = 1; width <= 64; width++) {
      for (const signed of [false, true]) {
        const type = { kind: 'integer' as const, signed, width };
        assert.deepEqual(decodeNumericTypeDescriptor(encodeNumericTypeDescriptor(type)), type);
      }
    }
    assert.deepEqual(decodeNumericTypeDescriptor(0x80), { kind: 'float', width: 32 });
    assert.deepEqual(decodeNumericTypeDescriptor(0x81), { kind: 'float', width: 64 });
    assert.throws(() => decodeNumericTypeDescriptor(0x82), NumericError);
  });
});
