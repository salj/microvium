import * as VM from './virtual-machine-types';
import * as IL from './il';
import { entriesInOrder, stringifyIdentifier } from './utils';
import { stringifyValue, stringifyFunction, stringifyAllocation, StringifyILOpts } from './stringify-il';
import { crc16ccitt } from 'crc';
import { NamedExport, NamedImport } from './ffi';

export const ENGINE_MAJOR_VERSION = 9  /* aka MVM_BYTECODE_VERSION */;
export const HEADER_SIZE = 28;
export const LEGACY_ENGINE_MAJOR_VERSION = 8;
export const LEGACY_HEADER_SIZE = 28;
export const ENGINE_MINOR_VERSION = 3  /* aka MVM_ENGINE_VERSION */;

export interface SnapshotReadOptions {
  /** Permit reading v8.1 snapshots when the native runtime is built with the same support. */
  supportLegacyBytecode?: boolean;
}

/**
 * A snapshot represents the state of the machine captured at a specific moment
 * in time.
 *
 * Note: Handles are not part of the snapshot. Handles represent references from
 * the host into the VM. These references are severed at the time that VM is
 * snapshotted.
 */
export interface SnapshotIL {
  globalSlots: Map<VM.GlobalSlotID, VM.GlobalSlot>;
  functions: Map<IL.FunctionID, IL.Function>;
  exports: Map<IL.ExportID, IL.Value>;
  /** Optional name/signature surface associated with numeric call slots. */
  namedImports?: NamedImport[];
  namedExports?: NamedExport[];
  allocations: Map<IL.AllocationID, IL.Allocation>;
  flags: Set<IL.ExecutionFlag>;
  numericOptions: NumericOptions;
  builtins: {
    arrayPrototype: IL.Value;
    promisePrototype: IL.Value;
    asyncContinue: IL.Value;
    asyncCatchBlock: IL.Value;
    asyncHostCallback: IL.Value;
  }
}

export interface NumericOptions {
  defaultFloatWidth: 32 | 64;
}

export function stringifySnapshotIL(snapshot: SnapshotIL, opts: StringifyILOpts = {}): string {
  return `${
    entriesInOrder(snapshot.exports)
      .map(([k, v]) => `export ${k} = ${stringifyValue(v)};`)
      .join('\n')
    }\n\n${
    entriesInOrder(snapshot.globalSlots)
      .map(([k, v]) => `slot ${stringifyIdentifier(k)} = ${stringifyValue(v.value)};`)
      .join('\n')
    }\n\n${
    entriesInOrder(snapshot.functions)
      .map(([, v]) => stringifyFunction(v, '', opts))
      .join('\n\n')
    }\n\n${
    entriesInOrder(snapshot.allocations)
      .map(([k, v]) => `${stringifyAllocationRegion(v.memoryRegion)}allocation ${k} = ${stringifyAllocation(v)};`)
      .join('\n\n')
    }`;
}

function stringifyAllocationRegion(region: IL.AllocationBase['memoryRegion']): string {
  return !region || region === 'gc' ? '' : region + ' ';
}

export function validateSnapshotBinary(bytecode: Buffer, options: SnapshotReadOptions = {}): { err: string } | undefined {
  const actualBytecodeVersion = bytecode.length > 0 ? bytecode.readUInt8(0) : -1;
  const isLegacyBytecode = actualBytecodeVersion === LEGACY_ENGINE_MAJOR_VERSION;
  if (isLegacyBytecode && !options.supportLegacyBytecode) {
    return { err: `Legacy bytecode version ${LEGACY_ENGINE_MAJOR_VERSION} is disabled` };
  }

  const expectedHeaderSize = isLegacyBytecode ? LEGACY_HEADER_SIZE : HEADER_SIZE;
  // The first 8 bytes include the integrity metadata
  if (bytecode.length < expectedHeaderSize) return { err: 'Too short' };

  const headerSize = bytecode.readUInt8(1);
  if (headerSize != expectedHeaderSize)
    return { err: `Header size mismatch` };

  const bytecodeSize = bytecode.readUInt16LE(4);
  if (bytecodeSize != bytecode.length)
    return { err: `Bytecode size mismatch` };

  const calculatedCrc = crc16ccitt(bytecode.slice(8));
  const recordedCrc = bytecode.readUInt16LE(6);
  if (calculatedCrc !== recordedCrc)
    return { err: `CRC fail` };

  if (!isLegacyBytecode && actualBytecodeVersion !== ENGINE_MAJOR_VERSION) {
    return { err: `Supported bytecode version is ${ENGINE_MAJOR_VERSION} but file is version ${actualBytecodeVersion}` };
  }

  const requiredEngineVersion = bytecode.readUInt8(2);
  if (isLegacyBytecode) {
    if (requiredEngineVersion > 1) return { err: `Legacy engine version ${requiredEngineVersion} is not supported` };
    return undefined;
  }
  const numericOptions = bytecode.readUInt8(3);
  const requiredFeatureFlags = bytecode.readUInt16LE(8);
  const usesNumericTypes = (requiredFeatureFlags & (1 << IL.ExecutionFlag.NumericTypes)) !== 0;
  if (requiredEngineVersion > ENGINE_MINOR_VERSION) {
    return { err: `Engine version ${requiredEngineVersion} requires a later engine (implemented ${ENGINE_MINOR_VERSION})` };
  }
  if (requiredEngineVersion === 0 && (usesNumericTypes || numericOptions !== 0)) {
    return { err: 'Invalid numeric options for an engine-minor-0 snapshot' };
  }
  if (!usesNumericTypes && numericOptions !== 0) {
    return { err: 'Numeric options require the numeric-types feature' };
  }
  if ((numericOptions & ~0x01) !== 0) {
    return { err: `Unknown numeric option bits: 0x${numericOptions.toString(16)}` };
  }
}
