import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { BrowserCompiler } from '../compiler/browser-compiler.mjs';
import { createBrowserRuntime } from '../runtime/browser-runtime.mjs';

test('browser WASI compiler output restores and calls through the browser runtime wrapper', async () => {
  const compilerBytes = await readFile('dist-web/compiler.wasm');
  const runtimeBytes = await readFile('wasm-build/build/microvium-runtime.wasm');
  const compiler = new BrowserCompiler(compilerBytes);
  const snapshot = await compiler.compile(`
    const host = vmImport(1);
    vmExport(1, function (n) { return n + host(n); });
  `);
  const hostCalls = [];
  const runtime = await createBrowserRuntime(runtimeBytes, {
    1(value) {
      hostCalls.push(value);
      return value * 3;
    }
  });
  try {
    runtime.restore(snapshot);
    assert.equal(runtime.call(1, 7), 28);
    assert.deepEqual(hostCalls, [7]);
  } finally {
    runtime.dispose();
  }
});
