import { assert } from 'chai';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';
import { decodeSnapshot } from '../../lib/decode-snapshot';
import { Snapshot } from '../../lib';

function compile(source: string, defaultFloatWidth: 32 | 64 = 64): { snapshot: Snapshot; disassembly: string } {
  const vm = VirtualMachineFriendly.create({}, { defaultFloatWidth });
  vm.globalThis.vmExport = vm.vmExport;
  vm.evaluateModule({ sourceText: source });
  const snapshot = vm.createSnapshot();
  return { snapshot, disassembly: decodeSnapshot(snapshot).disassembly };
}

suite('numeric specialized opcodes', () => {
  test('constant typed arithmetic folds without an add instruction', () => {
    const { disassembly } = compile('vmExport(1, () => /*u12*/ (3 + 4));');
    assert.notInclude(disassembly, 'NumericBinOp');
    assert.notInclude(disassembly, 'VM_OP4_NUM_ADD');
  });

  test('boundary arithmetic uses a context opcode and descriptor', () => {
    const { disassembly } = compile('vmExport(1, x => /*u12*/ x + 4);');
    assert.include(disassembly, 'NumericBinOp(+, u12)');
    assert.include(disassembly, 'NumericCast(u12)');
  });

  test('compiler-proven operands use the typed opcode', () => {
    const { disassembly } = compile('vmExport(1, (a, b) => /*(u12)*/ a + /*(u12)*/ b);');
    assert.include(disassembly, 'NumericBinOpTyped(+, u12)');
  });

  test('float and odd-width descriptors decode', () => {
    const { disassembly } = compile(`
      vmExport(1, (a, b) => /*(f32)*/ a + /*(f32)*/ b);
      vmExport(2, (a, b) => /*(f64)*/ a + /*(f64)*/ b);
      vmExport(3, (a, b) => /*(i7)*/ a + /*(i7)*/ b);
      vmExport(4, (a, b) => /*(u37)*/ a + /*(u37)*/ b);
    `);
    for (const type of ['f32', 'f64', 'i7', 'u37']) assert.include(disassembly, `NumericBinOpTyped(+, ${type})`);
  });

  test('file default has a separate ordinary-number context opcode', () => {
    const { disassembly } = compile('/* microvium: default-float=f32 */\nvmExport(1, (x, y) => x + y);', 64);
    assert.include(disassembly, 'NumericBinOp(+, f32, default)');
  });

  test('ordinary arithmetic retains legacy bytecode', () => {
    const { snapshot, disassembly } = compile('vmExport(1, (a, b) => a + b);');
    assert.equal(snapshot.data[2], 0);
    assert.notInclude(disassembly, 'NumericBinOp');
    assert.notInclude(disassembly, 'VM_OP4_NUM_ADD');
  });
});
