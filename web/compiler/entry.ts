import { Buffer } from 'buffer';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';

// Some upstream compiler helpers use Node's Buffer global. The compiler bundle
// supplies the browser-compatible implementation here.
(globalThis as any).Buffer = Buffer;

export function compileSource(sourceText: string): Uint8Array {
  const vm = VirtualMachineFriendly.create({});
  vm.globalThis.vmImport = vm.vmImport;
  vm.globalThis.vmExport = vm.vmExport;
  vm.evaluateModule({ sourceText, debugFilename: '<browser-compiler>' });
  return new Uint8Array(vm.createSnapshot().data);
}
