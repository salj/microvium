import { assert } from 'chai';
import { restore } from '../../lib';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

const source = `
  /** @mvm-ffi (Value, Value) -> Value */
  import { add as plus } from 'math';
  /** @mvm-ffi */
  export function run(x) { return plus(x, 2); }
`;

suite('native named FFI', () => {
  function makeSnapshot() {
    const vm = VirtualMachineFriendly.create({}, { noLib: true });
    vm.evaluateModule({ sourceText: source });
    return vm.createSnapshot();
  }

  test('resolves an annotated import and named export through the native VM', () => {
    const snapshot = makeSnapshot();
    const native = restore(snapshot, {}, {
      namedImports: { math: { add: (a: number, b: number) => a + b } }
    });
    assert.equal(native.resolveNamedExport('run')(5), 7);
  });

  test('fails restore when a named import is unbound', () => {
    assert.throws(() => restore(makeSnapshot(), {}), /MVM_E_FFI_ABI_ERROR/);
  });

  test('fails restore when a host implementation has the wrong arity', () => {
    assert.throws(() => restore(makeSnapshot(), {}, {
      namedImports: { math: { add: (a: number) => a } }
    }), /MVM_E_FFI_ABI_ERROR/);
  });

  test('checks named export arity in the native facade', () => {
    const snapshot = makeSnapshot();
    const native = restore(snapshot, {}, {
      namedImports: { math: { add: (a: number, b: number) => a + b } }
    });
    assert.throws(() => native.resolveNamedExport('run')(), /arity mismatch.*expected 1, received 0/);
  });

  test('checks named import arity at the native call boundary', () => {
    const vm = VirtualMachineFriendly.create({}, {
      noLib: true,
      namedImports: { math: { add: (a: number, b: number) => a + b } },
    });
    vm.evaluateModule({ sourceText: source.replace('plus(x, 2)', 'plus(x)') });
    const native = restore(vm.createSnapshot(), {}, {
      namedImports: { math: { add: (a: number, b: number) => a + b } }
    });
    assert.throws(() => native.resolveNamedExport('run')(5), /MVM_E_FFI_ABI_ERROR/);
  });
});
