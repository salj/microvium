unit ['./test/end-to-end/tests/uint8Array.test.mvm.js'];

entry ['#entry'];

external vmExport from free-variable 'vmExport';
external Microvium from free-variable 'Microvium';
external assertEqual from free-variable 'assertEqual';
external undefined from free-variable 'undefined';

global thisModule;
global buf1;

function ['#entry']() {
  entry:
    LoadArg(index 0);                    // 1                 ./test/end-to-end/tests/uint8Array.test.mvm.js:1:1
    StoreGlobal(name 'thisModule');      // 0                 ./test/end-to-end/tests/uint8Array.test.mvm.js:1:1
    Literal(lit &function run);          // 1                 ./test/end-to-end/tests/uint8Array.test.mvm.js:1:1
    Literal(lit deleted);                // 2  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:1:1
    Literal(lit deleted);                // 3  emptyBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:1:1
    // ---
    // description: Tests of Uint8Array
    // runExportedFunction: 0
    // assertionCount: 17
    // ---
    LoadGlobal(name 'vmExport');         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:6:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:6:1
    Literal(lit 0);                      // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:6:10
    LoadVar(index 0);                    // 7  run            ./test/end-to-end/tests/uint8Array.test.mvm.js:6:13
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:6:13
    Literal(lit undefined);              // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:8:14
    LoadGlobal(name 'Microvium');        // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:8:14
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:8:14
    Literal(lit 'newUint8Array');        // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:8:14
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:8:14
    StoreVar(index 3);                   // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:8:14
    Literal(lit 5);                      // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:8:38
    Call(count 2, flag false);           // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:8:38
    StoreGlobal(name 'buf1');            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:8:38
    Literal(lit deleted);                // 4  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:9:1
    Literal(lit 0);                      // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:14
    StoreVar(index 3);                   // 4  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:9:14
    Jump(@block1);                       // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:14
  block1:
    LoadVar(index 3);                    // 5  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:9:17
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:21
    Literal(lit 'length');               // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:21
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:21
    BinOp(op '<');                       // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:21
    Branch(@block2, @block3);            // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:21
  block2:
    LoadVar(index 3);                    // 5  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:10:13
    Literal(lit 1);                      // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:10:17
    BinOp(op '+');                       // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:10:17
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:10:3
    LoadVar(index 3);                    // 7  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:10:8
    LoadVar(index 4);                    // 8                 ./test/end-to-end/tests/uint8Array.test.mvm.js:10:8
    ObjectSet();                         // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:10:8
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:10:8
    LoadVar(index 3);                    // 5  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:9:34
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:34
    NumericUnOp(op '++', numeric type 'f64' (default context)); // 6  ./test/end-to-end/tests/uint8Array.test.mvm.js:9:34
    LoadVar(index 5);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:34
    StoreVar(index 3);                   // 6  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:9:34
    Pop(count 1);                        // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:34
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:34
    Jump(@block1);                       // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:9:34
  block3:
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:10:19
    // Writing to Uint8Array at compile-time
    // Reading from Uint8Array at compile-time
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:13:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:13:1
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:13:13
    Literal(lit 'length');               // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:13:13
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:13:13
    Literal(lit 5);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:13:26
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:13:26
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:14:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:14:1
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:14:13
    Literal(lit 0);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:14:18
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:14:18
    Literal(lit 1);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:14:22
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:14:22
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:15:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:15:1
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:15:13
    Literal(lit 4);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:15:18
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:15:18
    Literal(lit 5);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:15:22
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:15:22
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:16:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:16:1
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:16:13
    Literal(lit 5);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:16:18
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:16:18
    Literal(lit undefined);              // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:16:22
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:16:22
    Literal(lit undefined);              // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:18:18
    LoadGlobal(name 'Microvium');        // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:18:18
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:18:18
    Literal(lit 'newUint8Array');        // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:18:18
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:18:18
    StoreVar(index 3);                   // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:18:18
    Literal(lit 8191);                   // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:18:42
    Call(count 2, flag false);           // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:18:42
    StoreVar(index 1);                   // 3  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:18:42
    Literal(lit 11);                     // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:19:15
    LoadVar(index 1);                    // 5  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:19:1
    Literal(lit 0);                      // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:19:10
    LoadVar(index 3);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:19:10
    ObjectSet();                         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:19:10
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:19:10
    Literal(lit 12);                     // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:20:18
    LoadVar(index 1);                    // 5  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:20:1
    Literal(lit 4095);                   // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:20:10
    LoadVar(index 3);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:20:10
    ObjectSet();                         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:20:10
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:20:10
    Literal(lit 13);                     // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:21:18
    LoadVar(index 1);                    // 5  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:21:1
    Literal(lit 4096);                   // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:21:10
    LoadVar(index 3);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:21:10
    ObjectSet();                         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:21:10
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:21:10
    Literal(lit 14);                     // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:22:18
    LoadVar(index 1);                    // 5  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:22:1
    Literal(lit 8190);                   // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:22:10
    LoadVar(index 3);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:22:10
    ObjectSet();                         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:22:10
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:22:10
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:23:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:23:1
    LoadVar(index 1);                    // 6  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:23:13
    Literal(lit 'length');               // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:23:13
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:23:13
    Literal(lit 8191);                   // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:23:30
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:23:30
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:24:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:24:1
    LoadVar(index 1);                    // 6  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:24:13
    Literal(lit 0);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:24:22
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:24:22
    Literal(lit 11);                     // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:24:26
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:24:26
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:25:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:25:1
    LoadVar(index 1);                    // 6  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:25:13
    Literal(lit 4095);                   // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:25:22
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:25:22
    Literal(lit 12);                     // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:25:29
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:25:29
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:26:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:26:1
    LoadVar(index 1);                    // 6  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:26:13
    Literal(lit 4096);                   // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:26:22
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:26:22
    Literal(lit 13);                     // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:26:29
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:26:29
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:27:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:27:1
    LoadVar(index 1);                    // 6  largeBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:27:13
    Literal(lit 8190);                   // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:27:22
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:27:22
    Literal(lit 14);                     // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:27:29
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:27:29
    Literal(lit undefined);              // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:29:18
    LoadGlobal(name 'Microvium');        // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:29:18
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:29:18
    Literal(lit 'newUint8Array');        // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:29:18
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:29:18
    StoreVar(index 3);                   // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:29:18
    Literal(lit 0);                      // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:29:42
    Call(count 2, flag false);           // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:29:42
    StoreVar(index 2);                   // 3  emptyBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:29:42
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:30:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:30:1
    LoadVar(index 2);                    // 6  emptyBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:30:13
    Literal(lit 'length');               // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:30:13
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:30:13
    Literal(lit 0);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:30:30
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:30:30
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:31:1
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:31:1
    LoadVar(index 2);                    // 6  emptyBuf       ./test/end-to-end/tests/uint8Array.test.mvm.js:31:13
    Literal(lit 0);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:31:22
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:31:22
    Literal(lit undefined);              // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:31:26
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:31:26
    Literal(lit undefined);              // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:33:1
    Return();                            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:33:1
}

function run() {
  entry:
    Literal(lit deleted);                // 1  buf2           ./test/end-to-end/tests/uint8Array.test.mvm.js:33:16
    Literal(lit deleted);                // 2  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:33:16
    Literal(lit deleted);                // 3  emptyRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:33:16
    // Reading from compile-time Uint8Array at runtime
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:35:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:35:3
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:35:15
    Literal(lit 'length');               // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:35:15
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:35:15
    Literal(lit 5);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:35:28
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:35:28
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:36:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:36:3
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:36:15
    Literal(lit 0);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:36:20
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:36:20
    Literal(lit 1);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:36:24
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:36:24
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:37:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:37:3
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:37:15
    Literal(lit 4);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:37:20
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:37:20
    Literal(lit 5);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:37:24
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:37:24
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:38:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:38:3
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:38:15
    Literal(lit 5);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:38:20
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:38:20
    Literal(lit undefined);              // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:38:24
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:38:24
    // Mutating compile-time Uint8Array at runtime
    Literal(lit 42);                     // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:41:13
    LoadGlobal(name 'buf1');             // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:41:3
    Literal(lit 2);                      // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:41:8
    LoadVar(index 3);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:41:8
    ObjectSet();                         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:41:8
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:41:8
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:42:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:42:3
    LoadGlobal(name 'buf1');             // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:42:15
    Literal(lit 2);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:42:20
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:42:20
    Literal(lit 42);                     // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:42:24
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:42:24
    // Creating Uint8Array at runtime
    Literal(lit undefined);              // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:45:16
    LoadGlobal(name 'Microvium');        // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:45:16
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:45:16
    Literal(lit 'newUint8Array');        // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:45:16
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:45:16
    StoreVar(index 3);                   // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:45:16
    Literal(lit 3);                      // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:45:40
    Call(count 2, flag false);           // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:45:40
    StoreVar(index 0);                   // 3  buf2           ./test/end-to-end/tests/uint8Array.test.mvm.js:45:40
    Literal(lit deleted);                // 4  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:46:3
    Literal(lit 0);                      // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:16
    StoreVar(index 3);                   // 4  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:46:16
    Jump(@block4);                       // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:16
  block4:
    LoadVar(index 3);                    // 5  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:46:19
    LoadVar(index 0);                    // 6  buf2           ./test/end-to-end/tests/uint8Array.test.mvm.js:46:23
    Literal(lit 'length');               // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:23
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:23
    BinOp(op '<');                       // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:23
    Branch(@block5, @block6);            // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:23
  block5:
    LoadVar(index 3);                    // 5  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:47:15
    Literal(lit 100);                    // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:47:19
    BinOp(op '+');                       // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:47:19
    LoadVar(index 0);                    // 6  buf2           ./test/end-to-end/tests/uint8Array.test.mvm.js:47:5
    LoadVar(index 3);                    // 7  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:47:10
    LoadVar(index 4);                    // 8                 ./test/end-to-end/tests/uint8Array.test.mvm.js:47:10
    ObjectSet();                         // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:47:10
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:47:10
    LoadVar(index 3);                    // 5  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:46:36
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:36
    NumericUnOp(op '++', numeric type 'f64' (default context)); // 6  ./test/end-to-end/tests/uint8Array.test.mvm.js:46:36
    LoadVar(index 5);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:36
    StoreVar(index 3);                   // 6  i              ./test/end-to-end/tests/uint8Array.test.mvm.js:46:36
    Pop(count 1);                        // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:36
    Pop(count 1);                        // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:36
    Jump(@block4);                       // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:46:36
  block6:
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:47:23
    // Writing
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:48:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:48:3
    LoadVar(index 0);                    // 6  buf2           ./test/end-to-end/tests/uint8Array.test.mvm.js:48:15
    Literal(lit 'length');               // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:48:15
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:48:15
    Literal(lit 3);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:48:28
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:48:28
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:49:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:49:3
    LoadVar(index 0);                    // 6  buf2           ./test/end-to-end/tests/uint8Array.test.mvm.js:49:15
    Literal(lit 0);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:49:20
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:49:20
    Literal(lit 100);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:49:24
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:49:24
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:50:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:50:3
    LoadVar(index 0);                    // 6  buf2           ./test/end-to-end/tests/uint8Array.test.mvm.js:50:15
    Literal(lit 1);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:50:20
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:50:20
    Literal(lit 101);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:50:24
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:50:24
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:51:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:51:3
    LoadVar(index 0);                    // 6  buf2           ./test/end-to-end/tests/uint8Array.test.mvm.js:51:15
    Literal(lit 2);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:51:20
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:51:20
    Literal(lit 102);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:51:24
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:51:24
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:52:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:52:3
    LoadVar(index 0);                    // 6  buf2           ./test/end-to-end/tests/uint8Array.test.mvm.js:52:15
    Literal(lit 3);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:52:20
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:52:20
    Literal(lit undefined);              // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:52:24
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:52:24
    // Runtime allocations use the same extended header encoding.
    Literal(lit undefined);              // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:55:27
    LoadGlobal(name 'Microvium');        // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:55:27
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:55:27
    Literal(lit 'newUint8Array');        // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:55:27
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:55:27
    StoreVar(index 3);                   // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:55:27
    Literal(lit 8191);                   // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:55:51
    Call(count 2, flag false);           // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:55:51
    StoreVar(index 1);                   // 3  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:55:51
    Literal(lit 21);                     // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:56:24
    LoadVar(index 1);                    // 5  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:56:3
    Literal(lit 0);                      // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:56:19
    LoadVar(index 3);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:56:19
    ObjectSet();                         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:56:19
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:56:19
    Literal(lit 22);                     // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:57:27
    LoadVar(index 1);                    // 5  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:57:3
    Literal(lit 4095);                   // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:57:19
    LoadVar(index 3);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:57:19
    ObjectSet();                         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:57:19
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:57:19
    Literal(lit 23);                     // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:58:27
    LoadVar(index 1);                    // 5  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:58:3
    Literal(lit 4096);                   // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:58:19
    LoadVar(index 3);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:58:19
    ObjectSet();                         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:58:19
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:58:19
    Literal(lit 24);                     // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:59:27
    LoadVar(index 1);                    // 5  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:59:3
    Literal(lit 8190);                   // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:59:19
    LoadVar(index 3);                    // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:59:19
    ObjectSet();                         // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:59:19
    Pop(count 1);                        // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:59:19
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:60:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:60:3
    LoadVar(index 1);                    // 6  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:60:15
    Literal(lit 'length');               // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:60:15
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:60:15
    Literal(lit 8191);                   // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:60:39
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:60:39
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:61:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:61:3
    LoadVar(index 1);                    // 6  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:61:15
    Literal(lit 0);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:61:31
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:61:31
    Literal(lit 21);                     // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:61:35
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:61:35
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:62:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:62:3
    LoadVar(index 1);                    // 6  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:62:15
    Literal(lit 4095);                   // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:62:31
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:62:31
    Literal(lit 22);                     // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:62:38
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:62:38
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:63:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:63:3
    LoadVar(index 1);                    // 6  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:63:15
    Literal(lit 4096);                   // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:63:31
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:63:31
    Literal(lit 23);                     // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:63:38
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:63:38
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:64:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:64:3
    LoadVar(index 1);                    // 6  largeRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:64:15
    Literal(lit 8190);                   // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:64:31
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:64:31
    Literal(lit 24);                     // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:64:38
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:64:38
    Literal(lit undefined);              // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:66:27
    LoadGlobal(name 'Microvium');        // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:66:27
    LoadVar(index 4);                    // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:66:27
    Literal(lit 'newUint8Array');        // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:66:27
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:66:27
    StoreVar(index 3);                   // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:66:27
    Literal(lit 0);                      // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:66:51
    Call(count 2, flag false);           // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:66:51
    StoreVar(index 2);                   // 3  emptyRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:66:51
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:67:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:67:3
    LoadVar(index 2);                    // 6  emptyRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:67:15
    Literal(lit 'length');               // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:67:15
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:67:15
    Literal(lit 0);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:67:39
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:67:39
    LoadGlobal(name 'assertEqual');      // 4                 ./test/end-to-end/tests/uint8Array.test.mvm.js:68:3
    Literal(lit undefined);              // 5                 ./test/end-to-end/tests/uint8Array.test.mvm.js:68:3
    LoadVar(index 2);                    // 6  emptyRuntimeBuf ./test/end-to-end/tests/uint8Array.test.mvm.js:68:15
    Literal(lit 0);                      // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:68:31
    ObjectGet();                         // 6                 ./test/end-to-end/tests/uint8Array.test.mvm.js:68:31
    Literal(lit undefined);              // 7                 ./test/end-to-end/tests/uint8Array.test.mvm.js:68:35
    Call(count 3, flag true);            // 3                 ./test/end-to-end/tests/uint8Array.test.mvm.js:68:35
    Pop(count 3);                        // 0                 ./test/end-to-end/tests/uint8Array.test.mvm.js:69:2
    Literal(lit undefined);              // 1                 ./test/end-to-end/tests/uint8Array.test.mvm.js:69:2
    Return();                            // 0                 ./test/end-to-end/tests/uint8Array.test.mvm.js:69:2
}