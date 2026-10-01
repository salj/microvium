import { assert } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { decodeSnapshot } from '../../lib/decode-snapshot';
import { SnapshotClass } from '../../lib/snapshot';
import { decodeFFIMetadataFromSnapshot } from '../../lib/ffi';

suite('legacy snapshots', () => {
  const bytes = fs.readFileSync(path.resolve('test/fixtures/v8.1-addition.snapshot'));

  test('v8.1 read support is disabled by default', () => {
    assert.throws(() => new SnapshotClass(bytes), /Legacy bytecode version 8 is disabled/);
  });

  test('opt-in reader decodes a v8.1 snapshot as legacy numeric ABI', () => {
    const snapshot = new SnapshotClass(bytes, undefined, undefined, { supportLegacyBytecode: true });
    const decoded = decodeSnapshot(snapshot, { supportLegacyBytecode: true });
    assert.deepEqual(decoded.snapshotInfo.namedImports, []);
    assert.deepEqual(decoded.snapshotInfo.namedExports, []);
    assert.deepEqual(decodeFFIMetadataFromSnapshot(bytes), { imports: [], exports: [] });
  });
});
