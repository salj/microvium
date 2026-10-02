unit ['./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js'];

entry ['#entry'];

external vmExport from free-variable 'vmExport';
external assertEqual from free-variable 'assertEqual';

global thisModule;

function ['#entry']() {
  entry:
    LoadArg(index 0);                    // 1                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:1:1
    StoreGlobal(name 'thisModule');      // 0                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:1:1
    Literal(lit &function run);          // 1                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:1:1
    // ---
    // runExportedFunction: 0
    // description: Supports omitted initializer, test, and update parts of for loops
    // assertionCount: 4
    // dontCompareDisassembly: true
    // ---
    LoadGlobal(name 'vmExport');         // 2                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:7:1
    Literal(lit undefined);              // 3                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:7:1
    Literal(lit 0);                      // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:7:10
    LoadVar(index 0);                    // 5  run            ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:7:13
    Call(count 3, flag true);            // 1                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:7:13
    Literal(lit undefined);              // 2                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:9:1
    Return();                            // 1                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:9:1
}

function run() {
  entry:
    Literal(lit deleted);                // 1  i              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:9:16
    Literal(lit deleted);                // 2  j              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:9:16
    Literal(lit deleted);                // 3  k              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:9:16
    Literal(lit deleted);                // 4  m              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:9:16
    Literal(lit 0);                      // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:10:11
    StoreVar(index 0);                   // 4  i              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:10:11
    Jump(@block1);                       // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:3
  block1:
    LoadVar(index 0);                    // 5  i              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:10
    Literal(lit 3);                      // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:14
    BinOp(op '<');                       // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:14
    Branch(@block2, @block3);            // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:14
  block2:
    LoadVar(index 0);                    // 5  i              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:17
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:17
    NumericUnOp(op '++', numeric type 'f64' (default context)); // 6  ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:17
    LoadVar(index 5);                    // 7                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:17
    StoreVar(index 0);                   // 6  i              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:17
    Pop(count 1);                        // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:17
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:17
    Jump(@block1);                       // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:11:17
  block3:
    LoadGlobal(name 'assertEqual');      // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:12:3
    Literal(lit undefined);              // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:12:3
    LoadVar(index 0);                    // 7  i              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:12:15
    Literal(lit 3);                      // 8                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:12:18
    Call(count 3, flag true);            // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:12:18
    Literal(lit 0);                      // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:14:11
    StoreVar(index 1);                   // 4  j              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:14:11
    Jump(@block4);                       // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:15:3
  block4:
    LoadVar(index 1);                    // 5  j              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:15:10
    Literal(lit 3);                      // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:15:14
    BinOp(op '<');                       // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:15:14
    Branch(@block5, @block6);            // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:15:14
  block5:
    LoadVar(index 1);                    // 5  j              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:16:5
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:16:5
    NumericUnOp(op '++', numeric type 'f64' (default context)); // 6  ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:16:5
    LoadVar(index 5);                    // 7                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:16:5
    StoreVar(index 1);                   // 6  j              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:16:5
    Pop(count 1);                        // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:16:5
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:16:5
    Jump(@block4);                       // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:17:4
  block6:
    LoadGlobal(name 'assertEqual');      // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:18:3
    Literal(lit undefined);              // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:18:3
    LoadVar(index 1);                    // 7  j              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:18:15
    Literal(lit 3);                      // 8                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:18:18
    Call(count 3, flag true);            // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:18:18
    Literal(lit 0);                      // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:20:11
    StoreVar(index 2);                   // 4  k              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:20:11
    Literal(lit 0);                      // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:12
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:12
    StoreVar(index 2);                   // 5  k              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:12
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:12
    Jump(@block7);                       // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:12
  block7:
    Jump(@block8);                       // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:12
  block8:
    LoadVar(index 2);                    // 5  k              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:22:9
    Literal(lit 2);                      // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:22:15
    BinOp(op '===');                     // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:22:15
    Branch(@block9, @block10);           // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:22:9
  block9:
    Jump(@block11);                      // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:22:18
  block10:
    LoadVar(index 2);                    // 5  k              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:17
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:17
    NumericUnOp(op '++', numeric type 'f64' (default context)); // 6  ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:17
    LoadVar(index 5);                    // 7                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:17
    StoreVar(index 2);                   // 6  k              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:17
    Pop(count 1);                        // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:17
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:17
    Jump(@block7);                       // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:21:17
  block11:
    LoadGlobal(name 'assertEqual');      // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:24:3
    Literal(lit undefined);              // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:24:3
    LoadVar(index 2);                    // 7  k              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:24:15
    Literal(lit 2);                      // 8                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:24:18
    Call(count 3, flag true);            // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:24:18
    Literal(lit 0);                      // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:26:11
    StoreVar(index 3);                   // 4  m              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:26:11
    Jump(@block12);                      // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:27:3
  block12:
    Jump(@block13);                      // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:27:3
  block13:
    LoadVar(index 3);                    // 5  m              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:28:5
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:28:5
    NumericUnOp(op '++', numeric type 'f64' (default context)); // 6  ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:28:5
    LoadVar(index 5);                    // 7                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:28:5
    StoreVar(index 3);                   // 6  m              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:28:5
    Pop(count 1);                        // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:28:5
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:28:5
    LoadVar(index 3);                    // 5  m              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:29:9
    Literal(lit 3);                      // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:29:15
    BinOp(op '===');                     // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:29:15
    Branch(@block14, @block15);          // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:29:9
  block14:
    Jump(@block16);                      // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:29:18
  block15:
    Jump(@block12);                      // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:30:4
  block16:
    LoadGlobal(name 'assertEqual');      // 5                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:31:3
    Literal(lit undefined);              // 6                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:31:3
    LoadVar(index 3);                    // 7  m              ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:31:15
    Literal(lit 3);                      // 8                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:31:18
    Call(count 3, flag true);            // 4                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:31:18
    Pop(count 4);                        // 0                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:32:2
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:32:2
    Return();                            // 0                 ./test/end-to-end/tests/for-statement-omitted-clauses.test.mvm.js:32:2
}