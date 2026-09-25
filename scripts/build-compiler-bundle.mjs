import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeLibrary = await readFile(path.join(root, 'lib/runtime-library.mvm.js'), 'utf8');
const entryPoint = process.argv[2] || 'web/compiler/entry.ts';
const outputFile = process.argv[3] || 'dist-web/compiler-bundle.js';

const nodeShims = {
  name: 'compiler-node-shims',
  setup(build) {
    build.onResolve({ filter: /^(fs|fs-extra|path|os|events|module)$/ }, args => ({ path: args.path, namespace: 'compiler-shim' }));
    build.onLoad({ filter: /.*/, namespace: 'compiler-shim' }, args => {
      if (args.path === 'fs' || args.path === 'fs-extra') {
        return { contents: `
          const runtimeLibrary = ${JSON.stringify(runtimeLibrary)};
          export function readFileSync(filename, encoding) {
            if (String(filename).endsWith('runtime-library.mvm.js')) return encoding ? runtimeLibrary : Buffer.from(runtimeLibrary);
            throw new Error('Compiler filesystem read is unsupported: ' + filename);
          }
          export function writeFileSync(filename) { throw new Error('Compiler filesystem write is unsupported: ' + filename); }
          export function appendFileSync(filename) { throw new Error('Compiler filesystem append is unsupported: ' + filename); }
          export const promises = { readFile: async filename => { throw new Error('Compiler filesystem read is unsupported: ' + filename); } };
          export default { readFileSync, writeFileSync, appendFileSync, promises };
        `, loader: 'js' };
      }
      if (args.path === 'os') return { contents: `export const EOL = '\\n'; export default { EOL };`, loader: 'js' };
      if (args.path === 'events') return { contents: `
        export class EventEmitter {
          constructor() { this.listeners = new Map(); }
          setMaxListeners() { return this; }
          on(name, fn) { const list = this.listeners.get(name) || []; list.push(fn); this.listeners.set(name, list); return this; }
          once(name, fn) { const wrapped = (...args) => { this.off(name, wrapped); fn(...args); }; wrapped.original = fn; return this.on(name, wrapped); }
          off(name, fn) { this.listeners.set(name, (this.listeners.get(name) || []).filter(f => f !== fn && f.original !== fn)); return this; }
          emit(name, ...args) { for (const fn of [...(this.listeners.get(name) || [])]) fn(...args); return true; }
        }
      `, loader: 'js' };
      if (args.path === 'module') return { contents: `export const builtinModules = []; export default { builtinModules };`, loader: 'js' };
      return { contents: `
        const norm = p => { const out = []; for (const part of p.split('/')) { if (!part || part === '.') continue; if (part === '..') out.pop(); else out.push(part); } return (p.startsWith('/') ? '/' : '') + out.join('/'); };
        export const join = (...parts) => norm(parts.join('/'));
        export const resolve = (...parts) => norm('/' + parts.join('/'));
        export const dirname = p => { const s = norm(p); const i = s.lastIndexOf('/'); return i <= 0 ? '/' : s.slice(0, i); };
        export const basename = p => norm(p).split('/').pop();
        export const extname = p => { const b = basename(p); const i = b.lastIndexOf('.'); return i <= 0 ? '' : b.slice(i); };
        export default { join, resolve, dirname, basename, extname };
      `, loader: 'js' };
    });
  }
};

await build({
  entryPoints: [path.resolve(root, entryPoint)],
  outfile: path.resolve(root, outputFile),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  treeShaking: true,
  define: { __dirname: JSON.stringify(path.join(root, 'lib')) },
  banner: { js: 'globalThis.process = globalThis.process || { env: {} }; globalThis.FinalizationRegistry = globalThis.FinalizationRegistry || class { constructor() {} register() {} unregister() { return false; } };' },
  plugins: [nodeShims],
  logLevel: 'info'
});
