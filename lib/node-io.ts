import * as fs from 'fs';
import * as os from 'os';

/** Node-only helper for tools and tests that write generated text files. */
export function writeTextFile(filename: string, content: string) {
  fs.writeFileSync(filename, content.replace(/\r?\n/g, os.EOL));
}
