import { assert } from 'chai';
import { compileSource } from './entry';
import { decodeSnapshot } from '../../lib/decode-snapshot';
import * as IL from '../../lib/il';

suite('browser compiler entry', () => {
  test('compiles Microvium source into a validated snapshot', () => {
    const snapshot = compileSource(`
      const host = vmImport(1);
      vmExport(1, function (n) { return n + host(n); });
    `);

    assert.isAbove(snapshot.byteLength, 16);
    // compileSource constructs SnapshotClass, which validates the header and CRC.
    assert.isAbove(snapshot[0], 0);
    const decoded = decodeSnapshot({ data: Buffer.from(snapshot) });
    assert.isFalse(decoded.snapshotInfo.flags.has(IL.ExecutionFlag.NumericTypes));
  });

  test('can reject numeric-types when compiling a snapshot', () => {
    assert.throws(
      () => compileSource('vmExport(1, /*u12*/ 4095);', { allowNumericTypes: false }),
      /Numeric types are disabled/,
    );
  });
});
