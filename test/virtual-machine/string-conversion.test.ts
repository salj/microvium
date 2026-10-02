import { assert } from 'chai';
import Microvium from '../../lib';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

suite('string conversion', () => {
  test('reference and native VMs use the same object and function placeholders', () => {
    const vm = VirtualMachineFriendly.create();
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: `
      const array = [];
      const object = {};
      function fn() {}
      class Example {}
      vmExport(0, () => '' + array + '|' + object + '|' + fn + '|' + Example);
    ` });

    const expected = '[Object]|[Object]|[Function]|[Function]';
    assert.equal((vm.resolveExport(0) as () => string)(), expected);

    const native = Microvium.restore(vm.createSnapshot());
    assert.equal(native.resolveExport(0)(), expected);
  });
});
