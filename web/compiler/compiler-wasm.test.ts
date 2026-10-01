import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { assert } from 'chai';
import { SnapshotClass } from '../../lib/snapshot';
import { decodeSnapshot } from '../../lib/decode-snapshot';
import * as IL from '../../lib/il';

function runCompiler(wasmPath: string, source: string) {
  const runnerPath = path.resolve('scripts/run-compiler-wasm.mjs');
  const result = spawnSync(process.execPath, [runnerPath, wasmPath], {
    input: source,
    maxBuffer: 4 * 1024 * 1024
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.toString('utf8'));
  return new SnapshotClass(Buffer.from(result.stdout));
}

suite('compiler WebAssembly', () => {
  test('has no runtime imports', function () {
    const wasmPath = path.resolve('dist-web/compiler.wasm');
    const wasm = (globalThis as any).WebAssembly;
    const module = new wasm.Module(fs.readFileSync(wasmPath));
    assert.deepEqual(wasm.Module.imports(module), []);
  });

  test('reads source on stdin and writes a validated snapshot to stdout', function () {
    const wasmPath = path.resolve('dist-web/compiler.wasm');
    const snapshot = runCompiler(
      wasmPath,
      `const host = vmImport(1); vmExport(1, function (n) { return n + host(n); });`
    );
    assert.isAbove(snapshot.data.byteLength, 16);
  });

  test('f32-default compiler emits mixed numeric snapshots', function () {
    this.timeout(120000);
    const build = spawnSync(process.execPath, ['scripts/build-compiler-wasm.mjs'], {
      env: { ...process.env, MVM_DEFAULT_FLOAT_WIDTH: '32' },
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    });
    assert.equal(build.status, 0, build.stderr || build.stdout);

    const config = JSON.parse(fs.readFileSync('dist-web/compiler-config.json', 'utf8'));
    assert.deepEqual(config, { defaultFloatWidth: 32 });

    const snapshot = runCompiler(path.resolve('dist-web/compiler.wasm'), 'vmExport(1, 1.5);');
    const decoded = decodeSnapshot(snapshot);
    assert.isTrue(decoded.snapshotInfo.flags.has(IL.ExecutionFlag.NumericTypes));

    const mixedSnapshot = runCompiler(
      path.resolve('dist-web/compiler.wasm'),
      'vmExport(1, /*f32*/ 1.0000001 + /*(f64)*/ 1);'
    );
    assert.isTrue(decodeSnapshot(mixedSnapshot).snapshotInfo.flags.has(IL.ExecutionFlag.NumericTypes));
  });
});
