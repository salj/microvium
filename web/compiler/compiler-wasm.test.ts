import { spawnSync } from 'child_process';
import * as path from 'path';
import { assert } from 'chai';
import { SnapshotClass } from '../../lib/snapshot';

suite('compiler WebAssembly', () => {
  test('reads source on stdin and writes a validated snapshot to stdout', function () {
    const wasmPath = path.resolve('dist-web/compiler.wasm');
    const runnerPath = path.resolve('scripts/run-compiler-wasm.mjs');
    const result = spawnSync(process.execPath, [runnerPath, wasmPath], {
      input: `const host = vmImport(1); vmExport(1, function (n) { return n + host(n); });`,
      maxBuffer: 4 * 1024 * 1024
    });

    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr.toString('utf8'));
    const snapshot = new SnapshotClass(Buffer.from(result.stdout));
    assert.isAbove(snapshot.data.byteLength, 16);
  });
});
