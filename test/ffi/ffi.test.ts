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

    assert.equal(encoded[2] | (encoded[3] << 8), 1, 'same signatures are interned once');
    assert.deepEqual(decodeFFIMetadata(encoded), {
      imports: [
        { hostFunctionID: 7, moduleName: 'host/myprefixExport', importName: 'myprefixExport2', signature },
        { hostFunctionID: 8, moduleName: 'host/myprefixExport', importName: 'myprefixExport3', signature },
      ],
      exports: [{ exportID: 19, exportName: 'myprefixExport', signature }],
    });

    const symbolCount = encoded[0] | (encoded[1] << 8);
    assert.isAbove(symbolCount, 2);
    let offset = 8;
    let hasBackreference = false;
    for (let i = 0; i < symbolCount; i++) {
      const backrefLength = encoded[offset + 2] | (encoded[offset + 3] << 8);
      const tailLength = encoded[offset + 4] | (encoded[offset + 5] << 8);
      if (backrefLength > 0) hasBackreference = true;
      offset += 6 + tailLength;
    }
    assert.isTrue(hasBackreference);
  });

  test('supports literal strings with a zero-length backreference', () => {
    const signature: FFISignature = { parameters: [], result: 'Value' };
    const encoded = encodeFFIMetadata([], [{ exportID: 0, exportName: 'z', signature }]);
    assert.equal(encoded[8] | (encoded[9] << 8), 0);
    assert.equal(encoded[10] | (encoded[11] << 8), 0);
    assert.equal(encoded[12] | (encoded[13] << 8), 1);
    assert.deepEqual(decodeFFIMetadata(encoded).exports[0].exportName, 'z');
  });

  test('rejects out-of-range backreferences, truncation, and malformed annotations', () => {
    const signature: FFISignature = { parameters: [], result: 'Value' };
    const encoded = encodeFFIMetadata([], [{ exportID: 0, exportName: 'name', signature }]);
    encoded[8] = 1;
    encoded[9] = 0;
    encoded[10] = 1;
    encoded[11] = 0;
    assert.throws(() => decodeFFIMetadata(encoded), /backreference/);
    assert.throws(() => decodeFFIMetadata(encodeFFIMetadata([], [{ exportID: 0, exportName: 'name', signature }]).subarray(0, 9)), /Truncated/);
    assert.throws(() => parseFFISignature('@mvm-ffi (String) -> Value'), /currently accepts/);
  });

  test('parses fixed-arity VM Value signatures', () => {
    assert.deepEqual(parseFFISignature('/** @mvm-ffi (Value, Value) -> Value */'), {
      parameters: ['Value', 'Value'], result: 'Value'
    });
    assert.deepEqual(parseFFISignature('no ABI annotation'), undefined);
  });
});
