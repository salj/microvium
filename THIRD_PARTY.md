# Third-party code in embeddable outputs

This inventory covers code included in the compiler and its built artifacts.
JavaScript dependency versions come from `package-lock.json`. QuickJS-NG is
vendored at `wasm-build/quickjs-ng` with its upstream license and source.
The build was verified with Emscripten 3.1.69. The version is selected by
`EMCC` or found on `PATH` at build time; re-audit the link maps if that changes.

Audited outputs:

| Output | Shipped code |
| --- | --- |
| `dist-web/app.js` | Microvium browser adapters; no external runtime package |
| `dist-web/compiler-entry.js` | Compiler JavaScript and the npm packages listed below |
| `dist-web/compiler.wasm` | Compiler JavaScript, QuickJS-NG, Emscripten sysroot libraries, and standalone-WASM support; no imports |
| `dist-web/microvium-runtime.wasm` | Microvium runtime and Emscripten sysroot math objects; imports only memory and `mvm_wasm_host_import` |
| `dist-native/mvmc` | Compiler JavaScript embedded as QuickJS-NG bytecode, QuickJS-NG, and the Microvium C runtime; native C runtime libraries |
| npm package `microvium` (`microvium-compile` bin) | Node CLI adapter and `dist-web/compiler-entry.js`; no WASM runtime dependency |

The compiler WASM embeds its JavaScript compiler in QuickJS-NG. `mvmc` embeds
the same compiler bundle as QuickJS-NG bytecode and links the native Microvium
runtime directly. Every dependency listed below as part of the compiler JS
bundle is also embedded in `dist-native/mvmc` as compiler bytecode. Emscripten
is a build tool; its linked sysroot objects are included in `compiler.wasm`.
`dist-web/app.js` and `dist-web/microvium-runtime.wasm` are built by
`npm run build:web-demo`. The build scripts emit link maps under ignored build
directories so the linked sysroot objects can be audited.

## Projects and applicable license texts

`licenses/` contains the applicable license texts. `wasm-build/quickjs-ng/LICENSE`
is the upstream QuickJS-NG license. The MIT license text is shared where
projects use identical terms; retain each project's copyright attribution.

| Project | Version | Applicable license text | Output |
| --- | --- | --- | --- |
| `@babel/helper-validator-identifier` | 7.12.11 | `licenses/MIT.txt` | compiler JS bundle |
| `@babel/parser` | 7.18.11 | `licenses/MIT.txt` | compiler JS bundle |
| `@babel/types` | 7.12.12 | `licenses/MIT.txt` | compiler JS bundle |
| `base64-js` | 1.3.1 | `licenses/MIT.txt` | compiler JS bundle |
| `buffer` | 6.0.3 | `licenses/MIT.txt` | compiler JS bundle |
| `crc` | 3.8.0 | `licenses/MIT.txt` | compiler JS bundle |
| `deep-freeze` | 0.0.1 | Public domain; `licenses/Public-Domain-deep-freeze.txt` | compiler JS bundle |
| `escape-html` | 1.0.3 | `licenses/MIT.txt` | compiler JS bundle |
| Emscripten support code | 3.1.69 in the verified build; MIT | `licenses/MIT.txt` | `compiler.wasm` |
| `ieee754` | 1.2.1 | `licenses/BSD-3-Clause.txt` | compiler JS bundle |
| `immutable` | 4.3.9 | `licenses/MIT.txt` | compiler JS bundle |
| `lodash` | 4.18.1 | `licenses/lodash-LICENSE.txt` | compiler JS bundle |
| `lower-case` | 2.0.1 | `licenses/MIT.txt` | compiler JS bundle |
| musl libc | Emscripten sysroot version | `licenses/MIT.txt` | `compiler.wasm`, `microvium-runtime.wasm` |
| `no-case` | 3.0.3 | `licenses/MIT.txt` | compiler JS bundle |
| QuickJS-NG | 0.15.1 | `wasm-build/quickjs-ng/LICENSE` | `compiler.wasm`, `dist-native/mvmc` |
| `smart-buffer` | 4.2.0 | `licenses/MIT.txt` | compiler JS bundle |
| `to-fast-properties` | 2.0.0 | `licenses/MIT.txt` | compiler JS bundle |
| `to-single-quotes` | 3.0.0 | `licenses/MIT.txt` | compiler JS bundle |
| Unicode Character Database | 17.0.0 | `licenses/Unicode-3.0.txt` | `compiler.wasm`, `dist-native/mvmc` |
| compiler-rt | Emscripten sysroot version | Apache-2.0 with LLVM exception; `licenses/Apache-2.0.txt`, `licenses/LLVM-exception.txt` | `compiler.wasm` |
| dlmalloc | Emscripten sysroot version | CC0; `licenses/CC0-1.0.txt` | `compiler.wasm` |

QuickJS-NG's generated Unicode tables are also covered by the Unicode license.
The compiler link map includes Emscripten's `libc.a`, `libcompiler_rt.a`,
`libdlmalloc.a`, and standalone-WASM support archive. The runtime link map uses
the math objects from `libc.a`; it does not link the compiler allocator or
compiler-rt archives. The MIT license applies to Emscripten and musl code. A
static `mvmc` build may also include the C library selected by the host
toolchain; retain that toolchain's applicable notices when redistributing it.

Microvium code in `microvium-runtime.wasm` and `dist-native/mvmc` is under this
repository's MIT license. The license files are not appended to generated WASM,
native binaries, or JavaScript; ship this document and the referenced license
texts with redistributed artifacts.

## Required copyright and attribution notices

- Babel parser packages: Copyright (C) 2012-2014 by various contributors; see
  Babel's AUTHORS file.
- `base64-js`: Copyright (c) 2014 Jameson Little.
- `buffer`: Copyright (c) Feross Aboukhadijeh and other contributors.
- `crc`: Copyright 2014 Alex Gorbatchev.
- `deep-freeze`: public domain; based in part on MDN's `Object.freeze`
  deepFreeze example. The copied notice gives the source URL.
- `escape-html`: Copyright (c) 2012-2013 TJ Holowaychuk; Copyright (c) 2015
  Andreas Lubbe; Copyright (c) 2015 Tiancheng "Timothy" Gu.
- `ieee754`: Copyright 2008 Fair Oaks Labs, Inc. Do not use its name or
  contributors' names to endorse or promote products without prior written
  permission.
- `immutable`: Copyright (c) 2014-present, Lee Byron and other contributors.
- `lodash`: Copyright OpenJS Foundation and other contributors; based on
  Underscore.js, copyright Jeremy Ashkenas, DocumentCloud, and Investigative
  Reporters & Editors. See `licenses/lodash-LICENSE.txt` for the full notice.
- `lower-case`, `no-case`: Copyright (c) 2014 Blake Embrey.
- Emscripten support code: Copyright (c) 2010-2014 Emscripten authors; see
  the upstream `LICENSE` and `AUTHORS` files.
- QuickJS-NG: Copyright (c) 2017-2026 Fabrice Bellard; Copyright (c) 2017-2024
  Charlie Gordon; Copyright (c) 2023-2026 Ben Noordhuis; Copyright (c)
  2023-2026 Saúl Ibarra Corretgé. See the vendored LICENSE file.
- `smart-buffer`: Copyright (c) 2013-2017 Josh Glazebrook.
- `to-fast-properties`: Copyright (c) 2014 Petka Antonov and 2015 Sindre Sorhus.
- `to-single-quotes`: Copyright (c) Sindre Sorhus.
- Unicode data: Copyright © 1991-2026 Unicode, Inc. Its copyright and
  permission notice must accompany the data or associated documentation.
- musl libc: Copyright © 2005-2020 Rich Felker and contributors. The linked
  math sources also carry copyrights for Sun Microsystems, David Schultz,
  Steven G. Kargl, Bruce D. Evans, Stephen L. Moshier, and Arm Limited; see
  the individual source headers and Emscripten's musl `COPYRIGHT` file.
- compiler-rt: preserve contributor attribution in
  `licenses/compiler-rt-CREDITS.txt`.
- dlmalloc: public domain under CC0.

The BSD-3-Clause license bars use of the holder or contributor names to endorse
or promote derived products without prior written permission. Unicode bars use
of its name in promotion without prior written authorization.

## Scope and source notes

The existing Node CLI, Emscripten executable, esbuild, and test tools are
build-time code and are not included as runtime dependencies. `mvmc` is a
separate native build target. The npm package uses the JavaScript
compiler bundle directly; it no longer ships Javy, the browser WASI shim, Rust
runtime crates, or a Wasmer/Wasmtime launcher. The WebAssembly compiler has no
WASI imports and needs no WASI host.

Upstream references:

- [QuickJS-NG 0.15.1](https://github.com/quickjs-ng/quickjs/tree/v0.15.1)
- [Emscripten](https://github.com/emscripten-core/emscripten)
- [Emscripten license](https://github.com/emscripten-core/emscripten/blob/3.1.69/LICENSE)
- [musl copyright notice in the Emscripten sysroot](https://github.com/emscripten-core/emscripten/blob/3.1.69/system/lib/libc/musl/COPYRIGHT)
- [npm package sources](package-lock.json)
- [Unicode License v3](https://www.unicode.org/license.txt)
