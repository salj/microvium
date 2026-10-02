import { assert } from 'chai';
import { decodeFFIMetadata, encodeFFIMetadata, FFISignature, parseFFISignature } from '../../lib/ffi';

suite('named FFI metadata', () => {
  test('prefix-compresses against the decoded history and round-trips names and signatures', () => {
    const signature: FFISignature = { parameters: ['Value'], result: 'Value' };
    const encoded = encodeFFIMetadata([
      { hostFunctionID: 7, moduleName: 'host/myprefixExport', importName: 'myprefixExport2', signature },
      { hostFunctionID: 8, moduleName: 'host/myprefixExport', importName: 'myprefixExport3', signature },
    ], [
      { exportID: 19, exportName: 'myprefixExport', signature },
    ]);

    assert.equal(encoded[1], 1, 'same signatures are interned once');
    assert.deepEqual(decodeFFIMetadata(encoded), {
      imports: [
        { hostFunctionID: 7, moduleName: 'host/myprefixExport', importName: 'myprefixExport2', signature },
        { hostFunctionID: 8, moduleName: 'host/myprefixExport', importName: 'myprefixExport3', signature },
      ],
      exports: [{ exportID: 19, exportName: 'myprefixExport', signature }],
    });

    const cursor = { offset: 0 };
    const symbolCount = readVarUint16(encoded, cursor);
    readVarUint16(encoded, cursor); // signature count
    readVarUint16(encoded, cursor); // import count
    readVarUint16(encoded, cursor); // export count
    assert.isAbove(symbolCount, 2);
    let hasBackreference = false;
    for (let i = 0; i < symbolCount; i++) {
      const backrefLength = readVarUint16(encoded, cursor);
      if (backrefLength > 0) {
        hasBackreference = true;
        readVarUint16(encoded, cursor); // backreference start
      }
      const tailLength = readVarUint16(encoded, cursor);
      cursor.offset += tailLength;
    }
    assert.isTrue(hasBackreference);
  });

  test('supports literal strings with a zero-length backreference', () => {
    const signature: FFISignature = { parameters: [], result: 'Value' };
    const encoded = encodeFFIMetadata([], [{ exportID: 0, exportName: 'z', signature }]);
    assert.deepEqual(Array.from(encoded.subarray(0, 4)), [1, 1, 0, 1]);
    assert.deepEqual(Array.from(encoded.subarray(4, 7)), [0, 1, 'z'.charCodeAt(0)]);
    assert.deepEqual(Array.from(encoded.subarray(7, 9)), [0, 0]); // empty signature record
    assert.deepEqual(Array.from(encoded.subarray(9)), [0, 0, 0]); // export ID and table indexes
    assert.deepEqual(decodeFFIMetadata(encoded).exports[0].exportName, 'z');
  });

  test('keeps a one-byte prefix literal when a reference would not reduce the record', () => {
    const signature: FFISignature = { parameters: [], result: 'Value' };
    const encoded = encodeFFIMetadata([], [
      { exportID: 0, exportName: 'a', signature },
      { exportID: 1, exportName: 'ab', signature },
    ]);

    const offsetAfterFirst = 4 + 3;
    assert.deepEqual(Array.from(encoded.subarray(4, offsetAfterFirst)), [0, 1, 'a'.charCodeAt(0)]);
    assert.deepEqual(Array.from(encoded.subarray(offsetAfterFirst, offsetAfterFirst + 4)), [0, 2, 97, 98]);
    assert.deepEqual(decodeFFIMetadata(encoded).exports.map(e => e.exportName), ['a', 'ab']);
  });

  test('encodes and reads an empty table using its four zero counts', () => {
    const encoded = encodeFFIMetadata([], []);
    assert.deepEqual(Array.from(encoded), [0, 0, 0, 0]);
    assert.deepEqual(decodeFFIMetadata(encoded), {
      imports: [],
      exports: [],
    });
  });

  test('uses multi-byte counts and indexes in the compact table', () => {
    const signature: FFISignature = { parameters: [], result: 'Value' };
    const exports = Array.from({ length: 130 }, (_, i) => ({
      exportID: i,
      exportName: `function${i}`,
      signature,
    }));
    const encoded = encodeFFIMetadata([], exports);
    const cursor = { offset: 0 };
    readVarUint16(encoded, cursor); // symbol count
    readVarUint16(encoded, cursor); // signature count
    assert.equal(readVarUint16(encoded, cursor), 0); // import count
    assert.equal(readVarUint16(encoded, cursor), exports.length);
    const decoded = decodeFFIMetadata(encoded).exports;
    assert.equal(decoded.length, exports.length);
    assert.deepEqual(decoded.map(e => e.exportID).sort((a, b) => a - b), exports.map(e => e.exportID));
    assert.equal(decoded.find(e => e.exportID === 129)?.exportName, 'function129');
  });

  test('rejects out-of-range backreferences, truncation, and malformed annotations', () => {
    const signature: FFISignature = { parameters: [], result: 'Value' };
    const encoded = encodeFFIMetadata([], [{ exportID: 0, exportName: 'name', signature }]);
    encoded[4] = 2; // prefix length 2
    encoded[5] = 1; // start 1, which is outside the decoded history
    assert.throws(() => decodeFFIMetadata(encoded), /backreference/);
    assert.throws(() => decodeFFIMetadata(encodeFFIMetadata([], [{ exportID: 0, exportName: 'name', signature }]).subarray(0, 6)), /Truncated/);
    assert.throws(() => parseFFISignature('@mvm-ffi (String) -> Value'), /currently accepts/);
  });

  test('rejects non-canonical or oversized compact varints', () => {
    const signature: FFISignature = { parameters: [], result: 'Value' };
    const overlong = encodeFFIMetadata([], [{ exportID: 0, exportName: 'z', signature }]);
    overlong[4] = 0x80;
    overlong[5] = 0;
    assert.throws(() => decodeFFIMetadata(overlong), /varint/);

    const oversized = encodeFFIMetadata([], [{ exportID: 0, exportName: 'z', signature }]);
    oversized[4] = 0xFF;
    oversized[5] = 0xFF;
    oversized[6] = 0x04;
    assert.throws(() => decodeFFIMetadata(oversized), /varint/);
  });

  test('parses fixed-arity VM Value signatures', () => {
    assert.deepEqual(parseFFISignature('/** @mvm-ffi (Value, Value) -> Value */'), {
      parameters: ['Value', 'Value'], result: 'Value'
    });
    assert.deepEqual(parseFFISignature('no ABI annotation'), undefined);
  });
});

function readVarUint16(data: Uint8Array, cursor: { offset: number }): number {
  let value = 0;
  for (let i = 0; i < 3; i++) {
    const byte = data[cursor.offset++];
    assert.isDefined(byte);
    value |= (byte & 0x7F) << (i * 7);
    if ((byte & 0x80) === 0) return value;
  }
  throw new Error('Invalid varint in test output');
}
