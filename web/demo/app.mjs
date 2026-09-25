import { BrowserCompiler } from '../compiler/browser-compiler.mjs';
import { createBrowserRuntime } from '../runtime/browser-runtime.mjs';

const sourceField = document.querySelector('#source');
const runButton = document.querySelector('#run');
const status = document.querySelector('#status');
const resultArea = document.querySelector('#result');

async function initialize() {
  const [compilerBytes, runtimeBytes] = await Promise.all([
    fetch('./compiler.wasm').then(readWasm),
    fetch('./microvium-runtime.wasm').then(readWasm)
  ]);
  const compiler = new BrowserCompiler(compilerBytes);

  runButton.addEventListener('click', async () => {
    runButton.disabled = true;
    status.dataset.kind = '';
    status.textContent = 'Compiling…';
    try {
      const snapshot = await compiler.compile(sourceField.value);
      const hostCalls = [];
      const runtime = await createBrowserRuntime(runtimeBytes, {
        1(value) {
          hostCalls.push(`host import 1 received ${value}`);
          return value * 3;
        }
      });
      try {
        runtime.restore(snapshot);
        const result = runtime.call(1, 7);
        resultArea.textContent = [
          `Snapshot: ${snapshot.byteLength} bytes`,
          ...hostCalls,
          `Export 1 returned ${result}`
        ].join('\n');
        status.textContent = 'Compile and run succeeded';
      } finally {
        runtime.dispose();
      }
    } catch (error) {
      status.dataset.kind = 'error';
      status.textContent = error instanceof Error ? error.message : String(error);
    } finally {
      runButton.disabled = false;
    }
  });
}

initialize().catch(error => {
  status.dataset.kind = 'error';
  status.textContent = error instanceof Error ? error.message : String(error);
});

async function readWasm(response) {
  if (!response.ok) throw new Error(`Could not load ${response.url}: ${response.status}`);
  return response.arrayBuffer();
}
