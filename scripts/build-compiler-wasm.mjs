import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const javyName = process.platform === 'win32' ? 'javy.exe' : 'javy';
const javy = process.env.JAVY || path.join(root, '.tools', javyName);
const jsBundle = 'dist-web/compiler-entry.js';
const wasmOutput = 'dist-web/compiler.wasm';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

const javyCheck = spawnSync(javy, ['--version'], { cwd: root, stdio: 'ignore' });
if (javyCheck.error || javyCheck.status !== 0) {
  if (process.env.JAVY) throw new Error(`Javy executable not available: ${javy}`);
  run('bash', ['scripts/fetch-javy.sh']);
}

run(process.execPath, ['scripts/build-compiler-bundle.mjs', 'web/compiler/javy-entry.ts', jsBundle]);
run(javy, ['build', jsBundle, '-o', wasmOutput]);
