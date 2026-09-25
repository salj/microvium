import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist-web');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

run(process.execPath, ['scripts/build-compiler-wasm.mjs']);
run('bash', ['wasm-build/build.sh']);
await mkdir(output, { recursive: true });
await copyFile(path.join(root, 'web/demo/index.html'), path.join(output, 'index.html'));
await copyFile(path.join(root, 'wasm-build/build/microvium-runtime.wasm'), path.join(output, 'microvium-runtime.wasm'));
await build({
  entryPoints: [path.join(root, 'web/demo/app.mjs')],
  outfile: path.join(output, 'app.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  logLevel: 'info'
});
