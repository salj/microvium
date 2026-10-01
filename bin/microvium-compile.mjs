#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Buffer } from 'node:buffer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const compilerBundle = path.join(root, 'dist-web/compiler-entry.js');

function usage() {
  return `Usage: microvium-compile [options] [input.js|-]

Compile Microvium JavaScript source into a .mvm-bc snapshot using Node.js.
Input defaults to stdin; output defaults to stdout for stdin input,
or to an adjacent .mvm-bc file for a named input file.

Options:
  -o, --output FILE       Snapshot path, or - for stdout
  -h, --help              Show this help`;
}

function parseArgs(argv) {
  const options = { input: '-', output: undefined };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--output' || arg === '-o') {
      options.output = argv[++i];
      if (!options.output) throw new Error(`${arg} requires a path`);
    } else if (arg.startsWith('-') && arg !== '-') {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }
  if (positional.length > 1) throw new Error('Expected at most one input file');
  if (positional.length) options.input = positional[0];
  if (options.output === undefined) {
    options.output = options.input === '-'
      ? '-'
      : `${options.input.endsWith('.mvm.js') ? options.input.slice(0, -7) : options.input.replace(/\.[^/.]+$/, '')}.mvm-bc`;
  }
  return options;
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    if (!existsSync(compilerBundle)) {
      throw new Error(`Compiler bundle not found: ${compilerBundle}\nBuild it with: npm run build:compiler-bundle`);
    }

    await import(pathToFileURL(compilerBundle).href);
    const compileSource = globalThis.__mvmCompileSource;
    if (typeof compileSource !== 'function') throw new Error('Compiler bundle did not expose compileSource');

    const source = options.input === '-'
      ? readFileSync(0, 'utf8')
      : readFileSync(options.input, 'utf8');
    const result = Buffer.from(compileSource(source));
    if (options.output === '-') {
      process.stdout.write(result);
    } else {
      writeFileSync(options.output, result);
      process.stderr.write(`Output generated: ${options.output}\n${result.length} bytes\n`);
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    if (!process.exitCode) process.exitCode = 1;
  }
}

main();
