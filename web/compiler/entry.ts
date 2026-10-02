/// <reference path="./build-config.d.ts" />

import { Buffer } from 'buffer';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

// Some upstream compiler helpers use Node's Buffer global. The compiler bundle
// supplies the browser-compatible implementation here.
(globalThis as any).Buffer = Buffer;

const compilerDefaultFloatWidth: 32 | 64 =
  typeof __MVM_DEFAULT_FLOAT_WIDTH__ === 'undefined' ? 64 : __MVM_DEFAULT_FLOAT_WIDTH__;

export function compileSource(sourceText: string, options: { allowNumericTypes?: boolean } = {}): Uint8Array {
  const vm = VirtualMachineFriendly.create({}, { defaultFloatWidth: compilerDefaultFloatWidth, ...options });
  vm.globalThis.vmImport = vm.vmImport;
  vm.globalThis.vmExport = vm.vmExport;
  vm.evaluateModule({ sourceText, debugFilename: '<browser-compiler>' });
  return new Uint8Array(vm.createSnapshot().data);
}
