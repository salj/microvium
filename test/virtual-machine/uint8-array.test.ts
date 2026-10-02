import { assert } from 'chai';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';
import { compileJs } from '../common';
import { IL } from '../../lib';
import { decodeSnapshot } from '../../lib/decode-snapshot';
import Microvium from '../../lib';

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

  test('integer fields pack across bytes and preserve neighboring bits', () => {
    const vm = VirtualMachineFriendly.create();
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: `
      vmExport(1, () => {
        const packet = Microvium.newUint8Array(2);
        packet[0] = 0xAA;
        if (MicroviumBytes.writeInteger(packet, 1, 3, 2, true) !== packet) return false;
        if (packet[0] !== 0xA4) return false;
        if (MicroviumBytes.readInteger(packet, 1, 3, false, true) !== 2) return false;

        const bigEndian = Microvium.newUint8Array(2);
        MicroviumBytes.writeInteger(bigEndian, 3, 9, 0x12D, false);
        if (bigEndian[0] !== 0x12 || bigEndian[1] !== 0xD0) return false;
        return MicroviumBytes.readInteger(bigEndian, 3, 9, false, false) === 0x12D;
      });
    ` });

    assert.isTrue((vm.resolveExport(1) as () => boolean)());
    const snapshot = vm.createSnapshot();
    assert.equal(snapshot.data.readUInt8(2), 3);
    assert.isTrue(decodeSnapshot(snapshot).snapshotInfo.flags.has(IL.ExecutionFlag.NumericTypes));
  });

  test('numeric writes can mutate a byte array captured in the snapshot', () => {
    const vm = VirtualMachineFriendly.create();
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: `
      const packet = Microvium.newUint8Array(1);
      vmExport(1, () => {
        MicroviumBytes.writeInteger(packet, 0, 8, 0xA5, true);
        return packet[0];
      });
    ` });

    const snapshot = vm.createSnapshot();
    const native = Microvium.restore(snapshot);
    assert.equal(native.resolveExport(1)(), 0xA5);
  });

  test('reads and writes signed, wide, and floating representations', () => {
    const vm = VirtualMachineFriendly.create();
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: `
      vmExport(1, () => {
        const signedValue = /*i64*/ -9007199254740993;
        const wide = Microvium.newUint8Array(8);
        MicroviumBytes.writeInteger(wide, 0, 64, signedValue, true);
        const signedRoundTrip = MicroviumBytes.readInteger(wide, 0, 64, true, true);
        if (signedRoundTrip !== signedValue || Number.kind(signedRoundTrip) !== 'i64') return false;

        const unsignedValue = /*u64*/ 18446744073709551615;
        MicroviumBytes.writeInteger(wide, 0, 64, unsignedValue, true);
        const unsignedRoundTrip = MicroviumBytes.readInteger(wide, 0, 64, false, true);
        if (unsignedRoundTrip !== unsignedValue || Number.kind(unsignedRoundTrip) !== 'u64') return false;

        const floatBytes = Microvium.newUint8Array(12);
        MicroviumBytes.writeFloat(floatBytes, 0, 32, 1.5, true);
        if (floatBytes[0] !== 0 || floatBytes[1] !== 0 || floatBytes[2] !== 0xC0 || floatBytes[3] !== 0x3F) return false;
        const f32 = MicroviumBytes.readFloat(floatBytes, 0, 32, true);
        if (f32 !== 1.5 || Number.kind(f32) !== 'f32') return false;

        MicroviumBytes.writeFloat(floatBytes, 4, 64, -2.25, false);
        const f64 = MicroviumBytes.readFloat(floatBytes, 4, 64, false);
        return f64 === -2.25 && Number.kind(f64) === 'f64' && floatBytes[4] === 0xC0;
      });
    ` });

    assert.isTrue((vm.resolveExport(1) as () => boolean)());
  });

  test('rejects invalid widths and out-of-bounds bit ranges', () => {
    const vm = VirtualMachineFriendly.create();
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: `
      const bytes = Microvium.newUint8Array(1);
      vmExport(1, () => MicroviumBytes.readInteger(bytes, 0, 0, false, true));
      vmExport(2, () => MicroviumBytes.readInteger(bytes, 7, 2, false, true));
    ` });

    assert.throws(vm.resolveExport(1) as () => unknown, /bit width must be in the range/);
    assert.throws(vm.resolveExport(2) as () => unknown, /bit range out of bounds/);
  });
});
