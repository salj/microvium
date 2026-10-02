import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quickjsDir = path.resolve(process.env.QUICKJS_NG_DIR || path.join(root, 'wasm-build/quickjs-ng'));
const generatedDir = path.join(root, 'wasm-build/build');
const bytecodeOutput = path.join(generatedDir, 'compiler-entry.qbc');
const generatedHeader = path.join(generatedDir, 'compiler-bytecode.h');
const bytecodeCompiler = path.join(generatedDir, process.platform === 'win32' ? 'compiler-bytecode.exe' : 'compiler-bytecode');
const hostCC = process.env.HOST_CC || 'clang';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

await mkdir(generatedDir, { recursive: true });
await readFile(path.join(root, 'wasm-build/compiler-bytecode.c'));
for (const source of ['quickjs.c', 'libregexp.c', 'libunicode.c', 'dtoa.c']) {
  try {
    await readFile(path.join(quickjsDir, source));
  } catch {
    throw new Error(`QuickJS-NG source not found at ${quickjsDir}; set QUICKJS_NG_DIR or restore wasm-build/quickjs-ng`);
  }
}

run(process.execPath, ['scripts/build-compiler-bundle.mjs']);
run(hostCC, [
  '-O2', '-DNDEBUG', '-D_GNU_SOURCE',
  `-I${quickjsDir}`,
  path.join(root, 'wasm-build/compiler-bytecode.c'),
  path.join(quickjsDir, 'quickjs.c'),
  path.join(quickjsDir, 'libregexp.c'),
  path.join(quickjsDir, 'libunicode.c'),
  path.join(quickjsDir, 'dtoa.c'),
  ...(process.platform === 'win32' ? [] : ['-lm']),
  '-o', bytecodeCompiler
]);
run(bytecodeCompiler, [path.join(root, 'dist-web/compiler-entry.js'), bytecodeOutput]);

const bytecode = await readFile(bytecodeOutput);
const literals = [];
for (let i = 0; i < bytecode.length; i += 1000) {
  const chunk = [];
  const end = Math.min(i + 1000, bytecode.length);
  for (let j = i; j < end; j++) chunk.push(`\\x${bytecode[j].toString(16).padStart(2, '0')}`);
  literals.push(`"${chunk.join('')}"`);
}
await writeFile(generatedHeader, `static const uint8_t mvm_compiler_bundle[] =\n${literals.join('\n')};\n`, 'utf8');
