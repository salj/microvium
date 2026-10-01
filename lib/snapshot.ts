import { Snapshot } from '../lib';
import { invalidOperation } from './utils';
import { SnapshotReadOptions, validateSnapshotBinary } from './snapshot-il';
import { SnapshotReconstructionInfo } from './decode-snapshot';
import { SourceMap } from './source-map';

/**
 * A snapshot of the state of a virtual machine
 */
export class SnapshotClass implements Snapshot {
  constructor(data: Buffer, public reconstructionInfo?: SnapshotReconstructionInfo, public sourceMap?: SourceMap, options: SnapshotReadOptions = {}) {
    const errInfo = validateSnapshotBinary(data, options);
    if (errInfo) {
      return invalidOperation('Snapshot bytecode is invalid: ' + errInfo.err);
    }
    this._data = data;
  }

  get data() { return this._data; }

  private _data: Buffer;
}
