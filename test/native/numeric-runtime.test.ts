import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { assert } from 'chai';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

suite('native numeric runtime', () => {
  test('dispatches tagged numeric values and preserves f32 defaults', () => {
    const source = `
      /* microvium: default-float=f32 */
      const box = {};
      box.a = /*u12*/ 4095;
      box.b = /*u12*/ 1;
      box.c = 16777216;
      vmExport(1, () => box.a + box.b);
      vmExport(2, () => (/*u12*/ (box.a + box.b + 1)) === (/*u12*/ 1));
      vmExport(3, () => (/*u64*/ 9007199254740993) > (/*u64*/ 9007199254740992));
      vmExport(4, () => box.c + 1);
      vmExport(5, (a, b) => /*(u12)*/ a + /*(u12)*/ b);
    `;
    const vm = VirtualMachineFriendly.create({}, { defaultFloatWidth: 64 });
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: source });
    const snapshot = vm.createSnapshot();

    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'microvium-numeric-runtime-'));
    const bytecodePath = path.join(temporaryDirectory, 'numeric.mvm-bc');
    const executablePath = path.join(temporaryDirectory, 'numeric-runtime');
    try {
      fs.writeFileSync(bytecodePath, snapshot.data);
      const compile = spawnSync(process.env.CC || 'cc', [
        '-std=c11',
        '-I', 'native-vm-bindings',
        '-I', 'native-vm',
        'test/native/numeric-runtime.c',
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
