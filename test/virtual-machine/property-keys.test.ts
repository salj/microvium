import { assert } from 'chai';
import Microvium from '../../lib';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

suite('property keys', () => {
  test('both VMs accept supported numeric indexes; the reference VM rejects invalid ones', () => {
    const vm = VirtualMachineFriendly.create();
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: `
      const array = [];
      array[0] = 12;
      array[1] = 43;
      const integerFlavor = /*u8*/ 1;
      const floatFlavor = /*f32*/ 0;
      vmExport(1, () => array[integerFlavor]);
      vmExport(2, () => array[floatFlavor]);
      vmExport(3, () => array[-0]);
      vmExport(4, () => array[1.5]);
      vmExport(5, () => array[-1]);
      vmExport(6, () => array[8192]);
    ` });

    const snapshot = vm.createSnapshot();
    const native = Microvium.restore(snapshot);
    assert.equal(vm.resolveExport(1)(), 43);
    assert.equal(vm.resolveExport(2)(), 12);
    assert.equal(vm.resolveExport(3)(), 12);
    assert.throws(() => vm.resolveExport(4)());
    assert.throws(() => vm.resolveExport(5)());
    assert.throws(() => vm.resolveExport(6)());

    assert.equal(native.resolveExport(1)(), 43);
    assert.equal(native.resolveExport(2)(), 12);
    assert.equal(native.resolveExport(3)(), 12);
  });
});
