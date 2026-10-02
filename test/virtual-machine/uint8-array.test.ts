import { assert } from 'chai';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';
import { compileJs } from '../common';

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

  test('snapshots that can create extended arrays require engine minor 2', () => {
    const snapshot = compileJs`
        const bytes = Microvium.newUint8Array(8191);
        vmExport(0, () => bytes);
      `;

    assert.equal(snapshot.data.readUInt8(2), 2);
  });
});
