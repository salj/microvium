import { compileScript } from "../../lib/src-to-il/src-to-il";
import { stringifyUnit } from "../../lib/stringify-il";
import * as fs from 'fs';
import { srcToIlFilenames } from "./filenames";
import { assertSameCode } from "../common";
import { writeTextFile } from "../../lib/node-io";
import { assert } from "chai";
import { isFunctionNode, SupportedNode } from "../../lib/src-to-il/supported-babel-types";

suite('src-to-il', function () {
  test('classifies function nodes without treating classes as functions', () => {
    const cases: Array<[string, boolean]> = [
      ['FunctionDeclaration', true],
      ['FunctionExpression', true],
      ['ArrowFunctionExpression', true],
      ['ClassMethod', true],
      ['ClassDeclaration', false],
      ['ClassExpression', false],
    ];
    for (const [type, expected] of cases) {
      assert.equal(isFunctionNode({ type } as unknown as SupportedNode), expected);
    }
  });

  test('Empty unit', () => {
    const src = ``;
    const { unit } = compileScript('dummy.mvm.js', src);
    const expected = `
      unit ['dummy.mvm.js'];
      entry ['#entry'];
      global thisModule;
      function ['#entry']() {
        entry:
          LoadArg(index 0);
          StoreGlobal(name 'thisModule');
          Literal(lit undefined);
          Return();
      }`;
    assertSameCode(stringifyUnit(unit), expected);
  });

  test('General', () => {
    const filename = './test/src-to-il/input.mvm.js';
    const src = fs.readFileSync(filename, 'utf8');
    const { unit } = compileScript(filename, src);
    const stringifiedUnit = stringifyUnit(unit);
    writeTextFile(srcToIlFilenames.il.output, stringifiedUnit);
    const expected = fs.readFileSync(srcToIlFilenames.il.expected, 'utf8');
    assertSameCode(stringifiedUnit, expected);
  });
});
