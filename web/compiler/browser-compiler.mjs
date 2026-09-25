import { File, OpenFile, WASI } from '@bjorn3/browser_wasi_shim';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class BrowserCompiler {
  constructor(moduleBytes) {
    this.moduleBytes = moduleBytes;
  }

  async compile(sourceText) {
    const stdin = new File(encoder.encode(sourceText), { readonly: true });
    const stdout = new File(new Uint8Array(0));
    const stderr = new File(new Uint8Array(0));
    const wasi = new WASI(['microvium-compiler'], [], [
      new OpenFile(stdin),
      new OpenFile(stdout),
      new OpenFile(stderr)
    ]);

    const { instance } = await WebAssembly.instantiate(this.moduleBytes, {
      wasi_snapshot_preview1: wasi.wasiImport
    });

    let exitCode;
    try {
      exitCode = wasi.start(instance);
    } catch (error) {
      const diagnostic = decoder.decode(stderr.data).trim();
      throw new Error(diagnostic || String(error));
    }
    if (exitCode !== 0) {
      throw new Error(decoder.decode(stderr.data).trim() || `Compiler exited with status ${exitCode}`);
    }
    return stdout.data.slice();
  }
}
