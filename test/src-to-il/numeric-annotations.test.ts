import { assert } from 'chai';
import { compileScript } from '../../lib/src-to-il/src-to-il';
import { stringifyUnit } from '../../lib/stringify-il';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';
import { parseExactIntegerLiteral } from '../../lib/src-to-il/numeric-annotations';

function compile(source: string): string {
  const { unit } = compileScript('numeric-annotations.mvm.js', source);
  return stringifyUnit(unit);
}

function run(source: string, defaultFloatWidth: 32 | 64 = 64) {
  return runMany(source, [1], defaultFloatWidth)[0];
}

function runMany(source: string, exportIDs: number[], defaultFloatWidth: 32 | 64 = 64) {
  const vm = VirtualMachineFriendly.create({}, { defaultFloatWidth });
  vm.globalThis.vmExport = vm.vmExport;
  vm.evaluateModule({ sourceText: source });
  return exportIDs.map(id => vm.resolveExport(id));
}

suite('numeric source annotations', () => {
  test('bare annotation covers the whole initializer', () => {
    const il = compile('let x = /*u12*/ a + b;');
    assert.include(il, 'NumericBinOp');
    assert.include(il, 'u12');
  });

  test('cast binds tightly to the following operand', () => {
    const il = compile('let x = /*(f64)*/ a * b;');
    const castAt = il.indexOf('NumericCast');
    const multiplyAt = il.indexOf('BinOp');
    assert.isAtLeast(castAt, 0);
    assert.isAtLeast(multiplyAt, 0);
    assert.isBelow(castAt, multiplyAt);
  });

  test('a parenthesized cast operand stays tight before a following operator', () => {
    const il = compile('let x = /*(f32)*/ (a + b) - c;');
    const addAt = il.indexOf("BinOp(op '+')");
    const castAt = il.indexOf('NumericCast');
    const subtractAt = il.indexOf("BinOp(op '-')");
    assert.isAtLeast(addAt, 0);
    assert.isAtLeast(castAt, 0);
    assert.isAtLeast(subtractAt, 0);
    assert.isBelow(addAt, castAt);
    assert.isBelow(castAt, subtractAt);
  });

  test('a cast over a parenthesized compound expression stays outside it', () => {
    const il = compile('let x = /*(f32)*/ (a + b - c);');
    const subtractAt = il.indexOf("BinOp(op '-')");
    const castAt = il.indexOf('NumericCast');
    assert.isAtLeast(subtractAt, 0);
    assert.isAtLeast(castAt, 0);
    assert.isBelow(subtractAt, castAt);
  });

  test('ambiguous bare operand annotation is rejected', () => {
    assert.throws(() => compile('a + /*u12*/ b * c;'), /numeric boundary/i);
  });

  test('parenthesized bare subexpression is accepted', () => {
    assert.doesNotThrow(() => compile('a + /*u12*/ (b * c);'));
  });

  test('u64 integer literal is captured exactly from source text', () => {
    assert.equal(parseExactIntegerLiteral('9_007_199_254_740_993'), 9007199254740993n);
    const il = compile('let x = /*u64*/ 9_007_199_254_740_993;');
    assert.include(il, '9007199254740993');
  });

  test('file default header overrides the VM default for ordinary arithmetic', () => {
    const result = run('/* microvium: default-float=f32 */\nvmExport(1, () => 33554434 / 2);', 64);
    assert.equal(result(), 16777216);

    const wider = run('/* microvium: default-float=f64 */\nvmExport(1, () => 33554434 / 2);', 32);
    assert.equal(wider(), 16777217);

    const stringAdd = run('/* microvium: default-float=f32 */\nvmExport(1, () => "a" + "b");', 64);
    assert.equal(stringAdd(), 'ab');
  });

  test('invalid numeric widths are rejected', () => {
    assert.throws(() => compile('let x = /*u0*/ 1;'), /Invalid numeric type annotation/);
    assert.throws(() => compile('let x = /*i65*/ 1;'), /Invalid numeric type annotation/);
    assert.throws(() => compile('let x = /*f48*/ 1;'), /Invalid numeric type annotation/);
  });

  test('numeric annotation comments cannot contain line terminators', () => {
    assert.throws(() => compile('let x = /*u12\n*/ 1;'), /may not contain a line terminator/);
  });

  test('line comments do not act as numeric annotations', () => {
    assert.doesNotThrow(() => compile('let x = //u12\n1;'));
  });

  test('file default directive must be a unique header comment', () => {
    assert.throws(() => compile('let x = 1; /* microvium: default-float=f32 */'), /only legal in the file header/);
    assert.throws(() => compile('/* microvium: default-float=f32 */\n/* microvium: default-float=f64 */\n1;'), /Only one default-float directive/);
  });

  test('constant integer division and remainder by zero are compile errors', () => {
    assert.throws(() => compile('let x = /*i12*/ a / 0;'), /division by zero/i);
    assert.throws(() => compile('let x = /*u12*/ a % 0;'), /remainder by zero/i);
  });

  test('negative constant integer shift counts are compile errors', () => {
    assert.throws(() => compile('let x = /*i12*/ a << -1;'), /shift count cannot be negative/i);
  });

  test('statically evident signed and unsigned mixing is rejected', () => {
    assert.throws(() => compile('let x = /*(u12)*/ a + /*(i12)*/ b;'), /Implicit u12 and i12 arithmetic is not allowed/i);
  });

  test('ordinary Number plus typed integer needs a boundary', () => {
    assert.throws(() => compile('let x = 1 + /*(u12)*/ a;'), /ordinary Number with a typed integer/i);
  });

  test('increment, decrement, compound assignment, and reassignment stay value-typed', () => {
    const functions = runMany(`
      let x = /*u8*/ 255;
      let postfix = x++;
      let afterIncrement = x;
      let y = /*i8*/ -128;
      let oldY = y--;
      let afterDecrement = y;
      let z = /*u8*/ 255;
      z += /*u8*/ 1;
      let afterCompound = z;
      z = 'banana';
      vmExport(1, () => postfix);
      vmExport(2, () => afterIncrement);
      vmExport(3, () => oldY);
      vmExport(4, () => afterDecrement);
      vmExport(5, () => afterCompound);
      vmExport(6, () => z);
    `, [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(functions.map((fn: any) => fn()), [255, 0, -128, 127, 0, 'banana']);
  });
});
