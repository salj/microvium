import { readFile } from 'node:fs/promises';
import { WASI } from 'node:wasi';

const filename = process.argv[2];
if (!filename) throw new Error('usage: node scripts/run-compiler-wasm.mjs <module.wasm>');

const wasi = new WASI({ version: 'preview1', args: [], env: {}, preopens: {} });
const bytes = await readFile(filename);
const { instance } = await WebAssembly.instantiate(bytes, wasi.getImportObject());
wasi.start(instance);
