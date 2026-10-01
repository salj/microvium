import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quickjsDir = path.resolve(process.env.QUICKJS_NG_DIR || path.join(root, 'wasm-build/quickjs-ng'));
const emcc = process.env.EMCC || 'emcc';
const jsBundle = path.join(root, 'dist-web/compiler-entry.js');
const wasmOutput = path.join(root, 'dist-web/compiler.wasm');
const generatedDir = path.join(root, 'wasm-build/build');
const generatedHeader = path.join(generatedDir, 'compiler-bytecode.h');
const bytecodeOutput = path.join(generatedDir, 'compiler-entry.qbc');
const bytecodeCompiler = path.join(
  generatedDir,
  process.platform === 'win32' ? 'compiler-bytecode.exe' : 'compiler-bytecode'
);
const hostCC = process.env.HOST_CC || 'clang';
const configOutput = path.join(root, 'dist-web/compiler-config.json');
const defaultFloatWidth = process.env.MVM_DEFAULT_FLOAT_WIDTH || '64';

if (defaultFloatWidth !== '32' && defaultFloatWidth !== '64') {
  throw new Error('MVM_DEFAULT_FLOAT_WIDTH must be 32 or 64');
}
for (const source of ['quickjs.c', 'libregexp.c', 'libunicode.c', 'dtoa.c']) {
  try {
    await readFile(path.join(quickjsDir, source));
  } catch {
    throw new Error(`QuickJS-NG source not found at ${quickjsDir}; set QUICKJS_NG_DIR or restore wasm-build/quickjs-ng`);
  }
}
await readFile(path.join(root, 'wasm-build/compiler-bytecode.c'));

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

await mkdir(generatedDir, { recursive: true });
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
run(bytecodeCompiler, [jsBundle, bytecodeOutput]);

const bytecode = await readFile(bytecodeOutput);
const literals = [];
for (let i = 0; i < bytecode.length; i += 1000) {
  const chunk = [];
  const end = Math.min(i + 1000, bytecode.length);
  for (let j = i; j < end; j++) {
    chunk.push(`\\x${bytecode[j].toString(16).padStart(2, '0')}`);
  }
  literals.push(`"${chunk.join('')}"`);
}
await writeFile(
  generatedHeader,
  `static const uint8_t mvm_compiler_bundle[] =\n${literals.join('\n')};\n`,
  'utf8'
);

const exportedFunctions = [
  '_mvm_init', '_mvm_compile', '_mvm_result_pointer', '_mvm_result_size',
  '_mvm_error_pointer', '_mvm_error_size', '_mvm_alloc', '_mvm_free'
];
run(emcc, [
  '-O2', '-DNDEBUG', '-D_GNU_SOURCE', '-Wno-trigraphs',
  `-I${quickjsDir}`, `-I${generatedDir}`,
  'wasm-build/compiler-bridge.c',
  path.join(quickjsDir, 'quickjs.c'),
  path.join(quickjsDir, 'libregexp.c'),
  path.join(quickjsDir, 'libunicode.c'),
  path.join(quickjsDir, 'dtoa.c'),
  '-o', wasmOutput,
  '-s', 'STANDALONE_WASM=1',
  '-s', 'ALLOW_MEMORY_GROWTH=1',
  '-s', 'STACK_SIZE=4194304',
  '-s', 'FILESYSTEM=0',
  '-s', `EXPORTED_FUNCTIONS=${JSON.stringify(exportedFunctions)}`,
  '-Wl,--no-entry',
  `-Wl,--Map=${path.join(root, 'dist-web/compiler.map')}`
]);

const wasmBytes = await readFile(wasmOutput);
const wasmModule = await WebAssembly.compile(wasmBytes);
const imports = WebAssembly.Module.imports(wasmModule);
if (imports.length !== 0) {
  throw new Error(`Compiler WASM must be self-contained; found imports: ${imports.map(i => `${i.module}.${i.name}`).join(', ')}`);
}

await writeFile(
  configOutput,
  `${JSON.stringify({ defaultFloatWidth: Number(defaultFloatWidth) })}\n`,
  'utf8'
);
