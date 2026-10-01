import { readFile } from 'node:fs/promises';
import { BrowserCompiler } from '../web/compiler/browser-compiler.mjs';

const filename = process.argv[2];
if (!filename) throw new Error('usage: node scripts/run-compiler-wasm.mjs <module.wasm>');

let source = '';
for await (const chunk of process.stdin) source += chunk;

try {
  const compiler = new BrowserCompiler(await readFile(filename));
  const snapshot = await compiler.compile(source);
  process.stdout.write(snapshot);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
