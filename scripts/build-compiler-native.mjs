import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wasmInput = path.join(root, 'dist-web/compiler.wasm');
const compilerConfig = path.join(root, 'dist-web/compiler-config.json');
const outputDir = path.join(root, 'dist-native');

let linkMode = 'dynamic';
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--link') {
    linkMode = args[++i];
    if (!linkMode) throw new Error('--link requires dynamic or static');
  } else if (args[i] === '--static') {
    linkMode = 'static';
  } else if (args[i] === '--dynamic') {
    linkMode = 'dynamic';
  } else {
    throw new Error(`Unknown option: ${args[i]}`);
  }
}
if (!['dynamic', 'static'].includes(linkMode)) {
  throw new Error(`Unknown link mode "${linkMode}"; use dynamic or static`);
}

const outputFile = path.join(outputDir, linkMode === 'static' ? 'microvium-compile-static' : 'microvium-compile');

if (process.platform !== 'linux') {
  throw new Error('The native compiler build currently produces Linux ELF binaries only');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}${result.stderr ? `:\n${result.stderr}` : ''}`);
  }
  return typeof result.stdout === 'string' ? result.stdout.trim() : '';
}

const wasmer = process.env.WASMER || 'wasmer';
const cc = process.env.CC || 'cc';
if (!existsSync(wasmInput)) {
  throw new Error(`Compiler module not found: ${wasmInput}\nBuild it with: npm run build:compiler-wasm`);
}
if (!existsSync(compilerConfig)) {
  throw new Error(`Compiler build metadata not found: ${compilerConfig}\nBuild it with: npm run build:compiler-wasm`);
}
const metadata = JSON.parse(await readFile(compilerConfig, 'utf8'));
if (metadata.defaultFloatWidth !== 32 && metadata.defaultFloatWidth !== 64) {
  throw new Error(`Invalid compiler default float width metadata: ${metadata.defaultFloatWidth}`);
}
const includeDir = run(wasmer, ['config', '--includedir']);
const libraryDir = run(wasmer, ['config', '--libdir']);
const buildDir = await mkdtemp(path.join(os.tmpdir(), 'microvium-native-'));

try {
  await mkdir(outputDir, { recursive: true });
  const moduleFile = path.join(buildDir, 'compiler.wasmu');
  const embedFile = path.join(buildDir, 'compiler-embed.S');
  const embedObject = path.join(buildDir, 'compiler-embed.o');

  run(wasmer, ['compile', '--cranelift', '--enable-simd', wasmInput, '-o', moduleFile], { stdio: 'inherit' });
  const escapedModuleFile = moduleFile.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
  const assembly = `.section .rodata\n.global compiler_wasmu_start\ncompiler_wasmu_start:\n.incbin "${escapedModuleFile}"\n.global compiler_wasmu_end\ncompiler_wasmu_end:\n.section .note.GNU-stack,"",@progbits\n`;
  await writeFile(embedFile, assembly);
  run(cc, ['-c', embedFile, '-o', embedObject], { stdio: 'inherit' });
  const linkerArgs = linkMode === 'static'
    ? ['-Wl,-Bstatic', '-lwasmer', '-Wl,-Bdynamic', '-ldl', '-lpthread', '-lm']
    : [`-Wl,-rpath,${libraryDir}`, '-lwasmer'];
  run(cc, [
    '-O2', ...(linkMode === 'static' ? ['-s'] : []), '-Wall', '-Wextra',
    `-I${includeDir}`,
    path.join(root, 'scripts/wasmer-compiler-launcher.c'),
    embedObject,
    `-L${libraryDir}`, ...linkerArgs,
    '-o', outputFile
  ], { stdio: 'inherit' });
  process.stdout.write(`Native ELF generated (${linkMode} Wasmer link): ${path.relative(root, outputFile)}\n`);
} finally {
  await rm(buildDir, { recursive: true, force: true });
}
