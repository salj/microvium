import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entryPoint = process.argv[2] || 'web/compiler/wasm-entry.ts';
const outputFile = process.argv[3] || 'dist-web/compiler-entry.js';
const defaultFloatWidth = process.env.MVM_DEFAULT_FLOAT_WIDTH || '64';

if (defaultFloatWidth !== '32' && defaultFloatWidth !== '64') {
  throw new Error('MVM_DEFAULT_FLOAT_WIDTH must be 32 or 64');
}

const nodeShims = {
  name: 'compiler-node-shims',
  setup(build) {
    build.onResolve({ filter: /^(?:node:)?(?:fs|fs-extra|path|os)(?:\/.*)?$/ }, args => ({
      errors: [{ text: `Compiler core must not import filesystem or path module: ${args.path}` }],
    }));
    build.onResolve({ filter: /^(?:node:)?(?:events|module)$/ }, args => ({ path: args.path, namespace: 'compiler-shim' }));
    build.onLoad({ filter: /.*/, namespace: 'compiler-shim' }, args => {
      if (args.path === 'events' || args.path === 'node:events') return { contents: `
        export class EventEmitter {
          constructor() { this.listeners = new Map(); }
          setMaxListeners() { return this; }
          on(name, fn) { const list = this.listeners.get(name) || []; list.push(fn); this.listeners.set(name, list); return this; }
          once(name, fn) { const wrapped = (...args) => { this.off(name, wrapped); fn(...args); }; wrapped.original = fn; return this.on(name, wrapped); }
          off(name, fn) { this.listeners.set(name, (this.listeners.get(name) || []).filter(f => f !== fn && f.original !== fn)); return this; }
          emit(name, ...args) { for (const fn of [...(this.listeners.get(name) || [])]) fn(...args); return true; }
        }
      `, loader: 'js' };
      if (args.path === 'module' || args.path === 'node:module') return { contents: `export const builtinModules = []; export default { builtinModules };`, loader: 'js' };
      return { contents: `export const builtinModules = []; export default { builtinModules };`, loader: 'js' };
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
  define: {
    __dirname: JSON.stringify(path.join(root, 'lib')),
    __MVM_DEFAULT_FLOAT_WIDTH__: defaultFloatWidth,
  },
  banner: { js: 'globalThis.process = globalThis.process || { env: {} }; globalThis.FinalizationRegistry = globalThis.FinalizationRegistry || class { constructor() {} register() {} unregister() { return false; } };' },
  plugins: [nodeShims],
  logLevel: 'info'
});
