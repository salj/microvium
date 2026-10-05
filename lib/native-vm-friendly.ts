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
    case mvm_TeType.VM_T_ARRAY: return notImplemented();
    case mvm_TeType.VM_T_UINT8_ARRAY: return notImplemented();
    case mvm_TeType.VM_T_CLASS: return notImplemented();
    case mvm_TeType.VM_T_SYMBOL: return reserved();
    case mvm_TeType.VM_T_BIG_INT: return notImplemented();
    case mvm_TeType.VM_T_END: return unexpected();
    default: return assertUnreachable(value.type);
  }
}

function hostValueToVM(vm: NativeVM.NativeVM, value: any): NativeVM.Value {
  switch (typeof value) {
    case 'undefined': return vm.undefined;
    case 'boolean': return vm.newBoolean(value);
    case 'number': return vm.newNumber(value);
    case 'string': return vm.newString(value);
    case 'function': {
      if (ValueWrapper.isWrapped(vm, value)) {
        return ValueWrapper.unwrap(vm, value);
      } else {
        return notImplemented('Ephemeral in native VM')
        // return vm.ephemeralFunction(hostFunctionToVM(vm, value), nameHint || value.name);
      }
    }
    case 'object': {
      if (value === null) {
        return notImplemented();
        // return vm.null;
      }
      if (ValueWrapper.isWrapped(vm, value)) {
        return ValueWrapper.unwrap(vm, value);
      } else {
        return notImplemented('Ephemeral object in native VM');
      }
    }
    default: return notImplemented();
  }
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
