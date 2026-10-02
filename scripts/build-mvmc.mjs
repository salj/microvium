import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quickjsDir = path.resolve(process.env.QUICKJS_NG_DIR || path.join(root, 'wasm-build/quickjs-ng'));
const generatedDir = path.join(root, 'wasm-build/build');
const outputDir = path.join(root, 'dist-native');
const output = path.join(outputDir, process.platform === 'win32' ? 'mvmc.exe' : 'mvmc');
const compiler = process.env.NATIVE_MVMC_CC || process.env.HOST_CC || process.env.CC || 'clang';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

for (const source of ['quickjs.c', 'libregexp.c', 'libunicode.c', 'dtoa.c']) {
  try {
    await readFile(path.join(quickjsDir, source));
  } catch {
    throw new Error(`QuickJS-NG source not found at ${quickjsDir}; set QUICKJS_NG_DIR or restore wasm-build/quickjs-ng`);
  }
}

await run(process.execPath, ['scripts/prepare-compiler-bytecode.mjs']);
await mkdir(outputDir, { recursive: true });

const args = [
  '-std=c11', '-O2', '-DNDEBUG', '-D_GNU_SOURCE',
  `-I${quickjsDir}`,
  `-I${path.join(root, 'native-mvmc')}`,
  `-I${path.join(root, 'native-vm')}`,
  `-I${generatedDir}`,
  'native-mvmc/mvmc.c',
  'native-vm/microvium.c',
  path.join(quickjsDir, 'quickjs.c'),
  path.join(quickjsDir, 'libregexp.c'),
  path.join(quickjsDir, 'libunicode.c'),
  path.join(quickjsDir, 'dtoa.c'),
  '-o', output,
];

if (process.platform !== 'win32') args.push('-lm');
if (process.platform === 'linux' && process.env.NATIVE_MVMC_STATIC === '1') args.push('-static');

run(compiler, args);
console.log(`Built ${path.relative(root, output)}`);
