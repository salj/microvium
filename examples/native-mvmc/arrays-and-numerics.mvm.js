/** @mvm-ffi (Value) -> Value */
import { observe } from 'host';

const payload = [
  /*f32*/ 16777217,
  /*f64*/ 1.5,
  /*u12*/ 4095,
  /*i37*/ -1234567,
  /*u64*/ 9007199254740993,
  [
    /*f32*/ 16777217,
    [/*u64*/ 9007199254740993],
  ],
];
const legacyTransform = vmImport(65000);

/** @mvm-ffi */
export function run() {
  return [observe(payload), legacyTransform(20)];
}

vmExport(40000, value => value + 22);
vmExport(40001, /*u64*/ 9007199254740993);
