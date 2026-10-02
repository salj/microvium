# Microvium

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

Microvium is an embeddable JavaScript engine for microcontrollers, running a
small but useful subset of the language. The runtime is portable C; its flash
size depends on the enabled features and compiler settings. See the current
[size measurement](./doc/native-host/memory-usage.md).

Microvium takes the unique approach partially running the JS code at build time and deploying a snapshot, which leads to a number of advantages over other embedded JavaScript engines. See [concepts.md](./doc/concepts.md).

Take a look at [my blog (coder-mike.com)](https://coder-mike.com/behind-microvium/) and [Twitter account (@microvium)](https://twitter.com/microvium) if you're interested in some of the behind-the-scenes thought processes and design decisions, and to stay updated with new developments.

See also [microvium.com](https://microvium.com/) where an installer can be downloaded (for Windows only, at this time, and this is a bit out of date -- but contact me if you want the updated version).

## Install and Get Started

Check out the [Getting Started](./doc/getting-started.md) tutorial which **explains the concepts**, **gives some examples**, and shows how to get set up.

## Features

See also [the set of supported language features](./doc/supported-language.md).

  - Run high-level scripts on an MCU (bare metal or RTOS).
  - The runtime engine is implemented in pure C and doesn't use any I/O functions such as `fopen` or `printf`.
  - Run the same script code on small microcontrollers and desktop-class machines (ideal for IoT applications with shared logic between device and server) -- the runtime engine is available as a C unit and as a node.js library.
  - Run JavaScript on small devices. ROM and RAM use depend on the runtime configuration, host port, and script; [memory usage](./doc/native-host/memory-usage.md) documents the current measurements.
  - Script code is completely sand-boxed and isolated for security and safety.

There are a few similar alternatives floating around but Microvium takes a unique approach (see [Alternatives](./doc/alternatives.md)).

## Limitations

The current snapshot and VM memory regions are limited to 64 kB each. The
firmware containing the engine can be larger.

There is no standard library and only a [subset of JavaScript](./doc/supported-language.md) is currently supported.

## Usage

Microvium can be used in several ways:

  1. `npm install -g microvium` globally will install a CLI that runs microvium scripts (and by default produces a snapshot of the final state, in case you want to deploy it)

  2. `npm install microvium` will install Microvium as an npm library with TypeScript definitions. This is useful if you want to run Microvium on a custom node.js host and control the snapshotting and host API yourself.

  3. Use the bundled compiler CLI or native `mvmc` for compilation and FFI
     testing; see [compiler tools](./docs/compiler-cli.md) and [native mvmc](./docs/native-mvmc.md).

  4. Integrate `microvium.c` into your C or C++ project to resume execution of a snapshot.

See [Getting Started](./doc/getting-started.md) for the library and C runtime.

## Docs

  - [Getting Started](./doc/getting-started.md)
  - [Concepts](./doc/concepts.md)
  - [Reference](./doc/reference.md)
  - [Contribute](./doc/contribute.md)
  - [Numeric types](./doc/numeric-types.md)
  - [Browser WebAssembly demo](./docs/browser-wasm.md)
  - [Native compiler and FFI runner (`mvmc`)](./docs/native-mvmc.md)

## Contributing

Check out [./doc/contribute.md](./doc/contribute.md).
