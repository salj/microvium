import { assert } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { restore } from '../../lib';
import { decodeFFIMetadataFromSnapshot } from '../../lib/ffi';

suite('legacy native snapshots', () => {
  test('restoring and snapshotting v8.1 writes a current v9 snapshot', function () {
    if (process.env.MVM_SUPPORT_LEGACY_BYTECODE !== '1') this.skip();

    const legacy = fs.readFileSync(path.resolve('test/fixtures/v8.1-addition.snapshot'));
    const vm = restore({ data: legacy }, {});
    const upgraded = vm.createSnapshot().data;

    assert.equal(upgraded[0], 9);
    assert.equal(upgraded[1], 28);
    assert.deepEqual(decodeFFIMetadataFromSnapshot(upgraded), { imports: [], exports: [] });

    // The upgraded image must itself be accepted by the current native reader.
    restore({ data: upgraded }, {});
  });
});
