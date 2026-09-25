# Third-party code in embeddable outputs

This inventory covers third-party code present in the compiler and its built
artifacts. Build and test tools are excluded. Versions are pinned by
`package-lock.json` or the Javy 9.1.0 release and its `Cargo.lock`.

Audited outputs from `npm run build:web-demo`:

| Output | Shipped code |
| --- | --- |
| `dist-web/app.js` | Browser WASI shim |
| `dist-web/compiler.wasm` | Compiler support JavaScript, Javy runtime, QuickJS-NG, JSON/runtime Rust crates, and WASI libc support |
| `dist-web/microvium-runtime.wasm` | Microvium project code only; built with `-nostdlib` |

## Projects and applicable license texts

`licenses/` contains the license texts. Where a project offers a choice of
licenses, this notice applies the listed option. Identical MIT license terms
are included once in `licenses/MIT.txt`; the project copyright notices below
remain separate and must accompany that text. Apache 2.0 is included once,
with the LLVM exception as a separate text.

| Project | Version | Applicable license text | Output |
| --- | --- | --- | --- |
| `@babel/helper-validator-identifier` | 7.12.11 | `licenses/MIT.txt` | `compiler.wasm` |
| `@babel/parser` | 7.18.11 | `licenses/MIT.txt` | `compiler.wasm` |
| `@babel/types` | 7.12.12 | `licenses/MIT.txt` | `compiler.wasm` |
| `@bjorn3/browser_wasi_shim` | 0.4.2 | `licenses/MIT.txt` | `app.js` |
| `allocator-api2` | 0.2.21 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `anyhow` | 1.0.103 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `base64-js` | 1.3.1 | `licenses/MIT.txt` | `compiler.wasm` |
| `bitflags` | 2.13.0 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `buffer` | 6.0.3 and 5.7.1 | `licenses/MIT.txt` | `compiler.wasm` |
| `compiler_builtins` | Rust WASI target sysroot | MIT; Apache-2.0 with LLVM exception; `licenses/MIT.txt`, `licenses/Apache-2.0.txt`, `licenses/LLVM-exception.txt` | `compiler.wasm` |
| `crc` | 3.8.0 | `licenses/MIT.txt` | `compiler.wasm` |
| `deep-freeze` | 0.0.1 | Public domain; `licenses/Public-Domain-deep-freeze.txt` | `compiler.wasm` |
| `equivalent` | 1.0.2 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `escape-html` | 1.0.3 | `licenses/MIT.txt` | `compiler.wasm` |
| `fastrand` | 2.4.1 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `float-cmp` | 0.10.0 | MIT; `licenses/MIT.txt` | `compiler.wasm` |
| `foldhash` | 0.2.0 | Zlib; `licenses/Zlib.txt` | `compiler.wasm` |
| `halfbrown` | 0.4.0 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `hashbrown` | 0.16.1 and 0.17.0 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `ieee754` | 1.2.1 | BSD-3-Clause; `licenses/BSD-3-Clause.txt` | `compiler.wasm` |
| `immutable` | 4.3.9 | `licenses/MIT.txt` | `compiler.wasm` |
| `itoa` | 1.0.15 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| Javy runtime (`javy`) | Release 9.1.0; runtime crate 8.1.0 | `licenses/Apache-2.0.txt` plus `licenses/LLVM-exception.txt` | `compiler.wasm` |
| `lodash` | 4.18.1 | MIT; `licenses/lodash-LICENSE.txt` | `compiler.wasm` |
| `lower-case` | 2.0.1 | `licenses/MIT.txt` | `compiler.wasm` |
| `memchr` | 2.7.6 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `no-case` | 3.0.3 | `licenses/MIT.txt` | `compiler.wasm` |
| `num-traits` | 0.2.19 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| QuickJS-NG | 0.15.0; submodule commit `433941b99fb3c5e7f98b7ebd78727972bcf467ee` | `licenses/MIT.txt` | `compiler.wasm` |
| `ref-cast` | 1.0.25 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `rquickjs`, `rquickjs-core`, `rquickjs-sys` | 0.12.0 | `licenses/MIT.txt` | `compiler.wasm` |
| `rquickjs-serde` | 0.6.1 | Apache-2.0; `licenses/Apache-2.0.txt` | `compiler.wasm` |
| Rust standard library | Rust WASI target sysroot | MIT or Apache-2.0; `licenses/MIT.txt`, `licenses/Apache-2.0.txt` | `compiler.wasm` |
| `ryu` | 1.0.20 | BSL-1.0 option; `licenses/BSL-1.0.txt` | `compiler.wasm` |
| `serde` | 1.0.228 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `serde_core` | 1.0.228 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `serde_json` | 1.0.150 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `serde-transcode` | 1.1.1 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `simd-json` | 0.17.0 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `simdutf8` | 0.1.5 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| `smart-buffer` | 4.2.0 | `licenses/MIT.txt` | `compiler.wasm` |
| `to-fast-properties` | 2.0.0 | `licenses/MIT.txt` | `compiler.wasm` |
| `to-single-quotes` | 3.0.0 | `licenses/MIT.txt` | `compiler.wasm` |
| Unicode Character Database | 17.0.0 | Unicode License v3; `licenses/Unicode-3.0.txt` | `compiler.wasm` |
| `value-trait` | 0.12.1 | MIT option; `licenses/MIT.txt` | `compiler.wasm` |
| wasi-libc | Rust WASI target sysroot | `licenses/wasi-libc-LICENSE-source.txt`, `licenses/Apache-2.0.txt`, `licenses/LLVM-exception.txt`, `licenses/MIT.txt`, `licenses/BSD-2-Clause.txt`, and `licenses/CC0-1.0.txt` | `compiler.wasm` |
| `zmij` | 1.0.12 | MIT; `licenses/MIT.txt` | `compiler.wasm` |

Microvium code in `microvium-runtime.wasm` is under the repository's MIT
license.

For redistribution, ship this document and the applicable files from
`licenses/` with the corresponding built artifacts. The license files are not
automatically appended to the WASM or JavaScript outputs.

## Required copyright and attribution notices

Include these notices with the license texts. MIT requires retaining the
applicable copyright and permission notices. BSD-3-Clause also requires its
conditions and disclaimer in binary redistributions, and bars use of the
holder or contributor names to endorse or promote derived products without
prior written permission. Unicode bars use of its name in promotion without
prior written authorization. No other separate advertising clause applies.

- `@babel/helper-validator-identifier`, `@babel/parser`, `@babel/types`:
  Copyright (C) 2012-2014 by various contributors (see Babel's AUTHORS file).
- `@bjorn3/browser_wasi_shim`: package author metadata names `bjorn3`; its
  packaged MIT and Apache texts contain no separate copyright line.
- `base64-js`: Copyright (c) 2014 Jameson Little.
- `bitflags`: Copyright (c) 2014 The Rust Project Developers.
- `buffer`: Copyright (c) Feross Aboukhadijeh and other contributors.
- `compiler_builtins`: preserve compiler-rt contributor attributions in
  `licenses/compiler-rt-CREDITS.txt`; the crate's license identifies compiler-rt
  contributions before 2019-01-19 as MIT-licensed.
- `crc`: Copyright 2014 Alex Gorbatchev.
- `deep-freeze`: released to the public domain; based in part on MDN's
  `Object.freeze` deepFreeze example. The copied notice gives the source URL.
- `equivalent`: Copyright (c) 2016--2023.
- `escape-html`: Copyright (c) 2012-2013 TJ Holowaychuk; Copyright (c) 2015
  Andreas Lubbe; Copyright (c) 2015 Tiancheng "Timothy" Gu.
- `float-cmp`: Copyright (c) 2014-2020 Optimal Computing (NZ) Ltd.
- `foldhash`: Copyright (c) 2024 Orson Peters. Its Zlib notice asks for a
  documentation acknowledgement but does not require one; this document
  includes it.
- `halfbrown`: its MIT file contains the literal placeholder
  `Copyright (c) [year] [fullname]`.
- `hashbrown`: Copyright (c) 2016 Amanieu d'Antras.
- `ieee754`: Copyright 2008 Fair Oaks Labs, Inc. Do not use its name or
  contributors' names to endorse or promote products without specific prior
  written permission.
- `immutable`: Copyright (c) 2014-present, Lee Byron and other contributors.
- `Javy`: preserve applicable copyright, patent, trademark, and attribution
  notices for the embedded runtime. The pinned source has no Javy NOTICE file.
- `lodash`: Copyright OpenJS Foundation and other contributors; based on
  Underscore.js, copyright Jeremy Ashkenas, DocumentCloud, and Investigative
  Reporters & Editors. See `licenses/lodash-LICENSE.txt` for the full notice.
- `lower-case`: Copyright (c) 2014 Blake Embrey.
- `memchr`: Copyright (c) 2015 Andrew Gallant.
- `no-case`: Copyright (c) 2014 Blake Embrey.
- `num-traits`: Copyright (c) 2014 The Rust Project Developers.
- QuickJS-NG: Copyright (c) 2017-2026 Fabrice Bellard; Copyright (c) 2017-2024
  Charlie Gordon; Copyright (c) 2023-2026 Ben Noordhuis; Copyright (c)
  2023-2026 Saúl Ibarra Corretgé.
- `rquickjs`, `rquickjs-core`, `rquickjs-sys`: Copyright (c) 2020 Mees
  Delzenne; Copyright (c) 2025 Rquickjs Contributors.
- `rquickjs-serde`: include `licenses/rquickjs-serde-NOTICE.txt`. It
  acknowledges the Javy Project Developers
  (https://github.com/bytecodealliance/javy) and Emile Fugulin
  (https://github.com/Sytten); reproduce this notice with `compiler.wasm`.
- Rust standard library: Copyright (c) The Rust Project Developers.
- `ryu`: Copyright 2018 Ulf Adams. BSL-1.0 requires retaining the copyright
  notice and license statement; `licenses/BSL-1.0.txt` contains the full text.
- `serde-transcode`: Copyright (c) 2016 The serde-transcode Developers.
- `simd-json`: its MIT file contains the literal placeholder
  `Copyright (c) [year] [fullname]`.
- `smart-buffer`: Copyright (c) 2013-2017 Josh Glazebrook.
- `to-fast-properties`: Copyright (c) 2014 Petka Antonov; Copyright (c) 2015
  Sindre Sorhus.
- `to-single-quotes`: Copyright (c) Sindre Sorhus.
- Unicode data: Copyright © 1991-2026 Unicode, Inc. Its copyright and
  permission notice must accompany the data or associated documentation.
- `value-trait`: its MIT file contains the literal placeholder
  `Copyright (c) [year] [fullname]`.
- wasi-libc: dlmalloc is public domain under CC0. Cloudlibc: Copyright (c)
  2015-2017 Nuxi (https://nuxi.nl/) and contributors. The BSD-2-Clause terms
  are in `licenses/BSD-2-Clause.txt`.

## Scope and source notes

Javy statically embeds QuickJS and enables its JSON feature. The CLI, esbuild,
Rust build scripts, procedural macros, and test-only crates are build-time
code, so they are excluded. JavaScript versions come from the root
`package-lock.json`; Rust runtime crate versions come from Javy 9.1.0's
`Cargo.lock` and the enabled runtime feature graph.

The Javy CLI fetched by `scripts/fetch-javy.sh` is also a build-time tool and
is not embedded in the shipped outputs. All six Javy 9.1.0 host archives are
treated as sharing the same licensing.

wasi-libc is supplied by the Rust WASI target sysroot. Its root notice is
included verbatim in `licenses/wasi-libc-LICENSE-source.txt`; the applicable
dlmalloc and Cloudlibc notices are included separately.

Upstream references:

- [Javy 9.1.0](https://github.com/bytecodealliance/javy/tree/v9.1.0)
- [npm package sources](package-lock.json)
- [QuickJS-NG 0.15.0](https://github.com/quickjs-ng/quickjs/tree/v0.15.0)
- [rquickjs 0.12.0](https://github.com/DelSkayn/rquickjs/tree/v0.12.0)
- [Unicode License v3](https://www.unicode.org/license.txt)
- [wasi-libc](https://github.com/WebAssembly/wasi-libc)
