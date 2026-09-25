#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultWasm = path.join(root, 'dist-web/compiler.wasm');
const maxOutputBytes = 64 * 1024 * 1024;

function usage() {
  return `Usage: microvium-compile [options] [input.js|-]

Compile Microvium JavaScript source into a .mvm-bc snapshot using the WASI
compiler. Input defaults to stdin; output defaults to stdout for stdin input,
or to an adjacent .mvm-bc file for a named input file.

Options:
  -o, --output FILE       Snapshot path, or - for stdout
  -r, --runtime NAME      wasmtime or wasmer (default: prefers wasmer)
      --wasm FILE         Compiler module (default: dist-web/compiler.wasm)
  -h, --help              Show this help`;
}

function parseArgs(argv) {
  const options = { input: '-', output: undefined, runtime: undefined, wasm: defaultWasm };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--output' || arg === '-o') {
      options.output = argv[++i];
      if (!options.output) throw new Error(`${arg} requires a path`);
    } else if (arg === '--runtime' || arg === '-r') {
      options.runtime = argv[++i];
      if (!options.runtime) throw new Error(`${arg} requires a runtime name`);
    } else if (arg === '--wasm') {
      options.wasm = argv[++i];
      if (!options.wasm) throw new Error('--wasm requires a path');
    } else if (arg.startsWith('-') && arg !== '-') {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length > 1) throw new Error('Expected at most one input file');
  if (positional.length) options.input = positional[0];
  if (options.runtime && !['wasmtime', 'wasmer'].includes(options.runtime)) {
    throw new Error(`Unknown WASI runtime "${options.runtime}"; use wasmtime or wasmer`);
  }
  if (options.output === undefined) {
    options.output = options.input === '-'
      ? '-'
      : `${options.input.endsWith('.mvm.js') ? options.input.slice(0, -7) : options.input.replace(/\.[^/.]+$/, '')}.mvm-bc`;
  }
  return options;
}

function chooseRuntime(requested) {
  const candidates = requested ? [requested] : ['wasmer', 'wasmtime'];
  for (const runtime of candidates) {
    const result = spawnSync(runtime, ['--version'], { stdio: 'ignore' });
    if (!result.error && result.status === 0) return runtime;
  }
  if (requested) throw new Error(`Could not run ${requested}; check that it is installed and on PATH`);
  throw new Error('No WASI runtime found; install Wasmer or Wasmtime and ensure it is on PATH');
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }

    const wasmPath = path.resolve(options.wasm);
    if (!existsSync(wasmPath)) {
      throw new Error(`Compiler module not found: ${wasmPath}\nBuild it with: npm run build:compiler-wasm`);
    }
    const source = options.input === '-' ? readFileSync(0) : readFileSync(options.input);
    const runtime = chooseRuntime(options.runtime);
    const result = spawnSync(runtime, ['run', wasmPath], {
      input: source,
      encoding: 'buffer',
      maxBuffer: maxOutputBytes
    });

    if (result.error) throw result.error;
    if (result.stderr?.length) process.stderr.write(result.stderr);
    if (result.status !== 0) process.exitCode = result.status ?? 1;
    else if (options.output === '-') process.stdout.write(result.stdout);
    else {
      writeFileSync(options.output, result.stdout);
      process.stderr.write(`Output generated: ${options.output}\n${result.stdout.length} bytes\n`);
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    if (!process.exitCode) process.exitCode = 1;
  }
}

main();
