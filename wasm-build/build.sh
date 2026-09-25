#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$script_dir"

cc="${CC:-clang}"
ld="${WASM_LD:-wasm-ld}"
mkdir -p build

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
  --import-memory \
  --initial-memory=262144 \
  --max-memory=262144 \
  -z stack-size=8192 \
  --global-base=0 \
  --Map=build/microvium.map \
  -o build/microvium-runtime.wasm \
  build/allocator.o \
  build/glue.o \
  build/microvium.o \
  build/clib.o
