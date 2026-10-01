import { assert } from 'chai';
import { compileScript } from '../../lib/src-to-il/src-to-il';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';
import { decodeSnapshot } from '../../lib/decode-snapshot';

const source = `
  /** @mvm-ffi (Value, Value) -> Value */
  import { add as plus } from 'math';
  /** @mvm-ffi */
  export function run(x) { return plus(x, 2); }
`;

suite('named FFI compiler surface', () => {
  test('lowers an annotated alias to a host function import and infers exported arity', () => {
    const { unit } = compileScript('<named-ffi>', source);
    assert.deepEqual(unit.moduleImports, []);
    assert.deepEqual(unit.namedImports?.map(i => [i.moduleName, i.importName, i.signature.parameters.length]), [['math', 'add', 2]]);
    assert.deepEqual(unit.namedExports?.map(e => [e.exportName, e.signature.parameters.length]), [['run', 1]]);
    assert.isTrue(Object.values(unit.functions).some(f => Object.values(f.blocks).some(b =>
      b.operations.some(op => op.opcode === 'Literal' && op.operands[0]?.type === 'LiteralOperand' && op.operands[0].literal.type === 'HostFunctionValue'))));
  });

  test('links through the named host map and snapshots the name/signature surface', () => {
    const vm = VirtualMachineFriendly.create({}, {
      noLib: true,
      namedImports: { math: { add: (a: number, b: number) => a + b } },
    });
    vm.evaluateModule({ sourceText: source });
    assert.equal(vm.resolveNamedExport('run')(3), 5);

    const decoded = decodeSnapshot(vm.createSnapshot());
    assert.deepEqual(decoded.snapshotInfo.namedImports?.map(i => [i.moduleName, i.importName, i.signature.parameters.length]), [['math', 'add', 2]]);
    assert.deepEqual(decoded.snapshotInfo.namedExports?.map(e => [e.exportName, e.signature.parameters.length]), [['run', 1]]);
  });

  test('rejects a named host implementation with the wrong declared arity', () => {
    const vm = VirtualMachineFriendly.create({}, {
      noLib: true,
      namedImports: { math: { add: (a: number) => a } },
    });
    assert.throws(() => vm.evaluateModule({ sourceText: source }), /MVM_E_FFI_ABI_ERROR/);
  });

  test('checks imported function arity at the call boundary', () => {
    const vm = VirtualMachineFriendly.create({}, {
      noLib: true,
      namedImports: { math: { add: (a: number, b: number) => a + b } },
    });
    vm.evaluateModule({ sourceText: source.replace('plus(x, 2)', 'plus(x)') });
    assert.throws(() => vm.resolveNamedExport('run')(3), /arity mismatch.*expected 2, received 1/);
  });

  test('rejects unsupported annotated import forms', () => {
    assert.throws(() => compileScript('<named-ffi>', `/** @mvm-ffi (Value) -> Value */ import fn from 'math';`), /only static named function imports/);
    assert.throws(() => compileScript('<named-ffi>', `/** @mvm-ffi (Value) -> Value */ import * as math from 'math';`), /only static named function imports/);
  });
});
