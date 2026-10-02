import { assert } from 'chai';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

suite('Uint8Array reference VM', () => {
  test('out-of-range writes are rejected', () => {
    const vm = VirtualMachineFriendly.create({}, { noLib: true });

    assert.throws(() => vm.evaluateModule({
      sourceText: `
        const bytes = Microvium.newUint8Array(1);
        bytes[1] = 7;
      `,
    }), /Uint8Array index out of bounds/);
  });
});
