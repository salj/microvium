import { compileSource } from './entry';

declare const Javy: {
  IO: {
    readSync(fd: number, buffer: Uint8Array): number;
    writeSync(fd: number, buffer: Uint8Array): number;
  };
};

const chunks: Uint8Array[] = [];
let inputLength = 0;
for (;;) {
  const chunk = new Uint8Array(8192);
  const bytesRead = Javy.IO.readSync(0, chunk);
  if (bytesRead === 0) break;
  chunks.push(chunk.subarray(0, bytesRead));
  inputLength += bytesRead;
}

const input = new Uint8Array(inputLength);
let offset = 0;
for (const chunk of chunks) {
  input.set(chunk, offset);
  offset += chunk.length;
}

try {
  const snapshot = compileSource(new TextDecoder().decode(input));
  Javy.IO.writeSync(1, snapshot);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  Javy.IO.writeSync(2, new TextEncoder().encode(message + '\n'));
  throw error;
}
