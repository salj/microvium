#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$script_dir"

cc="${CC:-clang}"
ld="${WASM_LD:-wasm-ld}"
emcc="${EMCC:-emcc}"
mkdir -p build

libc_archive="$("$emcc" --print-file-name=libc.a)"
if [[ ! -f "$libc_archive" ]]; then
  echo "Could not locate Emscripten libc with $emcc; set EMCC or install Emscripten" >&2
  exit 1
fi
libc_dir="$(dirname "$libc_archive")"

cflags=(
  --target=wasm32-unknown-unknown
  -nostdlib
  -O2
  -ffunction-sections
  -fdata-sections
  -I .
  -I ./clib
  -Werror
  -mbulk-memory
)
if [[ "${MVM_SUPPORT_LEGACY_BYTECODE:-0}" == 1 ]]; then
  cflags+=(-DMVM_SUPPORT_LEGACY_BYTECODE=1)
fi

"$cc" "${cflags[@]}" -c "$repo_root/native-vm/microvium.c" -o build/microvium.o
"$cc" "${cflags[@]}" -c allocator.c -o build/allocator.o
"$cc" "${cflags[@]}" -c clib/clib.c -o build/clib.o
"$cc" "${cflags[@]}" -c glue.c -o build/glue.o

"$ld" \
  --no-entry \
  --export-all \
  --gc-sections \
  --lto-O3 \
  --allow-undefined \
  --strip-debug \
  --import-memory \
  --initial-memory=262144 \
  --max-memory=262144 \
  -z stack-size=8192 \
  --global-base=0 \
  -L "$libc_dir" \
  --Map=build/microvium.map \
  -o build/microvium-runtime.wasm \
  build/allocator.o \
  build/glue.o \
  build/microvium.o \
  build/clib.o \
  -lc
