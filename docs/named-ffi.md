# Named FFI linking

Snapshots use numeric call IDs internally. The v9 named-linking section adds a
host-facing name and signature for selected imports and exports; the VM still
passes IDs and Microvium `Value`s at runtime.

## Source declarations

Annotate a static named import with its fixed-arity signature. The signature
types supported by this ABI are all `Value`:

```js
/** @mvm-ffi (Value, Value) -> Value */
import { add as plus } from 'math';

/** @mvm-ffi */
export function run(value) {
  return plus(value, 2);
}
```

The import name is `math:add`; the local alias `plus` is only used by the
source. The export name is `run`. Export arity comes from its declared
parameters, so `@mvm-ffi` can omit the signature. If an explicit export
signature is present, its arity must match.

Current declarations have these limits:

- imports must be static named imports; default and namespace imports are
  rejected;
- exports must be direct named function declarations; re-exports, export
  aliases, and variable exports are rejected;
- each function has at most 255 parameters, and every parameter and result is
  a Microvium `Value`;
- dynamic imports and module loading are not part of this ABI.

Unannotated imports and calls to `vmImport(id)` / `vmExport(id, value)` keep
their numeric behavior. The compiler assigns named call IDs from the free
16-bit slots after reserving numeric IDs used by the source.

## JavaScript host

Pass named implementations while compiling or restoring:

```js
const sourceText = `
  /** @mvm-ffi (Value, Value) -> Value */
  import { add as plus } from 'math';
  /** @mvm-ffi */
  export function run(value) { return plus(value, 2); }
`;

const vm = create({}, {
  noLib: true,
  namedImports: {
    math: { add: (a, b) => a + b },
  },
});
vm.evaluateModule({ sourceText });
const snapshot = vm.createSnapshot();

const restored = restore(snapshot, {}, {
  namedImports: { math: { add: (a, b) => a + b } },
});
restored.resolveNamedExport('run')(5); // 7
```

Restore fails with `MVM_E_FFI_ABI_ERROR` if a required named import is missing
or its binding does not match. The JavaScript host adapters also require the
implementation's declared `Function.length` to match the fixed arity; default
and rest parameters affect that value. Calling a named export checks its fixed
arity.

## C host

Use `mvm_restoreNamed` to preserve numeric imports while leaving named imports
for the linker:

```c
mvm_VM* vm = NULL;
mvm_TeError err = mvm_restoreNamed(&vm, bytecode, bytecodeSize, context,
                                   resolve_numeric_import);
```

Query `mvm_getNamedFFIScratchSize`, allocate that scratch buffer in the host,
then enumerate imports with `mvm_getNamedImport`. The returned name pointers
refer to the caller's scratch buffer and remain valid until it is reused.
Compare or copy each name, bind its implementation with
`mvm_bindNamedImport(vm, callID, argumentCount, handler)`, then call
`mvm_finalizeNamedImports` before running the VM. Finalization returns
`MVM_E_FFI_ABI_ERROR` if any named import remains unbound.

Use `mvm_getNamedExport` to enumerate exported names. `mvm_callNamedExport`
accepts the export's numeric ID and checks its fixed arity before dispatch.
Both enumeration APIs use host-provided scratch. The VM keeps one 16-bit arity
entry per import for constant-time call checks; it does not copy decoded names
into the VM heap.

## Snapshot representation and compatibility

The FFI section is a prototype table. Its header is four canonical unsigned
LEB128 varints restricted to 16-bit values, in this order: symbol count,
signature count, import count, and export count. An empty table is four zero
bytes. The same varint encoding is used for indexes and IDs.

Symbols are UTF-8 byte strings sorted by byte order. Each record stores a
varint prefix length, an optional varint absolute start offset when the prefix
length is nonzero, a varint literal-tail length, and the literal tail bytes.
The backreference can point anywhere in the earlier decoded symbol stream,
including across symbol boundaries. A zero prefix length is the literal form
and has no start offset. The encoder uses a reference only when its complete
record is smaller than the literal form.

Each signature is an argument-count byte, one type byte per argument, and one
result-type byte. Type zero means `Value`. Identical signatures are stored
once. An import row stores varint values for call ID, module-name index,
import-name index, and signature index. An export row stores varint values for
export ID, export-name index, and signature index. IDs still cover the full
16-bit call-ID space.

This is a hard cut from the previous prototype FFI table layout. There is no
compatibility decoder; snapshots using that table need to be recompiled. The
table format does not change call IDs or add symbol processing to the runtime
call path. The C enumeration API decodes names into host-provided scratch
memory.

v8.1 snapshots have no named metadata and remain a separate legacy format.
They are rejected by default. Build the C runtime with
`MVM_SUPPORT_LEGACY_BYTECODE=1` to opt in; the TypeScript reader also requires
`supportLegacyBytecode: true`. Resnapshotting an opted-in v8.1 VM writes the
current snapshot format.
