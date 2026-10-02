/*---
runExportedFunction: 0
description: Supports omitted initializer, test, and update parts of for loops
assertionCount: 4
dontCompareDisassembly: true
---*/
vmExport(0, run);

function run() {
  let i = 0;
  for (; i < 3; i++) {}
  assertEqual(i, 3);

  let j = 0;
  for (; j < 3;) {
    j++;
  }
  assertEqual(j, 3);

  let k = 0;
  for (k = 0; ; k++) {
    if (k === 2) break;
  }
  assertEqual(k, 2);

  let m = 0;
  for (;;) {
    m++;
    if (m === 3) break;
  }
  assertEqual(m, 3);
}
