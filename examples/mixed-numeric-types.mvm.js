// Compile this with the standard numeric builtins and a host-provided vmExport.
// The end-to-end test runs this file in both the reference and native VMs.
/* microvium: default-float=f64 */

const base32 = /*f32*/ 16777216;
const one32 = /*f32*/ 1;
const one64 = /*f64*/ 1;

// At 2^24, binary32 cannot retain the added 1; binary64 can.
const sum32 = /*f32*/ base32 + one32;
const sum64 = base32 + one64;

const roundingBase = 16777216;
const roundedDuringEvaluation = /*f32*/ (roundingBase + 1 - roundingBase);
const roundedAtOperandCast = /*(f32)*/ (roundingBase + 1) - roundingBase;
const roundedAfterEvaluation = /*(f32)*/ (roundingBase + 1 - roundingBase);

// The f64 operand promotes the inner operation, then the f32 boundary rounds it.
const promotedThenNarrowed = /*f32*/ base32 + one64;
const retainedLowBit = sum64 - base32;

function addU5(a, b) {
  return /*u5*/ a + b;
}

function addI7(a, b) {
  return /*i7*/ a + b;
}

function addU12(a, b) {
  return /*u12*/ a + b;
}

function addI37(a, b) {
  return /*i37*/ a + b;
}

function addU8ToU12(a, b) {
  return /*(u8)*/ a + /*(u12)*/ b;
}

const aboveSafeInteger = /*u64*/ 9007199254740993;
const atSafeInteger = /*u64*/ 9007199254740992;

vmExport(1, () => sum32);
vmExport(2, () => Number.kind(sum32));
vmExport(3, () => sum64);
vmExport(4, () => Number.kind(sum64));
vmExport(5, () => retainedLowBit);
vmExport(6, () => promotedThenNarrowed);
vmExport(7, () => Number.kind(promotedThenNarrowed));

vmExport(8, () => addU5(31, 1));
vmExport(9, () => Number.kind(addU5(31, 1)));
vmExport(10, () => addI7(63, 1));
vmExport(11, () => Number.kind(addI7(63, 1)));
vmExport(12, () => addU12(4095, 2));
vmExport(13, () => Number.kind(addU12(4095, 2)));
vmExport(14, () => addI37(68719476735, 1));
vmExport(15, () => Number.kind(addI37(68719476735, 1)));
vmExport(16, () => addU8ToU12(255, 1));
vmExport(17, () => Number.kind(addU8ToU12(255, 1)));
vmExport(18, () => aboveSafeInteger > atSafeInteger);
vmExport(19, () => Number.kind(aboveSafeInteger));
vmExport(20, () => roundedDuringEvaluation);
vmExport(21, () => roundedAtOperandCast);
vmExport(22, () => roundedAfterEvaluation);
