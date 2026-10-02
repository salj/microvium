# Memory usage

Flash and RAM use depend on the build configuration, host port, and script.
The old blanket claims of a sub-16 kB engine and 64 B idle RAM no longer
describe the current tree.

## Runtime code size

The repository's current Cortex-M0 size check reports **26,869 bytes** of
`.text` in `size-test/output/size.txt`. It compiles `native-vm/microvium.c`
for Cortex-M0/Thumb with `-Os`, using `size-test/microvium_port.h`. Float and
int32 overflow checks are enabled; safe-mode, untrusted-bytecode, snapshot,
and debug checks are disabled. This is an object-file measurement, not a final
linked firmware image; it excludes the host port and linked libraries. Other
targets and feature settings produce different sizes. Run
`npm run size-check` to refresh the measurement.

## Per-VM memory

The VM obtains its state, import table, globals, execution stack, and managed
heap from the host allocator. Stack and register memory are released when a VM
call returns. The heap grows only as allocations are needed and is collected
by a copying garbage collector. The host can inspect current and peak values
with `mvm_getMemoryStats`; see its fields in [`microvium.h`](../../native-vm/microvium.h).

The example port configures a 256-byte execution stack and a 1,024-byte maximum
managed heap. These are port defaults, not fixed engine requirements. Tune
them for the script and host; `stackHighWaterMark` and
`virtualHeapHighWaterMark` report observed peaks.

VM values use 16-bit `mvm_Value` slots. Each slot can contain a small value
directly or refer to a managed allocation, so the actual footprint depends on
the values and objects used by the script. See
[memory management](./memory-management.md) for GC and host-handle rules.

## Snapshot and address limits

The current snapshot header is 28 bytes, and an empty snapshot is 50 bytes in
the minimal-size test. Snapshot images and the VM's virtual ROM and RAM regions
are each limited to 64 kB. This does not limit the size of the firmware that
contains Microvium. See [Microvium vs mJS](../microvium-vs-mjs.md) for the
address-space model.

See also:

- [`size-test/size-tests.md`](../../size-test/size-tests.md)
- [`test/minimal-size.test.ts`](../../test/minimal-size.test.ts)
