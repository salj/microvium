# Third-party components

The compiler-WASM work is in progress. This inventory records exact package
versions already used by its source entry and bundle build.

| Component | Version | License | Use |
| --- | --- | --- | --- |
| buffer | 6.0.3 | MIT | Browser-compatible Buffer operations used by the compiler bundle |
| esbuild | 0.28.1 | MIT | Bundles the compiler entry into a single JavaScript file |
| Javy | 9.1.0 | Apache-2.0 | Converts the bundled compiler JavaScript into a WASI module |

The pinned Linux x86_64 Javy release archive is verified against SHA-256
`a68b122d48eb3dfc1b801d4e14c39271fde3638243d3272d206e376ac9189e39` by
`scripts/fetch-javy.sh`.
