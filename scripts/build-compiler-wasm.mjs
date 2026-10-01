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
const generatedHeader = path.join(generatedDir, 'compiler-bundle.h');
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

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

await mkdir(generatedDir, { recursive: true });
run(process.execPath, ['scripts/build-compiler-bundle.mjs']);

const bundle = await readFile(jsBundle, 'utf8');
const codepoints = Array.from(bundle);
const chunks = [];
for (let i = 0; i < codepoints.length; i += 1000) {
  chunks.push(codepoints.slice(i, i + 1000).join(''));
}
const cLiterals = chunks.map(chunk => JSON.stringify(chunk)).join('\n');
await writeFile(generatedHeader, `static const char mvm_compiler_bundle[] =\n${cLiterals};\n`, 'utf8');

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
