import { Snapshot, HostImportFunction, ExportID, HostImportMap, HostFunctionID, MicroviumNativeSubset, MemoryStats, NamedHostImportTable, defaultHostEnvironment } from "../lib";
import { notImplemented, hardAssert, invalidOperation, assertUnreachable, reserved, unexpected } from "./utils";
import * as NativeVM from "./native-vm";
import { mvm_TeType } from "./runtime-types";
import { SnapshotClass } from "./snapshot";
import { decodeFFIMetadataFromSnapshot, NamedExport } from "./ffi";

export class NativeVMFriendly implements MicroviumNativeSubset {
  private vm: NativeVM.NativeVM;
  private namedExports: NamedExport[];

  constructor (snapshot: Snapshot, hostImportMap: HostImportMap = defaultHostEnvironment, namedImportTable: NamedHostImportTable = {}) {
    let hostImportFunction: HostImportFunction;
    if (typeof hostImportMap !== 'function') {
      hostImportFunction = (hostFunctionID: HostFunctionID): Function => {
        if (!hostImportMap.hasOwnProperty(hostFunctionID)) {
          return invalidOperation('Unresolved import: ' + hostFunctionID);
        }
        return hostImportMap[hostFunctionID];
      };
    } else {
      hostImportFunction = hostImportMap;
    }

    this.namedExports = decodeFFIMetadataFromSnapshot(snapshot.data).exports;
    this.vm = new NativeVM.NativeVM(snapshot.data, hostFunctionID => {
      const inner = hostImportFunction(hostFunctionID);
      return this.hostFunctionToVM(inner);
    }, (moduleName, importName, expectedArgumentCount: number) => {
      const module = namedImportTable[moduleName];
      const implementation = module && Object.prototype.hasOwnProperty.call(module, importName)
        ? module[importName]
        : undefined;
      if (typeof implementation !== 'function') return undefined as any;
      if (implementation.length !== expectedArgumentCount) {
        return invalidOperation(`MVM_E_FFI_ABI_ERROR: Named import ${moduleName}:${importName} expects ${expectedArgumentCount} parameters, host function declares ${implementation.length}`);
      }
      return this.hostFunctionToVM(implementation);
    });
  }

  getMemoryStats(): MemoryStats {
    return this.vm.getMemoryStats();
  }

  resolveExport(exportID: ExportID): any {
    return vmValueToHost(this.vm, this.vm.resolveExport(exportID));
  }

  resolveNamedExport(exportName: string): any {
    const descriptor = this.namedExports.find(item => item.exportName === exportName);
    if (!descriptor) return invalidOperation(`Named export not found: ${exportName}`);
    const implementation = this.resolveExport(descriptor.exportID);
    return (...args: any[]) => {
      const expected = descriptor.signature.parameters.length;
      if (args.length !== expected) {
        throw new TypeError(`Named FFI arity mismatch for export ${exportName}; expected ${expected}, received ${args.length}`);
      }
      return implementation(...args);
    };
  }

  resolveNamedExportValue(exportName: string): any {
    const descriptor = this.namedExports.find(item => item.exportName === exportName);
    if (!descriptor) return invalidOperation(`Named export not found: ${exportName}`);
    return this.resolveExport(descriptor.exportID);
  }

  garbageCollect(squeeze: boolean = false) {
    this.vm.runGC(squeeze);
  }

  createSnapshot(): Snapshot {
    return new SnapshotClass(this.vm.createSnapshot());
  }

  callResumable(func: Function, args: any[], instructionBudget: number): NativeVM.RunResult<any> {
    if (!ValueWrapper.isWrapped(this.vm, func)) return invalidOperation('Expected a function resolved from this VM');
    const vmFunc = ValueWrapper.unwrap(this.vm, func);
    if (vmFunc.type !== mvm_TeType.VM_T_FUNCTION && vmFunc.type !== mvm_TeType.VM_T_CLASS) {
      return invalidOperation('Target is not callable');
    }
    if (!Array.isArray(args)) throw new TypeError('Expected arguments to be an array');
    const vmArgs = args.map(arg => hostValueToVM(this.vm, arg));
    const run = this.vm.callResumable(vmFunc, vmArgs, instructionBudget);
    return run.status === 'yielded'
      ? run
      : { status: 'complete', value: vmValueToHost(this.vm, run.value) };
  }

  resume(instructionBudget: number): NativeVM.RunResult<any> {
    const run = this.vm.resume(instructionBudget);
    return run.status === 'yielded'
      ? run
      : { status: 'complete', value: vmValueToHost(this.vm, run.value) };
  }

  cancel(): void {
    this.vm.cancel();
  }

  snapshotHostValue(value: any): any {
    return snapshotHostValue(value, { nodes: 0, active: new WeakSet<object>() }, 0);
  }

  toHostValue(value: any): any {
    if (!ValueWrapper.isWrapped(this.vm, value)) return value;
    return vmValueToHostStructured(this.vm, ValueWrapper.unwrap(this.vm, value), { nodes: 0 }, [], 0);
  }

  asyncStart(): Function {
    return vmValueToHost(this.vm, this.vm.asyncStart());
  }

  private hostFunctionToVM(hostFunction: Function): NativeVM.HostFunction {
    return (args: NativeVM.Value[]): NativeVM.Value => {
      const result = hostFunction.apply(undefined, args.map(a => vmValueToHost(this.vm, a)));
      return hostValueToVM(this.vm, result);
    }
  }
}

function vmValueToHost(vm: NativeVM.NativeVM, value: NativeVM.Value): any {
  switch (value.type) {
    case mvm_TeType.VM_T_UNDEFINED: return undefined;
    case mvm_TeType.VM_T_NULL: return null;
    case mvm_TeType.VM_T_BOOLEAN: return value.toBoolean();
    case mvm_TeType.VM_T_NUMBER: return value.toNumber();
    case mvm_TeType.VM_T_STRING: return value.toString();
    case mvm_TeType.VM_T_FUNCTION: {
      return new Proxy<any>(dummyFunctionTarget, new ValueWrapper(vm, value));
    }
    case mvm_TeType.VM_T_OBJECT: {
      return new Proxy<any>(dummyObject, new ValueWrapper(vm, value));
    }
    case mvm_TeType.VM_T_ARRAY: {
      return new Proxy<any>(dummyObject, new ValueWrapper(vm, value));
    }
    case mvm_TeType.VM_T_UINT8_ARRAY: return notImplemented();
    case mvm_TeType.VM_T_CLASS: return notImplemented();
    case mvm_TeType.VM_T_SYMBOL: return reserved();
    case mvm_TeType.VM_T_BIG_INT: return notImplemented();
    case mvm_TeType.VM_T_END: return unexpected();
    default: return assertUnreachable(value.type);
  }
}

interface ValueWalkState {
  nodes: number;
}

interface HostWalkState extends ValueWalkState {
  active: WeakSet<object>;
}

const MAX_MARSHAL_DEPTH = 32;
const MAX_MARSHAL_NODES = 10_000;
const MAX_MARSHAL_STRING_BYTES = 8_191;

function hostValueToVM(vm: NativeVM.NativeVM, value: any, state: HostWalkState = { nodes: 0, active: new WeakSet<object>() }, depth: number = 0): NativeVM.Value {
  if (++state.nodes > MAX_MARSHAL_NODES || depth > MAX_MARSHAL_DEPTH) {
    throw new TypeError('Host value exceeds the Microvium marshalling limits');
  }
  switch (typeof value) {
    case 'undefined': return vm.undefined;
    case 'boolean': return vm.newBoolean(value);
    case 'number':
      if (!Number.isFinite(value)) throw new TypeError('Microvium host values require finite numbers');
      return vm.newNumber(value);
    case 'string':
      if (Buffer.byteLength(value, 'utf8') > MAX_MARSHAL_STRING_BYTES) throw new TypeError('Microvium host string exceeds the marshalling limit');
      return vm.newString(value);
    case 'function': {
      if (ValueWrapper.isWrapped(vm, value)) {
        return ValueWrapper.unwrap(vm, value);
      } else {
        throw new TypeError('Unwrapped host functions cannot be passed into the native VM');
        // return vm.ephemeralFunction(hostFunctionToVM(vm, value), nameHint || value.name);
      }
    }
    case 'object': {
      if (value === null) {
        return vm.null;
      }
      if (ValueWrapper.isWrapped(vm, value)) {
        return ValueWrapper.unwrap(vm, value);
      }
      if ((value as any)[vmValueSymbol]) throw new TypeError('Value belongs to a different NativeVM');
      if (state.active.has(value)) throw new TypeError('Cyclic host values cannot be passed into the native VM');

      state.active.add(value);
      try {
        if (Array.isArray(value)) {
          if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError('Only plain host arrays can be passed into the native VM');
          const keys = Reflect.ownKeys(value);
          for (const key of keys) {
            if (typeof key === 'symbol') throw new TypeError('Symbol properties cannot be passed into the native VM');
            if (key === 'length') continue;
            if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length) throw new TypeError('Host arrays with extra properties cannot be passed into the native VM');
            const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
            if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new TypeError('Host accessors cannot be passed into the native VM');
          }
          const array = vm.newArray();
          for (let i = 0; i < value.length; i++) {
            const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
            const item = descriptor ? descriptor.value : undefined;
            vm.arrayPush(array, hostValueToVM(vm, item, state, depth + 1));
          }
          return array;
        }

        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) throw new TypeError('Only plain host records can be passed into the native VM');
        const keys = Reflect.ownKeys(value);
        const object = vm.newObject();
        for (const key of keys) {
          if (typeof key !== 'string') throw new TypeError('Symbol properties cannot be passed into the native VM');
          if (key === '__proto__') throw new TypeError('The __proto__ property cannot be passed into the native VM');
          if (Buffer.byteLength(key, 'utf8') > MAX_MARSHAL_STRING_BYTES) throw new TypeError('Host property name exceeds the marshalling limit');
          const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
          if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new TypeError('Host accessors cannot be passed into the native VM');
          if (!descriptor.enumerable) continue;
          const propertyName = vm.newString(key);
          const propertyValue = hostValueToVM(vm, descriptor.value, state, depth + 1);
          vm.objectSet(object, propertyName, propertyValue);
        }
        return object;
      } finally {
        state.active.delete(value);
      }
    }
    default: throw new TypeError(`Unsupported host value type: ${typeof value}`);
  }
}

function snapshotHostValue(value: any, state: HostWalkState, depth: number): any {
  if (++state.nodes > MAX_MARSHAL_NODES || depth > MAX_MARSHAL_DEPTH) {
    throw new TypeError('Host value exceeds the Microvium marshalling limits');
  }
  if (value === null || value === undefined || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Microvium host values require finite numbers');
    return value;
  }
  if (typeof value === 'string') {
    if (Buffer.byteLength(value, 'utf8') > MAX_MARSHAL_STRING_BYTES) throw new TypeError('Microvium host string exceeds the marshalling limit');
    return value;
  }
  if ((typeof value === 'object' || typeof value === 'function') && value !== null && (value as any)[vmValueSymbol]) return value;
  if (value instanceof Error) {
    const name = readErrorField(value, 'name', 'Error');
    const message = readErrorField(value, 'message', '');
    if (typeof name !== 'string' || typeof message !== 'string') throw new TypeError('Host Error name and message must be strings');
    return snapshotHostValue({ name, message }, state, depth + 1);
  }
  if (typeof value !== 'object') throw new TypeError(`Unsupported host value type: ${typeof value}`);
  if (state.active.has(value)) throw new TypeError('Cyclic host values cannot be passed into the native VM');

  state.active.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError('Only plain host arrays can be passed into the native VM');
      const keys = Reflect.ownKeys(value);
      for (const key of keys) {
        if (typeof key === 'symbol') throw new TypeError('Symbol properties cannot be passed into the native VM');
        if (key === 'length') continue;
        if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length) throw new TypeError('Host arrays with extra properties cannot be passed into the native VM');
        const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
        if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new TypeError('Host accessors cannot be passed into the native VM');
      }
      const copy: any[] = [];
      for (let i = 0; i < value.length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
        copy.push(descriptor ? snapshotHostValue(descriptor.value, state, depth + 1) : undefined);
      }
      return copy;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError('Only plain host records can be passed into the native VM');
    const copy = Object.create(null);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('Symbol properties cannot be passed into the native VM');
      if (key === '__proto__') throw new TypeError('The __proto__ property cannot be passed into the native VM');
      if (Buffer.byteLength(key, 'utf8') > MAX_MARSHAL_STRING_BYTES) throw new TypeError('Host property name exceeds the marshalling limit');
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new TypeError('Host accessors cannot be passed into the native VM');
      if (!descriptor.enumerable) continue;
      Object.defineProperty(copy, key, {
        value: snapshotHostValue(descriptor.value, state, depth + 1),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return copy;
  } finally {
    state.active.delete(value);
  }
}

function readErrorField(error: Error, key: 'name' | 'message', fallback: string): any {
  let current: object | null = error;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) {
      if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new TypeError(`Host Error ${key} must be a data property`);
      }
      return descriptor.value;
    }
    current = Object.getPrototypeOf(current);
  }
  return fallback;
}

function vmValueToHostStructured(vm: NativeVM.NativeVM, value: NativeVM.Value, state: ValueWalkState, ancestors: NativeVM.Value[], depth: number): any {
  if (++state.nodes > MAX_MARSHAL_NODES || depth > MAX_MARSHAL_DEPTH) {
    throw new TypeError('Microvium result exceeds the host marshalling limits');
  }
  if (value.type !== mvm_TeType.VM_T_ARRAY && value.type !== mvm_TeType.VM_T_OBJECT) {
    return vmValueToHost(vm, value);
  }
  if (ancestors.some(ancestor => vm.sameValue(ancestor, value))) throw new TypeError('Cyclic Microvium results cannot be copied to the host');
  const nextAncestors = [...ancestors, value];
  if (value.type === mvm_TeType.VM_T_ARRAY) {
    return vm.arrayValues(value).map(item => vmValueToHostStructured(vm, item, state, nextAncestors, depth + 1));
  }

  const result: Record<string, any> = {};
  const keys = vm.arrayValues(vm.objectKeys(value));
  for (const keyValue of keys) {
    const key = keyValue.toString();
    if (key === '__proto__') throw new TypeError('The __proto__ property cannot be copied to the host');
    const item = vm.getProperty(value, keyValue);
    Object.defineProperty(result, key, {
      value: vmValueToHostStructured(vm, item, state, nextAncestors, depth + 1),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  return result;
}

// Used as a target for function proxies, so that `typeof` and `call` work as expected
const dummyFunctionTarget = () => {};
const dummyObject = {};

const vmValueSymbol = Symbol('vmValue');
const vmSymbol = Symbol('vm');

export class ValueWrapper implements ProxyHandler<any> {
  constructor (
    private vm: NativeVM.NativeVM,
    private vmValue: NativeVM.Value
  ) {
    this.toString = this.toString.bind(this);
  }

  static isWrapped(vm: NativeVM.NativeVM, value: any): boolean {
    return (typeof value === 'function' || typeof value === 'object') &&
      value !== null &&
      value[vmValueSymbol] &&
      value[vmSymbol] == vm // It needs to be a wrapped value in the context of the particular VM in question
  }

  static unwrap(vm: NativeVM.NativeVM, value: any): NativeVM.Value {
    hardAssert(ValueWrapper.isWrapped(vm, value));
    return value[vmValueSymbol];
  }

  toString() {
    return `<Microvium native ${this.getTypeDescription()} 0x${this.vmValue.raw.toString(16).padStart(4, '0')} "${this.vmValue.toString()}">`
  }

  getTypeDescription() {
    switch (this.vmValue.type) {
      case mvm_TeType.VM_T_UNDEFINED: return 'undefined';
      case mvm_TeType.VM_T_NULL: return 'null';
      case mvm_TeType.VM_T_BOOLEAN: return 'boolean';
      case mvm_TeType.VM_T_NUMBER: return 'number';
      case mvm_TeType.VM_T_STRING: return 'string';
      case mvm_TeType.VM_T_FUNCTION: return 'function';
      case mvm_TeType.VM_T_OBJECT: return 'object';
      case mvm_TeType.VM_T_ARRAY: return 'array';
      case mvm_TeType.VM_T_UINT8_ARRAY: return 'uint8 array';
      case mvm_TeType.VM_T_CLASS: return 'class';
      default: return 'unknown';
    }
  }

  get(_target: any, p: PropertyKey, receiver: any): any {
    if (p === vmValueSymbol) return this.vmValue;
    if (p === vmSymbol) return this.vm;
    if (p === Symbol.toPrimitive) return this.toString;
    if (p === Symbol.toStringTag) return this.toString;
    if (p === 'toString') return this.toString;
    if (typeof p === 'string' && (this.vmValue.type === mvm_TeType.VM_T_OBJECT || this.vmValue.type === mvm_TeType.VM_T_ARRAY)) {
      const propertyName = this.vm.newString(p);
      return vmValueToHost(this.vm, this.vm.getProperty(this.vmValue, propertyName));
    }
    if (p === Symbol.iterator && this.vmValue.type === mvm_TeType.VM_T_ARRAY) {
      const self = this;
      return function* () {
        for (const value of self.vm.arrayValues(self.vmValue)) yield vmValueToHost(self.vm, value);
      };
    }
    return undefined;
  }

  set(_target: any, p: PropertyKey, value: any, receiver: any): boolean {
    return notImplemented();
  }

  apply(_target: any, _thisArg: any, argArray: any[] = []): any {
    const args = argArray.map(a => hostValueToVM(this.vm, a));
    const func = this.vmValue;
    if (func.type !== mvm_TeType.VM_T_FUNCTION) return invalidOperation('Target is not callable');
    const result = this.vm.call(func, args);
    return vmValueToHost(this.vm, result);
  }
}
