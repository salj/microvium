import { Buffer } from 'buffer';
import { mvm_TeBytecodeSection } from './runtime-types';

/** The first named FFI version passes all arguments and results as VM Values. */
export type FFIValueType = 'Value';

export interface FFISignature {
  parameters: FFIValueType[];
  result: FFIValueType;
}

export interface NamedImport {
  hostFunctionID: number;
  moduleName: string;
  importName: string;
  signature: FFISignature;
}

export interface NamedExport {
  exportID: number;
  exportName: string;
  signature: FFISignature;
}

const encoder = { encode: (value: string) => Uint8Array.from(Buffer.from(value, 'utf8')) };

/** Parse the deliberately small, stable JSDoc annotation used by named FFI. */
export function parseFFISignature(text: string): FFISignature | undefined {
  const match = /@mvm-ffi\s*\(([^)]*)\)\s*->\s*(Value)\b/.exec(text);
  if (!match) {
    if (/@mvm-ffi\s*\(/.test(text)) throw new Error('Invalid @mvm-ffi signature; expected `@mvm-ffi (Value, ...) -> Value`');
    return undefined;
  }

  const parametersText = match[1].trim();
  const parameters = parametersText === '' ? [] : parametersText.split(',').map(s => s.trim());
  if (parameters.length > 255 || parameters.some(t => t !== 'Value')) {
    throw new Error('Named FFI currently accepts at most 255 parameters, all typed `Value`');
  }
  return { parameters: parameters as FFIValueType[], result: 'Value' };
}

export function ffiSignatureKey(signature: FFISignature): string {
  return `${signature.parameters.length}:${signature.parameters.join(',')}->${signature.result}`;
}

/**
 * Encode the v9 named-linking section. The symbol stream is sorted by UTF-8
 * byte order; each record can copy a prefix from any earlier decoded byte.
 * Call slots refer to symbols and structurally interned signatures by index.
 */
export function encodeFFIMetadata(imports: NamedImport[], exports: NamedExport[]): Uint8Array {
  const unique = new Map<string, Uint8Array>();
  for (const item of imports) {
    unique.set(item.moduleName, encoder.encode(item.moduleName));
    unique.set(item.importName, encoder.encode(item.importName));
  }
  for (const item of exports) unique.set(item.exportName, encoder.encode(item.exportName));

  const symbols = [...unique.keys()].map(value => ({ value, bytes: unique.get(value)! }));
  symbols.sort((a, b) => compareBytes(a.bytes, b.bytes));
  const symbolIndex = new Map(symbols.map((s, i) => [s.value, i]));

  const signaturesByKey = new Map<string, FFISignature>();
  for (const item of [...imports, ...exports]) signaturesByKey.set(ffiSignatureKey(item.signature), item.signature);
  const signatures = [...signaturesByKey.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  const signatureIndex = new Map(signatures.map(([key], i) => [key, i]));

  const writer = new ByteWriter();
  writer.u16(symbols.length);
  writer.u16(signatures.length);
  writer.u16(imports.length);
  writer.u16(exports.length);

  let decoded = new Uint8Array(0);
  for (const { bytes } of symbols) {
    const { start, length } = longestBackreference(decoded, bytes);
    const tail = bytes.subarray(length);
    writer.u16(start);
    writer.u16(length);
    writer.u16(tail.length);
    writer.bytes(tail);
    decoded = concat(decoded, bytes);
    if (decoded.length > 0xFFFF) throw new Error('Named FFI symbol stream exceeds 65535 decoded bytes');
  }

  for (const [, signature] of signatures) {
    writer.u16(signature.parameters.length + 2);
    writer.u8(signature.parameters.length);
    for (const _parameter of signature.parameters) writer.u8(0); // Value
    writer.u8(0); // Value result type
  }

  const orderedImports = [...imports].sort((a, b) =>
    compareBytes(encoder.encode(a.moduleName), encoder.encode(b.moduleName)) ||
    compareBytes(encoder.encode(a.importName), encoder.encode(b.importName)));
  const orderedExports = [...exports].sort((a, b) => compareBytes(encoder.encode(a.exportName), encoder.encode(b.exportName)));
  for (const item of orderedImports) {
    writer.u16(item.hostFunctionID);
    writer.u16(required(symbolIndex.get(item.moduleName)));
    writer.u16(required(symbolIndex.get(item.importName)));
    writer.u16(required(signatureIndex.get(ffiSignatureKey(item.signature))));
  }
  for (const item of orderedExports) {
    writer.u16(item.exportID);
    writer.u16(required(symbolIndex.get(item.exportName)));
    writer.u16(required(signatureIndex.get(ffiSignatureKey(item.signature))));
  }

  return writer.finish();
}

/** Decode and validate a complete named-linking section. */
export function decodeFFIMetadata(data: Uint8Array): { imports: NamedImport[]; exports: NamedExport[] } {
  const reader = new ByteReader(data);
  const symbolCount = reader.u16();
  const signatureCount = reader.u16();
  const importCount = reader.u16();
  const exportCount = reader.u16();

  const symbols: string[] = [];
  const decoded = new Uint8Array(0xFFFF);
  let decodedLength = 0;
  let previousSymbolBytes: Uint8Array | undefined;
  for (let i = 0; i < symbolCount; i++) {
    const backrefStart = reader.u16();
    const backrefLength = reader.u16();
    const tailLength = reader.u16();
    if (backrefStart + backrefLength > decodedLength) throw new Error('Invalid named FFI backreference');
    const start = decodedLength;
    for (let j = 0; j < backrefLength; j++) decoded[decodedLength++] = decoded[backrefStart + j];
    const tail = reader.bytes(tailLength);
    if (decodedLength + tail.length > decoded.length) throw new Error('Named FFI symbol stream is too large');
    decoded.set(tail, decodedLength);
    decodedLength += tail.length;
    const bytes = decoded.subarray(start, decodedLength);
    const value = Buffer.from(bytes).toString('utf8');
    if (compareBytes(encoder.encode(value), bytes) !== 0) throw new Error('Invalid UTF-8 in named FFI symbol');
    if (previousSymbolBytes && compareBytes(previousSymbolBytes, bytes) >= 0) throw new Error('Named FFI symbols are not strictly sorted');
    previousSymbolBytes = bytes;
    symbols.push(value);
  }

  const signatures: FFISignature[] = [];
  for (let i = 0; i < signatureCount; i++) {
    const size = reader.u16();
    const record = new ByteReader(reader.bytes(size));
    const parameterCount = record.u8();
    const parameters: FFIValueType[] = [];
    for (let j = 0; j < parameterCount; j++) {
      if (record.u8() !== 0) throw new Error('Unknown named FFI parameter type');
      parameters.push('Value');
    }
    if (record.u8() !== 0 || !record.atEnd()) throw new Error('Invalid named FFI signature');
    signatures.push({ parameters, result: 'Value' });
  }

  const imports: NamedImport[] = [];
  for (let i = 0; i < importCount; i++) {
    const hostFunctionID = reader.u16();
    const moduleIndex = reader.u16();
    const nameIndex = reader.u16();
    const sigIndex = reader.u16();
    imports.push({
      hostFunctionID,
      moduleName: required(symbols[moduleIndex]),
      importName: required(symbols[nameIndex]),
      signature: required(signatures[sigIndex]),
    });
  }
  const exports: NamedExport[] = [];
  for (let i = 0; i < exportCount; i++) {
    const exportID = reader.u16();
    const nameIndex = reader.u16();
    const sigIndex = reader.u16();
    exports.push({
      exportID,
      exportName: required(symbols[nameIndex]),
      signature: required(signatures[sigIndex]),
    });
  }
  if (!reader.atEnd() && !(reader.remaining() === 1 && reader.u8() === 0)) {
    throw new Error('Trailing bytes in named FFI section');
  }
  return { imports, exports };
}

/** Decode the named-linking section directly from a v9 snapshot. */
export function decodeFFIMetadataFromSnapshot(data: Uint8Array): { imports: NamedImport[]; exports: NamedExport[] } {
  if (data.length >= 2 && data[0] === 8 && data[1] === 28) return { imports: [], exports: [] };
  if (data.length < 28 || data[0] !== 9 || data[1] !== 28) throw new Error('Unsupported snapshot format for named FFI');
  const readOffset = (section: mvm_TeBytecodeSection) => {
    const offset = 10 + section * 2;
    return data[offset] | (data[offset + 1] << 8);
  };
  const start = readOffset(mvm_TeBytecodeSection.BCS_FFI_TABLE);
  const end = readOffset(mvm_TeBytecodeSection.BCS_GLOBALS);
  if (start < 28 || end < start || end > data.length) throw new Error('Invalid named FFI section offsets');
  if (start === end) return { imports: [], exports: [] };
  return decodeFFIMetadata(data.subarray(start, end));
}

function longestBackreference(history: Uint8Array, value: Uint8Array): { start: number; length: number } {
  for (let length = value.length; length > 0; length--) {
    outer: for (let start = 0; start + length <= history.length; start++) {
      for (let i = 0; i < length; i++) if (history[start + i] !== value[i]) continue outer;
      return { start, length };
    }
  }
  return { start: 0, length: 0 };
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Invalid named FFI table index');
  return value;
}

class ByteWriter {
  private out: number[] = [];
  u8(value: number) { this.out.push(value & 0xFF); }
  u16(value: number) { this.u8(value); this.u8(value >>> 8); }
  bytes(value: Uint8Array) { for (const byte of value) this.u8(byte); }
  finish() { return Uint8Array.from(this.out); }
}

class ByteReader {
  private offset = 0;
  constructor(private data: Uint8Array) {}
  u8() {
    if (this.offset >= this.data.length) throw new Error('Truncated named FFI table');
    return this.data[this.offset++];
  }
  u16() { return this.u8() | (this.u8() << 8); }
  bytes(length: number) {
    if (this.offset + length > this.data.length) throw new Error('Truncated named FFI table');
    const result = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }
  atEnd() { return this.offset === this.data.length; }
  remaining() { return this.data.length - this.offset; }
}
