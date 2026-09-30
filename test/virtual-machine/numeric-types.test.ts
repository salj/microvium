import { assert } from 'chai';
import { VirtualMachine } from '../../lib/virtual-machine';
import * as IL from '../../lib/il';
import { stringifyValue } from '../../lib/stringify-il';

function op(opcode: IL.Opcode, operands: IL.Operand[], before: number, after: number): IL.Operation {
  return { opcode, operands, stackDepthBefore: before, stackDepthAfter: after } as IL.Operation;
}

function literal(value: IL.Value, before: number): IL.Operation {
  return op('Literal', [{ type: 'LiteralOperand', literal: value }], before, before + 1);
}

function run(operations: IL.Operation[]): IL.Value {
  const vm = new VirtualMachine(undefined, () => undefined, { noLib: true });
  const func: IL.Function = {
    type: 'Function',
    id: 'numeric-test',
    maxStackDepth: 8,
    entryBlockID: 'entry',
    blocks: {
      entry: {
        id: 'entry',
        expectedStackDepthAtEntry: 0,
        operations,
      },
    },
  };
  const unit: IL.Unit = {
    sourceFilename: 'numeric-test.js',
    functions: { [func.id]: func },
    entryFunctionID: func.id,
    moduleVariables: [],
    freeVariables: [],
    moduleImports: [],
  };
  const entry = (vm as any).loadUnit(unit, unit.sourceFilename, new Map(), undefined).entryFunction as IL.FunctionValue;
  const result = vm.runFunction(entry, []);
  if ((result as IL.Exception).type === 'Exception') {
    throw new Error(stringifyValue((result as IL.Exception).exception));
  }
  return result as IL.Value;
}

function returned(operations: IL.Operation[], depth: number): IL.Operation[] {
  return [...operations, op('Return', [], depth, depth - 1)];
}

suite('numeric reference VM', () => {
  test('typed u12 add wraps and preserves the value flavor', () => {
    const type = { kind: 'integer' as const, signed: false, width: 12 };
    const result = run(returned([
      literal(IL.typedIntegerValue(false, 12, 4095n), 0),
      literal(IL.typedIntegerValue(false, 12, 1n), 1),
      op('NumericBinOpTyped', [
        { type: 'OpOperand', subOperation: '+' },
        IL.numericTypeOperand(type),
      ], 2, 1),
    ], 1));
    assert.equal(result.type, 'NumberValue');
    if (result.type !== 'NumberValue') return;
    assert.equal(result.value, 0n);
    assert.deepEqual(result.numericType, type);
  });

  test('context operation promotes explicit f64 and the outer cast narrows to f32', () => {
    const f32 = { kind: 'float' as const, width: 32 as const };
    const result = run(returned([
      literal(IL.typedFloatValue(64, 16777216), 0),
      literal(IL.numberValue(1), 1),
      op('NumericBinOp', [
        { type: 'OpOperand', subOperation: '+' },
        IL.numericTypeOperand(f32),
      ], 2, 1),
      op('NumericCast', [IL.numericTypeOperand(f32)], 1, 1),
    ], 1));
    assert.equal(result.type, 'NumberValue');
    if (result.type !== 'NumberValue') return;
    assert.equal(result.value, 16777216);
    assert.deepEqual(result.numericType, f32);
  });

  test('generic equality ignores flavor and keeps wide integer comparisons exact', () => {
    const wideNotEqual = run(returned([
      literal(IL.typedIntegerValue(false, 64, 9007199254740993n), 0),
      literal(IL.typedIntegerValue(false, 64, 9007199254740992n), 1),
      op('BinOp', [{ type: 'OpOperand', subOperation: '!==' }], 2, 1),
    ], 1));
    assert.deepEqual(wideNotEqual, { type: 'BooleanValue', value: true });

    const equalAcrossFlavors = run(returned([
      literal(IL.typedIntegerValue(false, 12, 3n), 0),
      literal(IL.typedFloatValue(64, 3), 1),
      op('BinOp', [{ type: 'OpOperand', subOperation: '===' }], 2, 1),
    ], 1));
    assert.deepEqual(equalAcrossFlavors, { type: 'BooleanValue', value: true });
  });

  test('dynamic signed and unsigned arithmetic raises a numeric type error', () => {
    const i12 = { kind: 'integer' as const, signed: true, width: 12 };
    assert.throws(() => run(returned([
      literal(IL.typedIntegerValue(true, 12, -1n), 0),
      literal(IL.typedIntegerValue(false, 12, 1n), 1),
      op('NumericBinOp', [
        { type: 'OpOperand', subOperation: '+' },
        IL.numericTypeOperand(i12),
      ], 2, 1),
    ], 1)), /mixed-signedness/);
  });

  test('all flavors remain typeof number and wide typed integers are integers', () => {
    const typed = IL.typedIntegerValue(false, 64, 9007199254740993n);
    const typeOf = run(returned([
      literal(typed, 0),
      op('UnOp', [{ type: 'OpOperand', subOperation: 'typeof' }], 1, 1),
    ], 1));
    assert.deepEqual(typeOf, { type: 'StringValue', value: 'number' });

    const isInteger = run(returned([
      literal(typed, 0),
      op('NumericIsInteger', [], 1, 1),
    ], 1));
    assert.deepEqual(isInteger, { type: 'BooleanValue', value: true });

    const kind = run(returned([
      literal(typed, 0),
      op('NumericKindOf', [], 1, 1),
    ], 1));
    assert.deepEqual(kind, { type: 'StringValue', value: 'u64' });
  });
});
