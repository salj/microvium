import { compileSource } from './entry';

(globalThis as any).__mvmCompileSource = compileSource;
