import { addDefaultGlobals, defaultHostEnvironment, HostImportTable } from "../../lib";
import { NativeVM, Value } from "../../lib/native-vm";
import { unexpected } from "../../lib/utils";
import { assert } from 'chai';
import { mvm_TeType } from "../../lib/runtime-types";
import { VirtualMachineFriendly } from "../../lib/virtual-machine-friendly";
import { NativeVMFriendly } from "../../lib/native-vm-friendly";
import { compileJs } from "../common";

suite('native-api', function () {
  test('mvm_typeOf', () => {
    const snapshot = compileJs`
      const values = [
        undefined,
        null,
        true,
        false,
        42,
        -42,
        0xffffffff,
        1.5,
        '',
        'hello',
        'length',
        '__proto__',
        { prop: 42 },
        [1, 2, 3],
        () => 'hey',
      ]
      for (let i = 0; i < values.length; i++) {
        let index = i;
        vmExport(index, () => values[index])
      }
    `

    const expectedTypes = [
      mvm_TeType.VM_T_UNDEFINED, // undefined,
      mvm_TeType.VM_T_NULL,      // null,
      mvm_TeType.VM_T_BOOLEAN,   // true,
      mvm_TeType.VM_T_BOOLEAN,   // false,
      mvm_TeType.VM_T_NUMBER,    // 42,
      mvm_TeType.VM_T_NUMBER,    // -42,
      mvm_TeType.VM_T_NUMBER,    // 0xffffffff,
      mvm_TeType.VM_T_NUMBER,    // 1.5,
      mvm_TeType.VM_T_STRING,    // '',
      mvm_TeType.VM_T_STRING,    // 'hello',
      mvm_TeType.VM_T_STRING,    // 'length',
      mvm_TeType.VM_T_STRING,    // '__proto__',
      mvm_TeType.VM_T_OBJECT,    // { prop: 42 },
      mvm_TeType.VM_T_ARRAY,     // [1, 2, 3],
      mvm_TeType.VM_T_FUNCTION,  // () => 'hey',
    ]

    const vm = new NativeVM(snapshot.data, () => unexpected());

    for (const [i, expectedTypeCode] of expectedTypes.entries()) {
      const f = vm.resolveExport(i);
      const value = vm.call(f, []);
      const typeCode = vm.typeOf(value);
      assert.equal(typeCode, expectedTypeCode);
    }
  })

  test('object manipulation', () => {
    const snapshot = compileJs`
      const newObject = () => ({});
      const getProp = (o, p) => o[p];
      const setProp = (o, p, v) => o[p] = v;
      const readX = o => o.x;

      vmExport(1, newObject);
      vmExport(2, getProp);
      vmExport(3, setProp);
      vmExport(4, Reflect.ownKeys);
      vmExport(5, readX);
    `

    const vm = new NativeVM(snapshot.data, () => unexpected());

    const newObject_ = vm.resolveExport(1);
    const getProp_ = vm.resolveExport(2);
    const setProp_ = vm.resolveExport(3);
    const objectKeys_ = vm.resolveExport(4);
    const readX_ = vm.resolveExport(5);
    const newObject = () => vm.call(newObject_, []);
    const getProp = (o: Value, p: string) => vm.call(getProp_, [o, vm.newString(p)])
    const setProp = (o: Value, p: string, v: Value) => vm.call(setProp_, [o, vm.newString(p), v])
    const objectKeys = (o: Value) => vm.call(objectKeys_, [o])
    const getIndex = (arr: Value, i: number) => vm.call(getProp_, [arr, vm.newNumber(i)])
    const readX = (obj: Value) => vm.call(readX_, [obj])


    // Note: the node bindings for Value
    // ([Value.cc](../../native-vm-bindings/Value.cc)) wraps a Microvium GC
    // handle. If you were doing this in C, you would need to create and release
    // the handles yourself.

    // myObject1 = { x: 5, y: 6 }
    const myObject1 = newObject();
    setProp(myObject1, 'x', vm.newNumber(5));
    setProp(myObject1, 'y', vm.newNumber(6));

    // myObject2 = { x: 'hello', y: myObject1 }
    const myObject2 = newObject();
    setProp(myObject2, 'x', vm.newString('hello'));
    setProp(myObject2, 'y', myObject1);

    // object1Keys = Reflect.ownKeys(myObject1)
    const object1Keys = objectKeys(myObject1);

    // assert.equal(myObject1.x, 5)
    assert.equal(getProp(myObject1, 'x').toNumber(), 5)
    // assert.equal(myObject1.y, 6)
    assert.equal(getProp(myObject1, 'y').toNumber(), 6)
    // assert.equal(myObject2.x, 'hello')
    assert.equal(getProp(myObject2, 'x').toString(), 'hello')
    // assert.equal(myObject2.y.x, 5)
    assert.equal(getProp(getProp(myObject2, 'y'), 'x').toNumber(), 5)
    // assert.equal(object1Keys.length, 2)
    assert.equal(getProp(object1Keys, 'length').toNumber(), 2)
    // assert.equal(object1Keys.length, 2)
    assert.equal(getIndex(object1Keys, 0).toString(), 'x')
    assert.equal(getIndex(object1Keys, 1).toString(), 'y')

    // The readX function reads the x property using a literal key in the script
    // itself, which may have different interning characteristics to reading
    // using an externally-provided key (although it shouldn't).
    assert.equal(readX(myObject1).toNumber(), 5);
  })

  test('array manipulation', () => {
    const snapshot = compileJs`
      const newArray = () => [];
      const getItem = (a, i) => a[i];
      const setItem = (a, i, v) => a[i] = v;
      const arrayLength = (a) => a.length;

      vmExport(1, newArray);
      vmExport(2, getItem);
      vmExport(3, setItem);
      vmExport(4, arrayLength);
    `

    const vm = new NativeVM(snapshot.data, () => unexpected());

    const newArray_ = vm.resolveExport(1);
    const getProp_ = vm.resolveExport(2);
    const setProp_ = vm.resolveExport(3);
    const arrayLength_ = vm.resolveExport(4);
    const newArray = () => vm.call(newArray_, []);
    const getItem = (a: Value, i: number) => vm.call(getProp_, [a, vm.newNumber(i)])
    const setItem = (a: Value, i: number, v: Value) => vm.call(setProp_, [a, vm.newNumber(i), v])
    const arrayLength = (a: Value): number => vm.call(arrayLength_, [a]).toNumber()

    function copyByteArrayToJS(sourceArr: number[]): Value {
      const targetArr = newArray();
      for (let i = 0; i < sourceArr.length; i++) {
        setItem(targetArr, i, vm.newNumber(sourceArr[i]));
      }
      return targetArr;
    }

    function copyByteArrayFromJS(sourceArr: Value): number[] {
      const result: number[] = [];
      const len = arrayLength(sourceArr);
      for (let i = 0; i < len; i++) {
        result[i] = getItem(sourceArr, i).toNumber();
      }
      return result;
    }

    const receivedData = [1,2,3]
    const jsReceivedData = copyByteArrayToJS(receivedData);
    // Loop back, just for example
    const sendData = copyByteArrayFromJS(jsReceivedData);

    assert.deepEqual(sendData, receivedData);
  })

  test('uint8array', () => {
    const snapshot = compileJs`
      vmExport(1, incrementBuffer)

      function incrementBuffer(buffer) {
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = (buffer[i] + 1) & 0xFF;
        }
        return buffer;
      }
    `

    const vm = new NativeVM(snapshot.data, () => unexpected());

    const incrementBuffer_ = vm.resolveExport(1);
    const incrementBuffer = (a: Buffer): Buffer => vm.call(incrementBuffer_, [vm.uint8ArrayFromBytes(a)]).uint8ArrayToBytes()

    const myData = Buffer.from([1, 2, 254, 255]);
    const incremented = incrementBuffer(myData);

    // The data is passed by value (copy), so the original shouldn't change
    assert.deepEqual(myData, Buffer.from([1, 2, 254, 255]));
    assert.deepEqual(incremented, Buffer.from([2, 3, 255, 0]));

    const largeData = Buffer.alloc(8191);
    largeData[0] = 1;
    largeData[4095] = 2;
    largeData[4096] = 254;
    largeData[8190] = 255;
    const largeResult = incrementBuffer(largeData);
    assert.equal(largeResult.length, 8191);
    assert.equal(largeResult[0], 2);
    assert.equal(largeResult[4095], 3);
    assert.equal(largeResult[4096], 255);
    assert.equal(largeResult[8190], 0);

    const emptyResult = incrementBuffer(Buffer.alloc(0));
    assert.equal(emptyResult.length, 0);
  })

  test('zero-length uint8arrays retain their forwarding slot across GC', () => {
    const snapshot = compileJs`
      vmExport(1, () => Microvium.newUint8Array(0));
    `;
    const vm = new NativeVM(snapshot.data, () => unexpected());

    const emptyFromVM = vm.call(vm.resolveExport(1), []);
    vm.runGC(false);
    assert.equal(emptyFromVM.uint8ArrayToBytes().length, 0);

    const emptyFromHost = vm.uint8ArrayFromBytes(Buffer.alloc(0));
    vm.runGC(false);
    assert.equal(emptyFromHost.uint8ArrayToBytes().length, 0);
  })

  test('invoke-gc-from-closure', () => {
    const snapshot = compileJs`
      const runGC = vmImport(1);

      vmExport(1, runTest);

      function runTest() {
        // Create some garbage to be collected
        [];

        // Create a closure. The scope for this closure will be allocated after
        // the above garbage, which means it will move during a GC cycle as the
        // heap is compacted.
        const closure = createClosure();

        // Run the closure, which calls the host to trigger a GC cycle. Since
        // the GC is triggered while the closure is active, the 'closure'
        // register will point to the closure, which moves. This tests that
        // nothing breaks if the current closure moves during a GC cycle during
        // a call to the host.
        closure();
      }

      function createClosure(x) {
        return () => {
          x; // Force this func to be a closure
          runGC();
        };
      }
    `;

    const vm: NativeVMFriendly = new NativeVMFriendly(snapshot, {
      1: () => vm.garbageCollect()
    });

    vm.resolveExport(1)();
  })

  test('mvm_stopAfterNInstructions', () => {
    const snapshot = compileJs`
      vmExport(1, () => { for (let i = 0; i < 50; i++) {} })
    `

    const vm = new NativeVM(snapshot.data, () => unexpected());

    const f = vm.resolveExport(1);

    vm.stopAfterNInstructions(1000);
    assert.equal(vm.getInstructionCountRemaining(), 1000);

    vm.call(f, []);
    assert.equal(vm.getInstructionCountRemaining(), 390);

    let err: any;
    // Calling `f` again will trigger the error
    try { vm.call(f, []); } catch (e) { err = e; }
    assert.equal(err.message, "The instruction count set by `mvm_stopAfterNInstructions` has been reached");

    assert.equal(vm.getInstructionCountRemaining(), 0);

    err = undefined;
    // the counter doesn't reset
    try { vm.call(f, []); } catch (e) { err = e; }
    assert.equal(err.message, "The instruction count set by `mvm_stopAfterNInstructions` has been reached");
  })

  test('resumable call yields and resumes without replaying work', () => {
    const snapshot = compileJs`
      let calls = 0;
      vmExport(1, () => {
        calls++;
        let sum = 0;
        for (let i = 0; i < 100; i++) sum += i;
        return sum;
      });
      vmExport(2, () => calls);
    `

    const vm = new NativeVM(snapshot.data, () => unexpected());
    const f = vm.resolveExport(1);
    let run = vm.callResumable(f, [], 1);
    assert.equal(run.status, 'yielded');
    assert.throws(() => vm.call(f, []), /suspended resumable call/);
    assert.throws(() => vm.resume(-2), /Instruction budget/);

    let slices = 0;
    while (run.status === 'yielded') {
      run = vm.resume(7);
      assert.isBelow(++slices, 1000);
    }
    assert.equal(run.status, 'complete');
    if (run.status !== 'complete') throw new Error('expected completed run');
    assert.equal(run.value.toNumber(), 4950);
    assert.equal(vm.call(vm.resolveExport(2), []).toNumber(), 1);
  })

  test('zero budget defers dispatch and cancel releases the continuation', () => {
    const snapshot = compileJs`
      let calls = 0;
      const host = vmImport(1);
      vmExport(1, () => { calls++; host(); return calls; });
      vmExport(2, () => calls);
    `

    let hostCalls = 0;
    let vm: NativeVM;
    vm = new NativeVM(snapshot.data, () => () => {
      hostCalls++;
      return vm.undefined;
    });
    const f = vm.resolveExport(1);
    const run = vm.callResumable(f, [], 0);
    assert.equal(run.status, 'yielded');
    assert.equal(hostCalls, 0);

    vm.cancel();
    assert.throws(() => vm.resume(10), /no suspended resumable call/);
    assert.equal(vm.call(vm.resolveExport(2), []).toNumber(), 0);
    assert.equal(vm.call(f, []).toNumber(), 1);
    assert.equal(hostCalls, 1);
  })

  test('zero-budget class calls defer construction until resume', () => {
    const snapshot = compileJs`
      let constructions = 0;
      class C {
        constructor() {
          constructions++;
          for (let i = 0; i < 20; i++) {}
        }
      }
      vmExport(1, C);
      vmExport(2, () => constructions);
    `
    const vm = new NativeVM(snapshot.data, () => unexpected());
    const run = vm.callResumable(vm.resolveExport(1), [], 0);
    assert.equal(run.status, 'yielded');

    let resumed = vm.resume(1);
    let slices = 0;
    while (resumed.status === 'yielded') {
      resumed = vm.resume(4);
      assert.isBelow(++slices, 1000);
    }
    assert.equal(vm.call(vm.resolveExport(2), []).toNumber(), 1);
    if (resumed.status !== 'complete') throw new Error('expected completed run');
    assert.equal(resumed.value.type, mvm_TeType.VM_T_OBJECT);
  })

  test('resumable state survives collection and is discarded on exception', () => {
    const snapshot = compileJs`
      vmExport(1, value => {
        for (let i = 0; i < 30; i++) {}
        throw value;
      });
      vmExport(2, () => 42);
    `

    const vm = new NativeVM(snapshot.data, () => unexpected());
    const f = vm.resolveExport(1);
    const argument = vm.newString('expected exception');
    let run = vm.callResumable(f, [argument], 1);
    assert.equal(run.status, 'yielded');
    vm.runGC(false);

    let caught: any;
    let slices = 0;
    while (run.status === 'yielded') {
      try {
        run = vm.resume(5);
      } catch (e) {
        caught = e;
        break;
      }
      assert.isBelow(++slices, 1000);
    }
    assert.equal(caught.message, 'expected exception');
    assert.equal(vm.call(vm.resolveExport(2), []).toNumber(), 42);
  })

  test('legacy instruction limit aborts and discards a yielded continuation', () => {
    const snapshot = compileJs`
      vmExport(1, () => {
        let sum = 0;
        for (let i = 0; i < 100; i++) sum += i;
        return sum;
      });
    `
    const vm = new NativeVM(snapshot.data, () => unexpected());
    const f = vm.resolveExport(1);
    vm.stopAfterNInstructions(2);
    assert.throws(
      () => vm.callResumable(f, [], 2),
      /instruction count set by `mvm_stopAfterNInstructions` has been reached/
    );
    vm.stopAfterNInstructions(-1);
    assert.throws(() => vm.resume(10), /no suspended resumable call/);
    assert.equal(vm.call(f, []).toNumber(), 4950);
  })

  test('same-VM bytecode reentry is rejected during a resumable host call', () => {
    const snapshot = compileJs`
      const host = vmImport(1);
      let nestedCalls = 0;
      vmExport(1, () => { host(); return 123; });
      vmExport(2, () => { nestedCalls++; return 456; });
      vmExport(3, () => nestedCalls);
    `

    let vm: NativeVM;
    let nestedTarget: Value;
    let nestedError = '';
    vm = new NativeVM(snapshot.data, () => () => {
      try {
        vm.call(nestedTarget, []);
      } catch (e: any) {
        nestedError = e.message;
      }
      return vm.undefined;
    });
    nestedTarget = vm.resolveExport(2);

    const run = vm.callResumable(vm.resolveExport(1), [], -1);
    assert.equal(run.status, 'complete');
    assert.include(nestedError, 'already executing a call');
    assert.equal(vm.call(vm.resolveExport(3), []).toNumber(), 0);
  })

  test('legacy same-VM bytecode reentry remains supported', () => {
    const snapshot = compileJs`
      const host = vmImport(1);
      let nestedCalls = 0;
      vmExport(1, () => host());
      vmExport(2, () => { nestedCalls++; return 456; });
      vmExport(3, () => nestedCalls);
    `

    let vm: NativeVM;
    let nestedTarget: Value;
    vm = new NativeVM(snapshot.data, () => () => {
      assert.equal(vm.call(nestedTarget, []).toNumber(), 456);
      return vm.undefined;
    });
    nestedTarget = vm.resolveExport(2);

    vm.call(vm.resolveExport(1), []);
    assert.equal(vm.call(vm.resolveExport(3), []).toNumber(), 1);
  })

  test('resumable execution cannot start reentrantly inside a legacy call', () => {
    const snapshot = compileJs`
      const host = vmImport(1);
      vmExport(1, () => host());
    `
    let vm: NativeVM;
    let target: Value;
    let errorMessage = '';
    vm = new NativeVM(snapshot.data, () => () => {
      try {
        vm.callResumable(target, [], 0);
      } catch (e: any) {
        errorMessage = e.message;
      }
      return vm.undefined;
    });
    target = vm.resolveExport(1);
    vm.call(target, []);
    assert.include(errorMessage, 'already executing a call');
  })

  test('snapshot creation is rejected while resumable execution is suspended', () => {
    const snapshot = compileJs`
      vmExport(1, () => { for (let i = 0; i < 20; i++) {} });
    `
    const vm = new NativeVM(snapshot.data, () => unexpected());
    const run = vm.callResumable(vm.resolveExport(1), [], 1);
    assert.equal(run.status, 'yielded');
    assert.throws(() => vm.createSnapshot(), /Snapshot creation failed/);
    vm.cancel();
    assert.doesNotThrow(() => vm.createSnapshot());
  })

  test('NativeVMFriendly exposes host-value resumable calls', () => {
    const snapshot = compileJs`
      vmExport(1, x => { for (let i = 0; i < 10; i++) x += i; return x; });
    `
    const vm = new NativeVMFriendly(snapshot);
    const f = vm.resolveExport(1);
    let run = vm.callResumable(f, [5], 1);
    assert.equal(run.status, 'yielded');
    let slices = 0;
    while (run.status === 'yielded') {
      run = vm.resume(4);
      assert.isBelow(++slices, 100);
    }
    assert.equal(run.status, 'complete');
    if (run.status !== 'complete') throw new Error('expected completed run');
    assert.equal(run.value, 50);
  })

  test('resumable calls drain async continuation jobs across slices', () => {
    const snapshot = compileJs`
      const print = vmImport(1);
      async function child() { return 42; }
      async function parent() {
        const value = await child();
        print('parent:' + value);
        return value;
      }
      vmExport(1, async () => {
        print('start');
        const value = await parent();
        print('done:' + value);
        return value;
      });
    `
    const legacyOutput: string[] = [];
    const legacyVm = new NativeVMFriendly(snapshot, { 1: (value: any) => legacyOutput.push(value) });
    legacyVm.resolveExport(1)();
    assert.deepEqual(legacyOutput, ['start', 'parent:42', 'done:42']);

    const output: string[] = [];
    const vm = new NativeVMFriendly(snapshot, { 1: (value: any) => output.push(value) });
    let run = vm.callResumable(vm.resolveExport(1), [], 1);
    let slices = 0;
    let yieldedAfterParent = false;
    while (run.status === 'yielded') {
      run = vm.resume(1);
      vm.garbageCollect();
      if (output.includes('parent:42') && run.status === 'yielded') yieldedAfterParent = true;
      assert.isBelow(++slices, 1000);
    }
    assert.deepEqual(output, ['start', 'parent:42', 'done:42']);
    assert.isTrue(yieldedAfterParent);
    if (run.status !== 'complete') throw new Error('expected completed run');
    assert.equal(typeof run.value, 'object'); // The original result is the promise, not a continuation's return value.

    const cancelOutput: string[] = [];
    const cancelVm = new NativeVMFriendly(snapshot, { 1: (value: any) => cancelOutput.push(value) });
    let cancelRun = cancelVm.callResumable(cancelVm.resolveExport(1), [], 1);
    let cancelledAfterParent = false;
    while (cancelRun.status === 'yielded') {
      cancelRun = cancelVm.resume(1);
      if (cancelOutput.includes('parent:42') && cancelRun.status === 'yielded') {
        cancelledAfterParent = true;
        break;
      }
    }
    assert.isTrue(cancelledAfterParent);
    cancelVm.cancel();
    assert.notInclude(cancelOutput, 'done:42');
  })
})
