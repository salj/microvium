# Microvium Concepts

Microvium is designed fundamentally around the concept of _snapshotting_, which here is the ability to take the running state of a JavaScript virtual machine (VM), including all of the loaded modules, functions, variables and object states, and persist it as data (for example, in a file, database, or flash storage on a microcontroller), and then to _restore_ the running VM from the snapshot at a later time to continue executing it, possibly in a completely different environment.

A special case of this general idea is the ability to start running a Microvium virtual machine on a desktop-class computer (e.g. development machine or backend server), where it has access to more advanced features, and then transfer an image (snapshot) of the running virtual machine to a target microcontroller where it is resumed and the firmware can access its exported API.

![./images/snapshot2.gif](./images/snapshot2.gif)

## Why Snapshotting?

Snapshotting is not just a cool feature of Microvium, it is foundational to the way you use Microvium. While the virtual machine is running in a desktop-class environment, it has access to features that aren't available on a Microcontroller, such as:

  1. The ability to _import source code_ files and modules.

  2. Access to data and module sources provided by the compile-time host. The
     compiler VM has no built-in filesystem API. A host adapter may read source
     files or other inputs before passing their contents to the compiler.

  3. The ability to programmatically compute configuration and FFI metadata
     while evaluating the source. A surrounding build tool can use that result
     to generate C headers or other files.

This approach has a few major advantages over alternative approaches:

  - **Runtime performance**: the program has already run through its initialization stages by the time it gets snapshotted, so when it starts executing for the first time on the MCU target, the VM can pick up immediately where it left off at compile time rather than wasting time on startup initialization.

  - **Ease of use**: compared to the way you use other bundlers and compilers, the snapshotting paradigm requires no external configuration files to tell it what to compile. See [Snapshotting vs Bundling](https://coder-mike.com/2020/05/snapshotting-vs-bundling/).

  - **Configuration**: by really running the script at compile time, the compile-time host is allowed to call any methods in the JS app, such as to inject configuration parameters.

  - **FFI**: the compiler can record numeric or named imports and exports in
    the snapshot. The host links those entries when it restores the VM. See
    [the FFI guide](./ffi-guide.md) and [named FFI](../docs/named-ffi.md).

For a specific example of snapshotting in action, see the [Getting Started](./getting-started.md) guide.

## Compiler and runtime

  1. The portable C runtime restores snapshots and executes bytecode. It is
     optimized for embedded targets and has a small memory footprint; see
     [memory usage](./native-host/memory-usage.md) and the
     [C integration guide](./getting-started.md#restoring-a-snapshot-in-c).

  2. The TypeScript compiler and reference VM evaluate source and create
     snapshots. They run through host adapters, including the Node.js package,
     the native QuickJS `mvmc` executable, and the browser compiler. The
     compiler core receives source text and does not access the filesystem;
     adapters decide how source and output files are read or written. See
     [compiler tools](../docs/compiler-cli.md), [native mvmc](../docs/native-mvmc.md),
     and the [browser demo](../docs/browser-wasm.md).
