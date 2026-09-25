import { assert } from 'chai';
import { compileSource } from './entry';

suite('browser compiler entry', () => {
  test('compiles Microvium source into a validated snapshot', () => {
    const snapshot = compileSource(`
      const host = vmImport(1);
      vmExport(1, function (n) { return n + host(n); });
    `);

    assert.isAbove(snapshot.byteLength, 16);
    // compileSource constructs SnapshotClass, which validates the header and CRC.
    assert.isAbove(snapshot[0], 0);
  });
});
