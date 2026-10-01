import { VirtualMachineFriendly } from "./virtual-machine-friendly";

export function addBuiltinGlobals(vm: VirtualMachineFriendly, noLib: boolean = false) {
  // Note: There is also a VirtualMachine.addBuiltinGlobals which can be used
  // when a global requires custom IL, and `addDefaultGlobals` in lib.ts which
  // adds globals for the default host environment.

  // Note: even with noLib, we can add these globals because they're pretty
  // important but also the garbage collector will remove these if they aren't
  // used (which not true of Array.prototype since it's dynamically accessible)

  const runtimeLibText = `
    export function Number_isNaN(n) {
      return n !== n;
    }

    export function Array_push(value) {
      this[this.length] = value;
    }
  `;
  const runtimeLib = vm.evaluateModule({ sourceText: runtimeLibText, debugFilename: '<builtin>' });

  const global = vm.globalThis;
  global.Infinity = Infinity;
  global.NaN = NaN;
  global.undefined = undefined;
  const Number = global.Number = vm.newObject();
  Number.isNaN = runtimeLib.Number_isNaN;
  Number.kind = global.Microvium.numericKindOf;
  Number.isInteger = global.Microvium.numericIsInteger;

  if (!noLib) {
    const arrayPrototype = vm.newObject();
    arrayPrototype.push = runtimeLib.Array_push;
    vm.setArrayPrototype(arrayPrototype);
  }

}
