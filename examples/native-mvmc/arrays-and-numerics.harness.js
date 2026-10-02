globalThis.hostImports = {
  host: {
    observe(values) {
      const copied = [];
      for (const value of values) {
        copied.push(value.type === 'array' ? Array.from(value) : value);
      }
      return [copied, [20, [21]]];
    },
  },
};
globalThis.numericImports = {
  65000(value) {
    return value + 1;
  },
};

function assertNumeric(value, kind, width, expected) {
  assertEqual(value.type, 'number');
  const numeric = value.numeric();
  assertEqual(numeric.kind, kind);
  assertEqual(numeric.width, width);
  assertEqual(numeric.value, expected);
}

globalThis.runTests = function (vm) {
  assertEqual(vm.exportNames().length, 1);
  assertEqual(vm.exportNames()[0], 'run');

  const [echoedResult, numericImportResult] = Array.from(vm.callExport('run'));
  const [echoed, fromHost] = Array.from(echoedResult);
  assertEqual(numericImportResult, 21);
  assert(vm.exportIDs().includes(40000));
  assert(vm.exportIDs().includes(40001));
  assertEqual(vm.callExport(40000, 20), 42);
  assertNumeric(vm.getExport(40001), 'unsigned', 64, 9007199254740993n);

  const values = Array.from(echoed);
  assertNumeric(values[0], 'float', 32, 16777216);
  assertNumeric(values[1], 'float', 64, 1.5);
  assertNumeric(values[2], 'unsigned', 12, 4095n);
  assertNumeric(values[3], 'signed', 37, -1234567n);
  assertNumeric(values[4], 'unsigned', 64, 9007199254740993n);

  const nested = Array.from(values[5]);
  assertNumeric(nested[0], 'float', 32, 16777216);
  assertNumeric(Array.from(nested[1])[0], 'unsigned', 64, 9007199254740993n);

  const hostValues = Array.from(fromHost);
  assertEqual(hostValues[0], 20);
  assertEqual(Array.from(hostValues[1])[0], 21);
};
