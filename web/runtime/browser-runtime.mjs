export async function createBrowserRuntime(moduleBytes, hostImports) {
  const memory = new WebAssembly.Memory({ initial: 4, maximum: 4 });
  const { instance } = await WebAssembly.instantiate(moduleBytes, {
    env: {
      memory,
      mvm_wasm_host_import(id, argument) {
        const handler = hostImports[id];
        if (typeof handler !== 'function') throw new Error(`Unregistered Microvium host import ${id}`);
        const result = handler(argument);
        if (typeof result !== 'number') throw new TypeError(`Host import ${id} must return a number`);
        return result;
      },
      fmod: (a, b) => a % b,
      pow: (a, b) => Math.pow(a, b)
    }
  });

  const wasm = instance.exports;
  const callResultPointer = wasm.mvm_wasm_result_pointer();
  const view = new DataView(memory.buffer);

  return {
    restore(snapshot) {
      if (!(snapshot instanceof Uint8Array)) throw new TypeError('Snapshot must be a Uint8Array');
      const capacity = wasm.mvm_wasm_snapshot_capacity();
      if (snapshot.byteLength > capacity) throw new RangeError(`Snapshot exceeds runtime capacity (${capacity} bytes)`);
      const pointer = wasm.mvm_wasm_snapshot_buffer();
      new Uint8Array(memory.buffer, pointer, snapshot.byteLength).set(snapshot);
      const error = wasm.mvm_wasm_restore(snapshot.byteLength);
      if (error !== 0) throw new Error(`Microvium restore failed with error code ${error}`);
    },
    call(exportID, argument) {
      if (typeof argument !== 'number') throw new TypeError('Runtime argument must be a number');
      const error = wasm.mvm_wasm_call_export(exportID, argument);
      if (error !== 0) throw new Error(`Microvium call failed with error code ${error}`);
      return view.getFloat64(callResultPointer, true);
    },
    dispose() {
      wasm.mvm_wasm_free();
    }
  };
}
