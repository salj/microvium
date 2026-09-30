import { assert } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { compileSource } from '../compiler/entry';

suite('runtime WebAssembly', () => {
  test('restores a snapshot, resolves export 1, and dispatches host import 1', async () => {
    const snapshot = compileSource(`
      const host = vmImport(1);
      vmExport(1, function (n) { return n + host(n); });
    `);
    const wasm = (globalThis as any).WebAssembly;
    const moduleBytes = fs.readFileSync(path.resolve('wasm-build/build/microvium-runtime.wasm'));
    const memory = new wasm.Memory({ initial: 4, maximum: 4 });
    const hostCalls: Array<{ id: number; arg: number }> = [];
    const { instance } = await wasm.instantiate(moduleBytes, {
      env: {
        memory,
        mvm_wasm_host_import(id: number, arg: number) {
          hostCalls.push({ id, arg });
          return arg * 3;
        },
        fmod: (a: number, b: number) => a % b,
        pow: (a: number, b: number) => Math.pow(a, b),
        fmodf: (a: number, b: number) => a % b,
        powf: (a: number, b: number) => Math.pow(a, b),
        ldexp: (value: number, exponent: number) => value * Math.pow(2, exponent)
      }
    });
    const exports = instance.exports as Record<string, (...args: number[]) => number>;
    const bufferPointer = exports.mvm_wasm_snapshot_buffer();
    const capacity = exports.mvm_wasm_snapshot_capacity();
    assert.isAtMost(snapshot.byteLength, capacity);
    new Uint8Array(memory.buffer, bufferPointer, snapshot.byteLength).set(snapshot);

    assert.equal(exports.mvm_wasm_restore(snapshot.byteLength), 0);
    assert.equal(exports.mvm_wasm_call_export(1, 7), 0);
    const resultPointer = exports.mvm_wasm_result_pointer();
    const result = new DataView(memory.buffer).getFloat64(resultPointer, true);
    assert.equal(result, 28);
    assert.deepEqual(hostCalls, [{ id: 1, arg: 7 }]);
    exports.mvm_wasm_free();
  });
});
