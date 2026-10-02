unit ['./test/end-to-end/tests/number-operations.test.mvm.js'];

entry ['#entry'];

external vmExport from free-variable 'vmExport';
external assertEqual from free-variable 'assertEqual';
external Infinity from free-variable 'Infinity';
external overflowChecks from free-variable 'overflowChecks';
external assert from free-variable 'assert';
external Number from free-variable 'Number';
external NaN from free-variable 'NaN';

global thisModule;
global testNegate;
global testUnaryPlus;
global testAddition;
global testSubtraction;
global testMultiplication;
global testDivision;
global testLessThan;
global testGreaterThan;
global testRemainder;
global testPower;
global testIncrDecr;
global testStringToInt;
global testIntToString;
global testFloatToString;

function ['#entry']() {
  entry:
    LoadArg(index 0);                    // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'thisModule');      // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function run);          // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testNegate);   // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testNegate');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testUnaryPlus); // 2                ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testUnaryPlus');   // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testAddition); // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testAddition');    // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testSubtraction); // 2              ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testSubtraction'); // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testMultiplication); // 2           ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testMultiplication'); // 1              ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testDivision); // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testDivision');    // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testLessThan); // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testLessThan');    // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testGreaterThan); // 2              ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testGreaterThan'); // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testRemainder); // 2                ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testRemainder');   // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testPower);    // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testPower');       // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testIncrDecr); // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testIncrDecr');    // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testStringToInt); // 2              ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testStringToInt'); // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testIntToString); // 2              ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testIntToString'); // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    Literal(lit &function testFloatToString); // 2            ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    StoreGlobal(name 'testFloatToString'); // 1               ./test/end-to-end/tests/number-operations.test.mvm.js:1:1
    // ---
    // description: >
    // Tests various operations that should classify as vm_TeNumberOp operations
    // runExportedFunction: 0
    // assertionCount: 156
    // ---
    LoadGlobal(name 'vmExport');         // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:7:1
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:7:1
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:7:10
    LoadVar(index 0);                    // 5  run            ./test/end-to-end/tests/number-operations.test.mvm.js:7:13
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:7:13
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:260:1
    Return();                            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:260:1
}

function run() {
  entry:
    LoadGlobal(name 'testNegate');       // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:10:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:10:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:10:3
    LoadGlobal(name 'testUnaryPlus');    // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:11:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:11:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:11:3
    LoadGlobal(name 'testAddition');     // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:12:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:12:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:12:3
    LoadGlobal(name 'testSubtraction');  // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:13:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:13:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:13:3
    LoadGlobal(name 'testMultiplication'); // 1               ./test/end-to-end/tests/number-operations.test.mvm.js:14:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:14:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:14:3
    LoadGlobal(name 'testDivision');     // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:15:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:15:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:15:3
    LoadGlobal(name 'testLessThan');     // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:16:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:16:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:16:3
    LoadGlobal(name 'testGreaterThan');  // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:17:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:17:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:17:3
    LoadGlobal(name 'testRemainder');    // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:18:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:18:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:18:3
    LoadGlobal(name 'testPower');        // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:19:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:19:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:19:3
    LoadGlobal(name 'testIncrDecr');     // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:20:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:20:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:20:3
    LoadGlobal(name 'testStringToInt');  // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:21:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:21:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:21:3
    LoadGlobal(name 'testIntToString');  // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:22:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:22:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:22:3
    LoadGlobal(name 'testFloatToString'); // 1                ./test/end-to-end/tests/number-operations.test.mvm.js:23:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:23:3
    Call(count 1, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:23:3
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:24:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:24:2
}

function testNegate() {
  entry:
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:27:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:27:3
    Literal(lit -1);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:27:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:27:19
    Literal(lit 3);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:27:23
    BinOp(op '-');                       // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:27:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:27:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:28:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:28:3
    LoadGlobal(name 'Infinity');         // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:28:16
    UnOp(op '-');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:28:16
    Literal(lit -1.1);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:28:26
    Literal(lit 0);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:28:33
    BinOp(op '/');                       // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:28:33
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:28:33
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:3
    Literal(lit -2147483648);            // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:17
    UnOp(op '-');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:17
    LoadGlobal(name 'overflowChecks');   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:31
    Branch(@block1, @block2);            // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:31
  block1:
    Literal(lit 2147483648);             // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:48
    Jump(@block3);                       // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:48
  block2:
    Literal(lit -2147483648);            // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:61
    Jump(@block3);                       // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:61
  block3:
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:29:61
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:30:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:30:2
}

function testUnaryPlus() {
  entry:
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:33:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:33:3
    Literal(lit 1);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:33:17
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:33:21
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:33:21
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:33:21
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:33:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:33:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:34:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:34:3
    Literal(lit 1.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:34:17
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:34:23
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:34:23
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:34:23
    Literal(lit 3.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:34:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:34:27
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:35:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:35:2
}

function testAddition() {
  entry:
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:38:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:38:3
    Literal(lit 3);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:38:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:38:19
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:38:19
    Literal(lit 5);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:38:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:38:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:39:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:39:3
    Literal(lit 3000);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:39:15
    Literal(lit 2000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:39:23
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:39:23
    Literal(lit 5000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:39:30
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:39:30
    // out of 8 bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:40:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:40:3
    Literal(lit 3000);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:40:15
    Literal(lit 3500);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:40:23
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:40:23
    Literal(lit 6500);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:40:30
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:40:30
    // 12 bit addition (should not overflow, but should take the fast path still)
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:41:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:41:3
    Literal(lit 6000);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:41:15
    Literal(lit 500);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:41:23
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:41:23
    Literal(lit 6500);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:41:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:41:28
    // 13 bit addition. Does not technically overflow but should take the slow path
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:42:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:42:3
    Literal(lit 500);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:42:15
    Literal(lit 6500);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:42:21
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:42:21
    Literal(lit 7000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:42:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:42:28
    // 13 bit addition. Does not technically overflow but should take the slow path
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:43:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:43:3
    Literal(lit 10000);                  // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:43:15
    Literal(lit 8000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:43:24
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:43:24
    Literal(lit 18000);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:43:31
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:43:31
    // out of 14 bit signed range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:44:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:44:3
    Literal(lit 80000);                  // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:44:15
    Literal(lit 70000);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:44:24
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:44:24
    Literal(lit 150000);                 // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:44:32
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:44:32
    // out of 16 bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:45:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:45:3
    Literal(lit 7500);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:45:15
    Literal(lit 7000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:45:23
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:45:23
    Literal(lit 14500);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:45:30
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:45:30
    // overflow 14-bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:3
    Literal(lit 2000000000);             // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:15
    Literal(lit 2000000000);             // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:31
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:31
    LoadGlobal(name 'overflowChecks');   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:46
    Branch(@block4, @block5);            // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:46
  block4:
    Literal(lit 4000000000);             // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:63
    Jump(@block6);                       // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:63
  block5:
    Literal(lit -294967296);             // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:79
    Jump(@block6);                       // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:79
  block6:
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:46:79
    // overflow signed 32-bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:47:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:47:3
    Literal(lit -1.5);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:47:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:47:22
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:47:22
    Literal(lit -0.5);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:47:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:47:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:48:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:48:3
    Literal(lit -2);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:48:15
    Literal(lit 0.5);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:48:20
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:48:20
    Literal(lit -1.5);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:48:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:48:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:49:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:49:3
    Literal(lit -5000000000);            // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:49:15
    Literal(lit 4999999000);             // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:49:32
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:49:32
    Literal(lit -1000);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:49:47
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:49:47
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:50:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:50:2
}

function testSubtraction() {
  entry:
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:53:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:53:3
    Literal(lit 3);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:53:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:53:19
    BinOp(op '-');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:53:19
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:53:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:53:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:54:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:54:3
    Literal(lit 3000);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:54:15
    Literal(lit 2000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:54:23
    BinOp(op '-');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:54:23
    Literal(lit 1000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:54:30
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:54:30
    // out of 8 bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:55:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:55:3
    Literal(lit 10000);                  // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:55:15
    Literal(lit 8000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:55:24
    BinOp(op '-');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:55:24
    Literal(lit 2000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:55:31
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:55:31
    // out of 14 bit signed range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:56:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:56:3
    Literal(lit 80000);                  // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:56:15
    Literal(lit 70000);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:56:24
    BinOp(op '-');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:56:24
    Literal(lit 10000);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:56:32
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:56:32
    // out of 16 bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:57:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:57:3
    Literal(lit -7500);                  // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:57:15
    Literal(lit 7000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:57:24
    BinOp(op '-');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:57:24
    Literal(lit -14500);                 // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:57:31
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:57:31
    // underflow 14-bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:3
    Literal(lit -2000000000);            // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:15
    Literal(lit 2000000000);             // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:32
    BinOp(op '-');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:32
    LoadGlobal(name 'overflowChecks');   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:47
    Branch(@block7, @block8);            // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:47
  block7:
    Literal(lit -4000000000);            // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:64
    Jump(@block9);                       // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:64
  block8:
    Literal(lit 294967296);              // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:81
    Jump(@block9);                       // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:81
  block9:
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:58:81
    // underflow signed 32-bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:59:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:59:3
    Literal(lit 1.5);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:59:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:59:21
    BinOp(op '-');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:59:21
    Literal(lit 0.5);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:59:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:59:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:60:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:60:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:60:15
    Literal(lit 0.5);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:60:19
    BinOp(op '-');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:60:19
    Literal(lit 1.5);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:60:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:60:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:61:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:61:3
    Literal(lit 5000000000);             // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:61:15
    Literal(lit 4999999000);             // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:61:31
    BinOp(op '-');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:61:31
    Literal(lit 1000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:61:46
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:61:46
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:62:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:62:2
}

function testMultiplication() {
  entry:
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:65:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:65:3
    Literal(lit 5);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:65:15
    Literal(lit 6);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:65:19
    BinOp(op '*');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:65:19
    Literal(lit 30);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:65:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:65:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:66:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:66:3
    Literal(lit 5.5);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:66:15
    Literal(lit 6);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:66:21
    BinOp(op '*');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:66:21
    Literal(lit 33);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:66:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:66:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:67:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:67:3
    Literal(lit -5);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:67:16
    Literal(lit -6);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:67:23
    BinOp(op '*');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:67:23
    Literal(lit 30);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:67:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:67:28
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:68:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:68:3
    Literal(lit 5);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:68:15
    Literal(lit -6);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:68:20
    BinOp(op '*');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:68:20
    Literal(lit -30);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:68:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:68:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:70:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:70:3
    Literal(lit 5000);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:70:15
    Literal(lit 5000);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:70:23
    BinOp(op '*');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:70:23
    Literal(lit 25000000);               // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:70:30
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:70:30
    // Overflow 14-bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:71:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:71:3
    Literal(lit 17000);                  // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:71:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:71:24
    BinOp(op '*');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:71:24
    Literal(lit 34000);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:71:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:71:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:3
    Literal(lit 5000000);                // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:15
    Literal(lit 5000000);                // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:27
    BinOp(op '*');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:27
    LoadGlobal(name 'overflowChecks');   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:38
    Branch(@block10, @block11);          // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:38
  block10:
    Literal(lit 25000000000000);         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:55
    Jump(@block12);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:55
  block11:
    Literal(lit -1004630016);            // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:76
    Jump(@block12);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:76
  block12:
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:72:76
    // Overflow 32-bit range
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:73:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:73:3
    Literal(lit 25000000000000);         // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:73:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:73:36
    BinOp(op '*');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:73:36
    Literal(lit 25000000000000);         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:73:39
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:73:39
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:74:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:74:2
}

function testDivision() {
  entry:
    // Floating point division (the normal)
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:78:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:78:3
    Literal(lit 6);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:78:15
    Literal(lit 3);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:78:19
    BinOp(op '/');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:78:19
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:78:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:78:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:79:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:79:3
    Literal(lit 7);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:79:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:79:19
    BinOp(op '/');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:79:19
    Literal(lit 3.5);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:79:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:79:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:80:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:80:3
    Literal(lit 8.5);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:80:15
    Literal(lit 2.5);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:80:21
    BinOp(op '/');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:80:21
    Literal(lit 3.4);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:80:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:80:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:81:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:81:3
    Literal(lit 8);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:81:15
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:81:19
    BinOp(op '/');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:81:19
    LoadGlobal(name 'Infinity');         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:81:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:81:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:82:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:82:3
    Literal(lit 8);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:82:15
    Literal(lit -0);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:82:19
    BinOp(op '/');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:82:19
    LoadGlobal(name 'Infinity');         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:82:24
    UnOp(op '-');                        // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:82:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:82:24
    // Without overflow checks enabled, the negation of integer zero is integer zero
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:3
    Literal(lit 8);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:21
    Literal(lit 1);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:23
    BinOp(op '-');                       // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:23
    UnOp(op '-');                        // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:23
    BinOp(op '/');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:23
    LoadGlobal(name 'overflowChecks');   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:27
    Branch(@block13, @block14);          // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:27
  block13:
    LoadGlobal(name 'Infinity');         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:45
    UnOp(op '-');                        // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:45
    Jump(@block15);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:45
  block14:
    LoadGlobal(name 'Infinity');         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:56
    Jump(@block15);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:56
  block15:
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:84:56
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:85:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:85:3
    Literal(lit -8);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:85:15
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:85:20
    BinOp(op '/');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:85:20
    LoadGlobal(name 'Infinity');         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:85:24
    UnOp(op '-');                        // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:85:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:85:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:86:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:86:3
    Literal(lit -8);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:86:15
    Literal(lit -0);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:86:20
    BinOp(op '/');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:86:20
    LoadGlobal(name 'Infinity');         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:86:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:86:24
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:10
    LoadGlobal(name 'Infinity');         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:23
    LoadGlobal(name 'Infinity');         // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:34
    BinOp(op '/');                       // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:34
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:34
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:87:34
    // Integer division
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:90:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:90:3
    Literal(lit 6);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:90:15
    Literal(lit 3);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:90:19
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:90:19
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:90:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:90:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:91:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:91:3
    Literal(lit 7);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:91:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:91:19
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:91:19
    Literal(lit 3);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:91:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:91:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:92:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:92:3
    Literal(lit 8.5);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:92:16
    Literal(lit 2.5);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:92:22
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:92:22
    Literal(lit 3);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:92:32
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:92:32
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:93:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:93:3
    Literal(lit -6);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:93:15
    Literal(lit -3);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:93:20
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:93:20
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:93:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:93:28
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:94:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:94:3
    Literal(lit -7);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:94:15
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:94:20
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:94:20
    Literal(lit 3);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:94:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:94:28
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:95:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:95:3
    Literal(lit -8.5);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:95:16
    Literal(lit -2.5);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:95:23
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:95:23
    Literal(lit 3);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:95:34
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:95:34
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:96:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:96:3
    Literal(lit -6);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:96:15
    Literal(lit 3);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:96:20
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:96:20
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:96:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:96:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:97:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:97:3
    Literal(lit -7);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:97:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:97:20
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:97:20
    Literal(lit -3);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:97:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:97:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:98:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:98:3
    Literal(lit -8.5);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:98:16
    Literal(lit 2.5);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:98:23
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:98:23
    Literal(lit -3);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:98:33
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:98:33
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:99:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:99:3
    Literal(lit 8);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:99:15
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:99:19
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:99:19
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:99:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:99:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:100:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:100:3
    Literal(lit 8);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:100:15
    Literal(lit -0);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:100:19
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:100:19
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:100:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:100:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:101:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:101:3
    Literal(lit -8);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:101:15
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:101:20
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:101:20
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:101:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:101:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:102:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:102:3
    Literal(lit -8);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:102:15
    Literal(lit -0);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:102:20
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:102:20
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:102:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:102:28
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:103:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:103:3
    LoadGlobal(name 'NaN');              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:103:15
    LoadGlobal(name 'NaN');              // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:103:21
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:103:21
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:103:30
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:103:30
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:104:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:104:3
    LoadGlobal(name 'Infinity');         // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:104:15
    LoadGlobal(name 'Infinity');         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:104:26
    BinOp(op 'DIVIDE_AND_TRUNC');        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:104:26
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:104:40
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:104:40
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:105:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:105:2
}

function testLessThan() {
  entry:
    // String pairs compare by UTF-16 code unit, not by numeric coercion.
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:109:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:109:3
    Literal(lit '10');                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:109:15
    Literal(lit '2');                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:109:22
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:109:22
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:109:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:109:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:110:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:110:3
    Literal(lit 'b');                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:110:15
    Literal(lit 'aa');                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:110:22
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:110:22
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:110:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:110:28
    // UTF-16 ordering differs from Unicode code-point ordering for this pair.
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:112:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:112:3
    Literal(lit '𐀀');                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:112:15
    Literal(lit '');                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:112:29
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:112:29
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:112:39
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:112:39
    // Integers
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:115:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:115:3
    Literal(lit 1);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:115:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:115:19
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:115:19
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:115:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:115:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:116:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:116:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:116:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:116:19
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:116:19
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:116:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:116:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:117:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:117:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:117:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:117:19
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:117:19
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:117:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:117:22
    // Negative integers
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:120:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:120:3
    Literal(lit -1);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:120:15
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:120:20
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:120:20
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:120:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:120:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:121:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:121:3
    Literal(lit -2);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:121:15
    Literal(lit -1);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:121:20
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:121:20
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:121:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:121:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:122:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:122:3
    Literal(lit -2);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:122:15
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:122:20
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:122:20
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:122:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:122:24
    // Floating point
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:125:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:125:3
    Literal(lit 1.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:125:15
    Literal(lit 2.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:125:21
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:125:21
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:125:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:125:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:126:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:126:3
    Literal(lit 2.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:126:15
    Literal(lit 1.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:126:21
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:126:21
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:126:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:126:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:127:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:127:3
    Literal(lit 2.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:127:15
    Literal(lit 2.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:127:21
    BinOp(op '<');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:127:21
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:127:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:127:26
    // Integers
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:130:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:130:3
    Literal(lit 1);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:130:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:130:20
    BinOp(op '<=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:130:20
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:130:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:130:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:131:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:131:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:131:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:131:20
    BinOp(op '<=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:131:20
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:131:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:131:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:132:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:132:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:132:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:132:20
    BinOp(op '<=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:132:20
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:132:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:132:23
    // Negative integers
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:135:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:135:3
    Literal(lit -1);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:135:15
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:135:21
    BinOp(op '<=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:135:21
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:135:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:135:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:136:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:136:3
    Literal(lit -2);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:136:15
    Literal(lit -1);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:136:21
    BinOp(op '<=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:136:21
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:136:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:136:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:137:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:137:3
    Literal(lit -2);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:137:15
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:137:21
    BinOp(op '<=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:137:21
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:137:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:137:25
    // Floating point
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:140:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:140:3
    Literal(lit 1.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:140:15
    Literal(lit 2.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:140:22
    BinOp(op '<=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:140:22
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:140:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:140:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:141:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:141:3
    Literal(lit 2.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:141:15
    Literal(lit 1.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:141:22
    BinOp(op '<=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:141:22
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:141:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:141:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:142:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:142:3
    Literal(lit 2.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:142:15
    Literal(lit 2.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:142:22
    BinOp(op '<=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:142:22
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:142:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:142:27
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:143:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:143:2
}

function testGreaterThan() {
  entry:
    // Integers
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:147:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:147:3
    Literal(lit 1);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:147:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:147:19
    BinOp(op '>');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:147:19
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:147:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:147:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:148:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:148:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:148:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:148:19
    BinOp(op '>');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:148:19
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:148:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:148:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:149:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:149:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:149:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:149:19
    BinOp(op '>');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:149:19
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:149:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:149:22
    // Negative integers
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:152:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:152:3
    Literal(lit -1);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:152:15
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:152:20
    BinOp(op '>');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:152:20
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:152:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:152:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:153:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:153:3
    Literal(lit -2);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:153:15
    Literal(lit -1);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:153:20
    BinOp(op '>');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:153:20
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:153:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:153:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:154:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:154:3
    Literal(lit -2);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:154:15
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:154:20
    BinOp(op '>');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:154:20
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:154:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:154:24
    // Floating point
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:157:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:157:3
    Literal(lit 1.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:157:15
    Literal(lit 2.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:157:21
    BinOp(op '>');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:157:21
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:157:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:157:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:158:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:158:3
    Literal(lit 2.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:158:15
    Literal(lit 1.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:158:21
    BinOp(op '>');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:158:21
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:158:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:158:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:159:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:159:3
    Literal(lit 2.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:159:15
    Literal(lit 2.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:159:21
    BinOp(op '>');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:159:21
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:159:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:159:26
    // Integers
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:162:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:162:3
    Literal(lit 1);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:162:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:162:20
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:162:20
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:162:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:162:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:163:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:163:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:163:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:163:20
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:163:20
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:163:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:163:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:164:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:164:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:164:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:164:20
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:164:20
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:164:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:164:23
    // Negative integers
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:167:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:167:3
    Literal(lit -1);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:167:15
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:167:21
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:167:21
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:167:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:167:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:168:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:168:3
    Literal(lit -2);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:168:15
    Literal(lit -1);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:168:21
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:168:21
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:168:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:168:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:169:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:169:3
    Literal(lit -2);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:169:15
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:169:21
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:169:21
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:169:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:169:25
    // Floating point
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:172:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:172:3
    Literal(lit 1.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:172:15
    Literal(lit 2.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:172:22
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:172:22
    Literal(lit false);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:172:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:172:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:173:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:173:3
    Literal(lit 2.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:173:15
    Literal(lit 1.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:173:22
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:173:22
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:173:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:173:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:174:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:174:3
    Literal(lit 2.1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:174:15
    Literal(lit 2.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:174:22
    BinOp(op '>=');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:174:22
    Literal(lit true);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:174:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:174:27
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:175:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:175:2
}

function testRemainder() {
  entry:
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:178:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:178:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:178:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:178:19
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:178:19
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:178:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:178:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:179:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:179:3
    Literal(lit 5);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:179:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:179:19
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:179:19
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:179:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:179:22
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:180:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:180:3
    Literal(lit 550);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:180:15
    Literal(lit 100);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:180:21
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:180:21
    Literal(lit 50);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:180:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:180:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:182:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:182:3
    Literal(lit -8);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:182:15
    Literal(lit 3);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:182:20
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:182:20
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:182:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:182:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:183:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:183:3
    Literal(lit 8);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:183:15
    Literal(lit -3);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:183:19
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:183:19
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:183:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:183:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:184:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:184:3
    Literal(lit -8);                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:184:15
    Literal(lit -3);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:184:20
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:184:20
    Literal(lit -2);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:184:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:184:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:186:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:186:3
    Literal(lit 2.25);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:186:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:186:22
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:186:22
    Literal(lit 0.25);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:186:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:186:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:187:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:187:3
    Literal(lit 5.25);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:187:15
    Literal(lit 2);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:187:22
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:187:22
    Literal(lit 1.25);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:187:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:187:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:188:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:188:3
    Literal(lit 550.25);                 // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:188:15
    Literal(lit 100);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:188:24
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:188:24
    Literal(lit 50.25);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:188:29
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:188:29
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:190:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:190:3
    Literal(lit -7.25);                  // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:190:15
    Literal(lit 4);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:190:23
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:190:23
    Literal(lit -3.25);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:190:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:190:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:191:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:191:3
    Literal(lit 7.25);                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:191:15
    Literal(lit -4);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:191:22
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:191:22
    Literal(lit 3.25);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:191:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:191:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:192:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:192:3
    Literal(lit -7.25);                  // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:192:15
    Literal(lit -4);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:192:23
    BinOp(op '%');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:192:23
    Literal(lit -3.25);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:192:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:192:27
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:10
    Literal(lit 5);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:23
    Literal(lit 0);                      // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:27
    BinOp(op '%');                       // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:27
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:27
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:194:27
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:10
    Literal(lit 5.1);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:23
    Literal(lit 0);                      // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:29
    BinOp(op '%');                       // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:29
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:29
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:195:29
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:196:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:196:2
}

function testPower() {
  entry:
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:199:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:199:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:199:15
    Literal(lit 3);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:199:20
    BinOp(op '**');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:199:20
    Literal(lit 8);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:199:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:199:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:200:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:200:3
    Literal(lit 2);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:200:15
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:200:20
    BinOp(op '**');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:200:20
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:200:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:200:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:201:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:201:3
    Literal(lit 2.5);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:201:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:201:22
    BinOp(op '**');                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:201:22
    Literal(lit 2.5);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:201:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:201:25
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:10
    Literal(lit 1);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:23
    LoadGlobal(name 'Infinity');         // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:28
    BinOp(op '**');                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:28
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:28
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:202:28
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:203:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:203:2
}

function testIncrDecr() {
  entry:
    Literal(lit deleted);                // 1  x              ./test/end-to-end/tests/number-operations.test.mvm.js:205:25
    Literal(lit 1);                      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:206:11
    StoreVar(index 0);                   // 1  x              ./test/end-to-end/tests/number-operations.test.mvm.js:206:11
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:207:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:207:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:207:15
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:207:15
    NumericUnOp(op '++', numeric type 'f64' (default context)); // 5  ./test/end-to-end/tests/number-operations.test.mvm.js:207:15
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:207:15
    StoreVar(index 0);                   // 5  x              ./test/end-to-end/tests/number-operations.test.mvm.js:207:15
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:207:15
    Literal(lit 1);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:207:20
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:207:20
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:208:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:208:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:208:15
    Literal(lit 2);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:208:18
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:208:18
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:209:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:209:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:209:15
    NumericUnOp(op '++', numeric type 'f64' (default context)); // 4  ./test/end-to-end/tests/number-operations.test.mvm.js:209:15
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:209:15
    StoreVar(index 0);                   // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:209:15
    Literal(lit 3);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:209:20
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:209:20
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:210:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:210:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:210:15
    Literal(lit 3);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:210:18
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:210:18
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:211:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:211:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:211:15
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:211:15
    NumericUnOp(op '--', numeric type 'f64' (default context)); // 5  ./test/end-to-end/tests/number-operations.test.mvm.js:211:15
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:211:15
    StoreVar(index 0);                   // 5  x              ./test/end-to-end/tests/number-operations.test.mvm.js:211:15
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:211:15
    Literal(lit 3);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:211:20
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:211:20
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:212:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:212:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:212:15
    Literal(lit 2);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:212:18
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:212:18
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:213:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:213:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:213:15
    NumericUnOp(op '--', numeric type 'f64' (default context)); // 4  ./test/end-to-end/tests/number-operations.test.mvm.js:213:15
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:213:15
    StoreVar(index 0);                   // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:213:15
    Literal(lit 1);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:213:20
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:213:20
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:214:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:214:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:214:15
    Literal(lit 1);                      // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:214:18
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:214:18
    Literal(lit 1.5);                    // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:216:7
    LoadVar(index 1);                    // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:216:7
    StoreVar(index 0);                   // 2  x              ./test/end-to-end/tests/number-operations.test.mvm.js:216:7
    Pop(count 1);                        // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:216:7
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:217:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:217:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:217:15
    NumericUnOp(op '++', numeric type 'f64' (default context)); // 4  ./test/end-to-end/tests/number-operations.test.mvm.js:217:15
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:217:15
    StoreVar(index 0);                   // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:217:15
    Literal(lit 2.5);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:217:20
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:217:20
    LoadGlobal(name 'assertEqual');      // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:218:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:218:3
    LoadVar(index 0);                    // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:218:15
    NumericUnOp(op '--', numeric type 'f64' (default context)); // 4  ./test/end-to-end/tests/number-operations.test.mvm.js:218:15
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:218:15
    StoreVar(index 0);                   // 4  x              ./test/end-to-end/tests/number-operations.test.mvm.js:218:15
    Literal(lit 1.5);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:218:20
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:218:20
    Pop(count 1);                        // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:219:2
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:219:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:219:2
}

function testStringToInt() {
  entry:
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:10
    Literal(lit 'x');                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:24
    UnOp(op '+');                        // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:24
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:24
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:222:24
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:10
    Literal(lit 'length');               // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:24
    UnOp(op '+');                        // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:24
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:24
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:223:24
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:10
    Literal(lit '__proto__');            // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:24
    UnOp(op '+');                        // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:24
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:24
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:224:24
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:10
    Literal(lit '1a');                   // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:24
    UnOp(op '+');                        // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:24
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:24
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:225:24
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:10
    Literal(lit '1.1.1');                // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:24
    UnOp(op '+');                        // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:24
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:24
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:226:24
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:10
    Literal(lit '123456789123456789.1.1'); // 5               ./test/end-to-end/tests/number-operations.test.mvm.js:227:24
    UnOp(op '+');                        // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:24
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:24
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:227:24
    LoadGlobal(name 'assert');           // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:3
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:10
    LoadGlobal(name 'Number');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:10
    LoadVar(index 3);                    // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:10
    Literal(lit 'isNaN');                // 6                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:10
    ObjectGet();                         // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:10
    StoreVar(index 2);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:10
    Literal(lit '123\u0000');            // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:24
    UnOp(op '+');                        // 5                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:24
    Call(count 2, flag false);           // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:24
    Call(count 2, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:228:24
    // Empty string
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:231:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:231:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:231:16
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:231:16
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:231:20
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:231:20
    // Whitespace
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:234:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:234:3
    Literal(lit '  ');                   // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:234:16
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:234:16
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:234:22
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:234:22
    // Small integers
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:237:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:237:3
    Literal(lit '123');                  // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:237:16
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:237:16
    Literal(lit 123);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:237:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:237:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:238:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:238:3
    Literal(lit '-123');                 // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:238:16
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:238:16
    Literal(lit -123);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:238:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:238:24
    // Leading and trailing whitespace
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:241:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:241:3
    Literal(lit '  123   ');             // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:241:16
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:241:16
    Literal(lit 123);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:241:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:241:28
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:242:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:242:3
    Literal(lit '  -123   ');            // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:242:16
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:242:16
    Literal(lit -123);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:242:29
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:242:29
    // Int32
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:245:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:245:3
    Literal(lit '12345678');             // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:245:16
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:245:16
    Literal(lit 12345678);               // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:245:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:245:28
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:246:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:246:3
    Literal(lit '-12345678');            // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:246:16
    UnOp(op '+');                        // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:246:16
    Literal(lit -12345678);              // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:246:29
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:246:29
    // Multiply
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:249:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:249:3
    Literal(lit 1);                      // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:249:15
    Literal(lit '123');                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:249:19
    BinOp(op '*');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:249:19
    Literal(lit 123);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:249:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:249:26
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:250:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:250:2
}

function testIntToString() {
  entry:
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:253:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:253:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:253:15
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:253:20
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:253:20
    Literal(lit '0');                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:253:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:253:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:254:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:254:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:254:15
    Literal(lit 1);                      // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:254:20
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:254:20
    Literal(lit '1');                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:254:23
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:254:23
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:255:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:255:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:255:15
    Literal(lit -1);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:255:20
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:255:20
    Literal(lit '-1');                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:255:24
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:255:24
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:256:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:256:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:256:15
    Literal(lit 2147483647);             // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:256:21
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:256:21
    Literal(lit '2147483647');           // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:256:34
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:256:34
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:257:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:257:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:257:15
    Literal(lit -2147483648);            // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:257:21
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:257:21
    Literal(lit '-2147483648');          // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:257:35
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:257:35
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:258:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:258:2
}

function testFloatToString() {
  entry:
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:261:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:261:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:261:15
    LoadGlobal(name 'NaN');              // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:261:20
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:261:20
    Literal(lit 'NaN');                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:261:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:261:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:262:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:262:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:262:15
    LoadGlobal(name 'Infinity');         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:262:20
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:262:20
    Literal(lit 'Infinity');             // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:262:30
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:262:30
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:263:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:263:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:263:15
    LoadGlobal(name 'Infinity');         // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:263:22
    UnOp(op '-');                        // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:263:22
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:263:22
    Literal(lit '-Infinity');            // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:263:33
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:263:33
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:264:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:264:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:264:15
    Literal(lit -0);                     // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:264:21
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:264:21
    Literal(lit '0');                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:264:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:264:28
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:265:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:265:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:265:15
    Literal(lit 0.1);                    // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:265:20
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:265:20
    Literal(lit '0.1');                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:265:25
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:265:25
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:266:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:266:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:266:15
    Literal(lit -0.1);                   // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:266:21
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:266:21
    Literal(lit '-0.1');                 // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:266:28
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:266:28
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:267:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:267:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:267:15
    Literal(lit 1e+30);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:267:20
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:267:20
    Literal(lit '1e+30');                // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:267:26
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:267:26
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:268:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:268:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:268:15
    Literal(lit -1e+30);                 // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:268:21
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:268:21
    Literal(lit '-1e+30');               // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:268:29
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:268:29
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:269:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:269:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:269:15
    Literal(lit 1e-30);                  // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:269:20
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:269:20
    Literal(lit '1e-30');                // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:269:27
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:269:27
    LoadGlobal(name 'assertEqual');      // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:270:3
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/number-operations.test.mvm.js:270:3
    Literal(lit '');                     // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:270:15
    Literal(lit -1e-30);                 // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:270:21
    BinOp(op '+');                       // 3                 ./test/end-to-end/tests/number-operations.test.mvm.js:270:21
    Literal(lit '-1e-30');               // 4                 ./test/end-to-end/tests/number-operations.test.mvm.js:270:30
    Call(count 3, flag true);            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:270:30
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/number-operations.test.mvm.js:271:2
    Return();                            // 0                 ./test/end-to-end/tests/number-operations.test.mvm.js:271:2
}