import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { assert } from 'chai';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';
import { decodeSnapshot } from '../../lib/decode-snapshot';
import { IL } from '../../lib';

suite('native numeric API', () => {
  test('exposes exact numeric flavors and Number introspection', () => {
    const source = `
      vmExport(1, /*u12*/ 4095);
      vmExport(2, /*i37*/ -1234567);
      vmExport(3, /*u64*/ 9007199254740993);
      vmExport(4, /*f32*/ 1.5);
      vmExport(5, /*f64*/ 1.5);
      vmExport(6, 1.5);
      vmExport(7, Number.kind);
      vmExport(8, Number.isInteger);
      vmExport(9, () => Number.kind(/*u12*/ 1));
      vmExport(10, () => Number.kind(true));
      vmExport(11, () => Number.isInteger(/*u64*/ 9007199254740993));
      vmExport(12, () => Number.isInteger(1.5));
    `;
    const vm = VirtualMachineFriendly.create({}, { defaultFloatWidth: 64 });
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: source });
    assert.equal((vm.resolveExport(9) as () => string)(), 'u12');
    assert.isUndefined((vm.resolveExport(10) as () => string | undefined)());
    assert.isTrue((vm.resolveExport(11) as () => boolean)());
    assert.isFalse((vm.resolveExport(12) as () => boolean)());
    const snapshot = vm.createSnapshot();
    const decoded = decodeSnapshot(snapshot);
    assert.isTrue(decoded.snapshotInfo.flags.has(IL.ExecutionFlag.NumericTypes));

    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'microvium-numeric-api-'));
    const bytecodePath = path.join(temporaryDirectory, 'numeric-api.mvm-bc');
    const executablePath = path.join(temporaryDirectory, 'numeric-api');
    try {
      fs.writeFileSync(bytecodePath, snapshot.data);
      const compile = spawnSync(process.env.CC || 'cc', [
        '-std=c11',
        '-I', 'native-vm-bindings',
        '-I', 'native-vm',
        'test/native/numeric-api.c',
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
