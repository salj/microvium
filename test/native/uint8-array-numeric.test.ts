import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { assert } from 'chai';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

suite('native Uint8Array numeric access', () => {
  test('packs arbitrary-width fields and reinterprets f32/f64 bytes', () => {
    const vm = VirtualMachineFriendly.create();
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: `
      vmExport(1, () => {
        const packet = Microvium.newUint8Array(2);
        packet[0] = 0xAA;
        MicroviumBytes.writeInteger(packet, 1, 3, 2, true);
        if (packet[0] !== 0xA4) return false;

        const bigEndian = Microvium.newUint8Array(2);
        MicroviumBytes.writeInteger(bigEndian, 3, 9, 0x12D, false);
        if (bigEndian[0] !== 0x12 || bigEndian[1] !== 0xD0) return false;
        if (MicroviumBytes.readInteger(bigEndian, 3, 9, false, false) !== 0x12D) return false;

        const small = Microvium.newUint8Array(1);
        const negativeI7 = /*i7*/ -64;
        MicroviumBytes.writeInteger(small, 0, 7, negativeI7, true);
        const smallRoundTrip = MicroviumBytes.readInteger(small, 0, 7, true, true);
        if (smallRoundTrip !== negativeI7 || Number.kind(smallRoundTrip) !== 'i7') return false;

        const wide = Microvium.newUint8Array(8);
        const aboveSafeInteger = /*u64*/ 9007199254740993;
        MicroviumBytes.writeInteger(wide, 0, 64, aboveSafeInteger, true);
        const wideRoundTrip = MicroviumBytes.readInteger(wide, 0, 64, false, true);
        if (wideRoundTrip !== aboveSafeInteger || Number.kind(wideRoundTrip) !== 'u64') return false;

        const floats = Microvium.newUint8Array(12);
        MicroviumBytes.writeFloat(floats, 0, 32, 1.5, true);
        if (floats[0] !== 0 || floats[1] !== 0 || floats[2] !== 0xC0 || floats[3] !== 0x3F) return false;
        const f32 = MicroviumBytes.readFloat(floats, 0, 32, true);
        if (f32 !== 1.5 || Number.kind(f32) !== 'f32') return false;

        MicroviumBytes.writeFloat(floats, 4, 64, -2.25, false);
        const f64 = MicroviumBytes.readFloat(floats, 4, 64, false);
        return f64 === -2.25 && Number.kind(f64) === 'f64' && floats[4] === 0xC0;
      });
    ` });

    const snapshot = vm.createSnapshot();
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'microvium-uint8-numeric-'));
    const bytecodePath = path.join(temporaryDirectory, 'uint8-numeric.mvm-bc');
    const executablePath = path.join(temporaryDirectory, 'uint8-numeric');
    try {
      fs.writeFileSync(bytecodePath, snapshot.data);
      const compile = spawnSync(process.env.CC || 'cc', [
        '-std=c11',
        '-I', 'native-vm-bindings',
        '-I', 'native-vm',
        'test/native/uint8-array-numeric.c',
        'native-vm/microvium.c',
        '-lm',
        '-o', executablePath,
      ], { encoding: 'utf8' });
      assert.equal(compile.status, 0, compile.stderr || compile.stdout);

      const run = spawnSync(executablePath, [bytecodePath], { encoding: 'utf8' });
      assert.equal(run.status, 0, run.stderr || run.stdout || `signal=${run.signal}; error=${run.error?.message}`);
    } finally {
      fs.removeSync(temporaryDirectory);
    }
  });
});
