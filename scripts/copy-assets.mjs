// Cross-platform script: copies src/assets → dist/assets after tsc compilation.
// Binary files (images, SVGs) are not emitted by tsc, so this step is required.
import { cpSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'src', 'assets');
const dest = resolve(root, 'dist', 'assets');

if (!existsSync(src)) {
  console.warn(`[copy-assets] Source folder not found: ${src}`);
  process.exit(0);
}

cpSync(src, dest, { recursive: true });
console.log(`[copy-assets] Copied ${src} → ${dest}`);
