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
 * Encode the prototype named-linking table. Counts and indexes use canonical
 * 16-bit varints. Symbols are sorted by UTF-8 byte order and can copy a prefix
 * from anywhere in the earlier decoded symbol stream.
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
  writer.varUint16(symbols.length);
  writer.varUint16(signatures.length);
  writer.varUint16(imports.length);
  writer.varUint16(exports.length);

  const decoded = new Uint8Array(0xFFFF);
  let decodedLength = 0;
  for (const { bytes } of symbols) {
    const literalSize = 1 + varUint16Size(bytes.length) + bytes.length;
    const reference = longestBackreference(decoded.subarray(0, decodedLength), bytes);
    const tailLength = bytes.length - reference.length;
    const referenceSize = reference.length === 0
      ? Infinity
      : varUint16Size(reference.length) + varUint16Size(reference.start) + varUint16Size(tailLength) + tailLength;

    if (referenceSize < literalSize) {
      writer.varUint16(reference.length);
      writer.varUint16(reference.start);
      writer.varUint16(tailLength);
      writer.bytes(bytes.subarray(reference.length));
    } else {
      // A zero prefix length is the literal form. It needs no start offset.
      writer.varUint16(0);
      writer.varUint16(bytes.length);
      writer.bytes(bytes);
    }

    if (decodedLength + bytes.length > decoded.length) throw new Error('Named FFI symbol stream exceeds 65535 decoded bytes');
    decoded.set(bytes, decodedLength);
    decodedLength += bytes.length;
  }

  for (const [, signature] of signatures) {
    if (signature.parameters.length > 255 || signature.parameters.some(t => t !== 'Value') || signature.result !== 'Value') {
      throw new Error('Named FFI currently accepts at most 255 parameters, all typed `Value`');
    }
    writer.u8(signature.parameters.length);
    for (const _parameter of signature.parameters) writer.u8(0); // Value
    writer.u8(0); // Value result type
  }

  const orderedImports = [...imports].sort((a, b) =>
    compareBytes(encoder.encode(a.moduleName), encoder.encode(b.moduleName)) ||
    compareBytes(encoder.encode(a.importName), encoder.encode(b.importName)));
  const orderedExports = [...exports].sort((a, b) => compareBytes(encoder.encode(a.exportName), encoder.encode(b.exportName)));
  for (const item of orderedImports) {
    writer.varUint16(item.hostFunctionID);
    writer.varUint16(required(symbolIndex.get(item.moduleName)));
    writer.varUint16(required(symbolIndex.get(item.importName)));
    writer.varUint16(required(signatureIndex.get(ffiSignatureKey(item.signature))));
  }
  for (const item of orderedExports) {
    writer.varUint16(item.exportID);
    writer.varUint16(required(symbolIndex.get(item.exportName)));
    writer.varUint16(required(signatureIndex.get(ffiSignatureKey(item.signature))));
  }

  return writer.finish();
}

/** Decode and validate a complete named-linking section. */
export function decodeFFIMetadata(data: Uint8Array): { imports: NamedImport[]; exports: NamedExport[] } {
  const reader = new ByteReader(data);
  const symbolCount = reader.varUint16();
  const signatureCount = reader.varUint16();
  const importCount = reader.varUint16();
  const exportCount = reader.varUint16();

  const symbols: string[] = [];
  const decoded = new Uint8Array(0xFFFF);
  let decodedLength = 0;
  let previousSymbolBytes: Uint8Array | undefined;
  for (let i = 0; i < symbolCount; i++) {
    const backrefLength = reader.varUint16();
    const backrefStart = backrefLength === 0 ? 0 : reader.varUint16();
    const tailLength = reader.varUint16();
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
    const parameterCount = reader.u8();
    const parameters: FFIValueType[] = [];
    for (let j = 0; j < parameterCount; j++) {
      if (reader.u8() !== 0) throw new Error('Unknown named FFI parameter type');
      parameters.push('Value');
    }
    if (reader.u8() !== 0) throw new Error('Unknown named FFI result type');
    signatures.push({ parameters, result: 'Value' });
  }

  const imports: NamedImport[] = [];
  for (let i = 0; i < importCount; i++) {
    const hostFunctionID = reader.varUint16();
    const moduleIndex = reader.varUint16();
    const nameIndex = reader.varUint16();
    const sigIndex = reader.varUint16();
    imports.push({
      hostFunctionID,
      moduleName: required(symbols[moduleIndex]),
      importName: required(symbols[nameIndex]),
      signature: required(signatures[sigIndex]),
    });
  }
  const exports: NamedExport[] = [];
  for (let i = 0; i < exportCount; i++) {
    const exportID = reader.varUint16();
    const nameIndex = reader.varUint16();
    const sigIndex = reader.varUint16();
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
  let bestStart = 0;
  let bestLength = 0;
  for (let start = 0; start < history.length; start++) {
    let length = 0;
    while (start + length < history.length && length < value.length && history[start + length] === value[length]) {
      length++;
    }
    if (length > bestLength) {
      bestStart = start;
      bestLength = length;
    }
  }
  return { start: bestStart, length: bestLength };
}

function varUint16Size(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 0xFFFF) throw new Error('Named FFI field exceeds 65535');
  return value < 0x80 ? 1 : value < 0x4000 ? 2 : 3;
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Invalid named FFI table index');
  return value;
}

class ByteWriter {
  private out: number[] = [];
  u8(value: number) { this.out.push(value & 0xFF); }
  varUint16(value: number) {
    varUint16Size(value);
    while (value >= 0x80) {
      this.u8((value & 0x7F) | 0x80);
      value >>>= 7;
    }
    this.u8(value);
  }
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
  varUint16() {
    let value = 0;
    for (let i = 0; i < 3; i++) {
      const byte = this.u8();
      value |= (byte & 0x7F) << (i * 7);
      if ((byte & 0x80) === 0) {
        if ((i > 0 && (byte & 0x7F) === 0) || value > 0xFFFF) {
          throw new Error('Invalid named FFI varint');
        }
        return value;
      }
    }
    throw new Error('Invalid named FFI varint');
  }
  bytes(length: number) {
    if (this.offset + length > this.data.length) throw new Error('Truncated named FFI table');
    const result = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }
  atEnd() { return this.offset === this.data.length; }
  remaining() { return this.data.length - this.offset; }
}
