#!/usr/bin/env bash
set -euo pipefail

version=v9.1.0
root="$(cd "$(dirname "$0")/.." && pwd)"
tools_dir="$root/.tools"

case "$(uname -s)" in
  Linux) platform=linux ;;
  Darwin) platform=macos ;;
  MINGW*|MSYS*|CYGWIN*) platform=windows ;;
  *)
    echo "Javy ${version} has no release build for this operating system" >&2
    exit 1
    ;;
esac

case "$(uname -m)" in
  x86_64|amd64|AMD64) arch=x86_64 ;;
  # Javy labels its AArch64 release builds "arm".
  aarch64|arm64|AARCH64|ARM64) arch=arm ;;
  *)
    echo "Javy ${version} has no release build for this architecture" >&2
    exit 1
    ;;
esac

case "${arch}-${platform}" in
  arm-linux) sha256=826962f0e82354cf97d6e928ea36777872bbae76c626e326948e0367c4b55cb5 ;;
  arm-macos) sha256=99e9ec6a8e8c98e119d137c08a921d2443d3b873c675a5571e1800f4451e6294 ;;
  arm-windows) sha256=9d6b9d5a17285e88a2b9aa7d91bee910d6da8e918f185b7fbd199933a07369d2 ;;
  x86_64-linux) sha256=a68b122d48eb3dfc1b801d4e14c39271fde3638243d3272d206e376ac9189e39 ;;
  x86_64-macos) sha256=6eed2927575dc2b3fb5a1563eee1ce0874e6da91c9cec39a728c9377a8cc7b5a ;;
  x86_64-windows) sha256=7148baab85d7426e8c18e2cc4deed4e9f03270cf3245dba5617a5be25a1de836 ;;
  *)
    echo "Javy ${version} has no release build for ${arch}-${platform}" >&2
    exit 1
    ;;
esac

asset="javy-${arch}-${platform}-${version}.gz"
binary="$tools_dir/javy"
if [[ "$platform" == windows ]]; then
  binary+=".exe"
fi

mkdir -p "$tools_dir"
archive="$tools_dir/$asset"
curl --fail --location --silent --show-error \
  "https://github.com/bytecodealliance/javy/releases/download/${version}/${asset}" \
  --output "$archive"
if command -v sha256sum >/dev/null 2>&1; then
  actual_sha256="$(sha256sum "$archive" | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  actual_sha256="$(shasum -a 256 "$archive" | awk '{print $1}')"
else
  echo "Need sha256sum or shasum to verify $asset" >&2
  exit 1
fi
if [[ "$actual_sha256" != "$sha256" ]]; then
  echo "SHA-256 mismatch for $asset" >&2
  exit 1
fi

gzip -dc "$archive" > "$binary"
chmod +x "$binary"
"$binary" --version
