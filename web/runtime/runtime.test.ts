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
        }
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

  test('imports no JavaScript math functions', () => {
    const wasm = (globalThis as any).WebAssembly;
    const moduleBytes = fs.readFileSync(path.resolve('wasm-build/build/microvium-runtime.wasm'));
    const module = new wasm.Module(moduleBytes);
    const imports = wasm.Module.imports(module).map((entry: any) => `${entry.module}.${entry.name}`);
    assert.deepEqual(imports.sort(), ['env.memory', 'env.mvm_wasm_host_import']);
  });

  test('v8.1 snapshots follow the compile-time legacy support switch', () => {
    const wasm = (globalThis as any).WebAssembly;
    const moduleBytes = fs.readFileSync(path.resolve('wasm-build/build/microvium-runtime.wasm'));
    const module = new wasm.Module(moduleBytes);
    const memory = new wasm.Memory({ initial: 4, maximum: 4 });
    const instance = new wasm.Instance(module, {
      env: { memory, mvm_wasm_host_import: () => 0 }
    });
    const fixture = fs.readFileSync(path.resolve('test/fixtures/v8.1-addition.snapshot'));
    const exports = instance.exports as Record<string, (...args: number[]) => number>;
    new Uint8Array(memory.buffer, exports.mvm_wasm_snapshot_buffer(), fixture.byteLength).set(fixture);
    const error = exports.mvm_wasm_restore(fixture.byteLength);
    assert.equal(error, process.env.MVM_SUPPORT_LEGACY_BYTECODE === '1' ? 0 : 49);
    exports.mvm_wasm_free();
  });

  test('uses in-module math for remainder and exponentiation edge cases', async () => {
    const snapshot = compileSource(`
      vmExport(1, function (n) { return n % 2; });
      vmExport(2, function (n) { return n ** 2; });
      vmExport(3, function (n) { return n ** 0.5; });
    `);
    const wasm = (globalThis as any).WebAssembly;
    const moduleBytes = fs.readFileSync(path.resolve('wasm-build/build/microvium-runtime.wasm'));
    const memory = new wasm.Memory({ initial: 4, maximum: 4 });
    const { instance } = await wasm.instantiate(moduleBytes, {
      env: { memory, mvm_wasm_host_import: () => 0 }
    });
    const exports = instance.exports as Record<string, (...args: number[]) => number>;
    new Uint8Array(memory.buffer, exports.mvm_wasm_snapshot_buffer(), snapshot.byteLength).set(snapshot);
    assert.equal(exports.mvm_wasm_restore(snapshot.byteLength), 0);
    const resultPointer = exports.mvm_wasm_result_pointer();

    assert.equal(exports.mvm_wasm_call_export(1, -5.5), 0);
    assert.equal(new DataView(memory.buffer).getFloat64(resultPointer, true), -1.5);
    assert.equal(exports.mvm_wasm_call_export(2, -3), 0);
    assert.equal(new DataView(memory.buffer).getFloat64(resultPointer, true), 9);
    assert.equal(exports.mvm_wasm_call_export(3, -1), 0);
    assert.isNaN(new DataView(memory.buffer).getFloat64(resultPointer, true));
    exports.mvm_wasm_free();
  });
});
