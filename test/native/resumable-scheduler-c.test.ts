import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { assert } from 'chai';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

suite('C resumable scheduler', () => {
  test('serializes budgeted calls and delivers an async host completion as a fresh turn', () => {
    const source = `
      const hostWait = vmImport(0);
      let observed = 0;
      vmExport(1, async function () { observed = await hostWait(); });
      vmExport(2, function () { return observed; });
      vmExport(3, function () { while (true) {} });
    `;
    const vm = VirtualMachineFriendly.create({});
    vm.globalThis.vmImport = vm.vmImport;
    vm.globalThis.vmExport = vm.vmExport;
    vm.evaluateModule({ sourceText: source });
    const snapshot = vm.createSnapshot();

    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'microvium-resumable-c-'));
    const bytecodePath = path.join(temporaryDirectory, 'resumable.mvm-bc');
    const executablePath = path.join(temporaryDirectory, 'resumable-c');
    try {
      fs.writeFileSync(bytecodePath, snapshot.data);
      const compile = spawnSync(process.env.CC || 'cc', [
        '-std=c11',
        '-DMVM_GAS_COUNTER',
        '-I', 'native-vm-bindings',
        '-I', 'dist-c',
        'test/native/resumable-scheduler-c.c',
        'dist-c/microvium_scheduler.c',
        'dist-c/microvium.c',
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
