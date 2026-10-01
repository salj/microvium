const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class BrowserCompiler {
  constructor(moduleBytes) {
    this.moduleBytes = moduleBytes;
    this.instancePromise = undefined;
  }

  async compile(sourceText) {
    const instance = await this.getInstance();
    const { exports } = instance;
    const source = encoder.encode(sourceText);
    const sourcePointer = exports.mvm_alloc(source.byteLength);
    if (!sourcePointer && source.byteLength) throw new Error('Compiler could not allocate source buffer');

    try {
      new Uint8Array(exports.memory.buffer, sourcePointer, source.byteLength).set(source);
      const status = exports.mvm_compile(sourcePointer, source.byteLength);
      if (status !== 0) throw this.readError(exports);

      const resultSize = exports.mvm_result_size();
      const resultPointer = exports.mvm_result_pointer();
      if (!resultPointer && resultSize) throw new Error('Compiler returned an invalid snapshot buffer');
      return new Uint8Array(exports.memory.buffer, resultPointer, resultSize).slice();
    } finally {
      exports.mvm_free(sourcePointer);
    }
  }

  async getInstance() {
    if (!this.instancePromise) {
      this.instancePromise = WebAssembly.instantiate(this.moduleBytes, {}).then(({ instance }) => {
        const status = instance.exports.mvm_init();
        if (status !== 0) throw this.readError(instance.exports, `Compiler initialization failed with status ${status}`);
        return instance;
      });
    }
    return this.instancePromise;
  }

  readError(exports, fallback = 'Compiler failed without a diagnostic') {
    const size = exports.mvm_error_size();
    const pointer = exports.mvm_error_pointer();
    const message = decoder.decode(new Uint8Array(exports.memory.buffer, pointer, size)).trim();
    return new Error(message || fallback);
  }
}
