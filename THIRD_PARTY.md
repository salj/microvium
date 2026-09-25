# Third-party components

These components are used by the browser compiler and demo. The versions below
are pinned in `package-lock.json` or by the Javy fetch script.

| Component | Version | License | Use |
| --- | --- | --- | --- |
| buffer | 6.0.3 | MIT | Browser-compatible Buffer operations used by the compiler bundle |
| esbuild | 0.28.1 | MIT | Bundles the compiler entry into a single JavaScript file |
| Javy | 9.1.0 | Apache-2.0 | Converts the bundled compiler JavaScript into a WASI module |
| @bjorn3/browser_wasi_shim | 0.4.2 | MIT OR Apache-2.0 | Provides WASI Preview 1 stdin/stdout/stderr for browser compiler execution |

The pinned Linux x86_64 Javy release archive is verified against SHA-256
`a68b122d48eb3dfc1b801d4e14c39271fde3638243d3272d206e376ac9189e39` by
`scripts/fetch-javy.sh`.
