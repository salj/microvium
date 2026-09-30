import { assert } from 'chai';
import { VirtualMachineFriendly } from '../../lib/virtual-machine-friendly';
import { decodeSnapshot } from '../../lib/decode-snapshot';
import { Snapshot } from '../../lib';
import { TeTypeCode } from '../../lib/runtime-types';
import { crc16ccitt } from 'crc';

function compile(source: string, defaultFloatWidth: 32 | 64 = 64): Snapshot {
  const vm = VirtualMachineFriendly.create({}, { defaultFloatWidth });
  vm.globalThis.vmExport = vm.vmExport;
  vm.evaluateModule({ sourceText: source });
  return vm.createSnapshot();
}

function recalculateCRC(bytes: Buffer): void {
  bytes.writeUInt16LE(crc16ccitt(bytes.slice(8)), 6);
}

function findNumberAllocationHeader(bytes: Buffer, expectedBodySize: number): number {
  for (let offset = 28; offset + 2 <= bytes.length; offset += 2) {
    const header = bytes.readUInt16LE(offset);
    if ((header >>> 12) === TeTypeCode.TC_REF_NUMBER && (header & 0x0FFF) === expectedBodySize) {
      return offset;
    }
  }
  throw new Error('Tagged Number allocation not found');
}

suite('numeric-types snapshots', () => {
  test('legacy f64-only source still emits engine minor 0', () => {
    const snapshot = compile('vmExport(1, 1.5);', 64);
    const decoded = decodeSnapshot(snapshot);
    assert.equal(snapshot.data[2], 0);
    assert.equal(snapshot.data[3], 0);
    assert.equal(snapshot.data.readUInt32LE(8) & (1 << 2), 0);
    assert.equal(decoded.snapshotInfo.numericOptions.defaultFloatWidth, 64);
  });

  test('f32 default uses the numeric-types feature and minor 1', () => {
    const snapshot = compile('vmExport(1, 1.5);', 32);
    assert.equal(snapshot.data[2], 1);
    assert.equal(snapshot.data[3] & 1, 1);
    assert.notEqual(snapshot.data.readUInt32LE(8) & (1 << 2), 0);
  });

  test('explicit u12 uses a tagged Number allocation', () => {
    const snapshot = compile('vmExport(1, /*u12*/ 4095);');
    const decoded = decodeSnapshot(snapshot);
    assert.include(decoded.disassembly, 'TC_REF_NUMBER');
    assert.include(decoded.disassembly, 'u12');
    const value = decoded.snapshotInfo.exports.get(1);
    assert.equal(value?.type, 'NumberValue');
    if (value?.type === 'NumberValue') {
      assert.equal(value.value, 4095n);
      assert.deepEqual(value.numericType, { kind: 'integer', signed: false, width: 12 });
    }
  });

  test('decoder accepts a genuine minor-0 f64 snapshot', () => {
    const snapshot = compile('vmExport(1, 1.5);', 64);
    const decoded = decodeSnapshot(snapshot);
    assert.equal(decoded.snapshotInfo.exports.get(1)?.type, 'NumberValue');
  });

  test('invalid tagged descriptor and payload size are rejected', () => {
    const original = compile('vmExport(1, /*u12*/ 4095);');

    const badDescriptor = Buffer.from(original.data);
    const headerOffset = findNumberAllocationHeader(badDescriptor, 4);
    badDescriptor[headerOffset + 2] = 0x82;
    recalculateCRC(badDescriptor);
    assert.throws(() => decodeSnapshot({ data: badDescriptor } as Snapshot), /Invalid numeric type descriptor/);

    const badSize = Buffer.from(original.data);
    const sizeHeaderOffset = findNumberAllocationHeader(badSize, 4);
    const header = badSize.readUInt16LE(sizeHeaderOffset);
    badSize.writeUInt16LE((header & 0xF000) | 3, sizeHeaderOffset);
    recalculateCRC(badSize);
    assert.throws(() => decodeSnapshot({ data: badSize } as Snapshot), /payload size 3; expected 4/);
  });

  test('unknown numeric option bits are rejected', () => {
    const original = compile('vmExport(1, 1.5);', 32);
    const malformed = Buffer.from(original.data);
    malformed[3] |= 0x80;
    recalculateCRC(malformed);
    assert.throws(() => decodeSnapshot({ data: malformed } as Snapshot), /Unknown numeric option bits/);
  });
});
