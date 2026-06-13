// Cross-platform script: copies static files that TypeScript does not emit.
import { cpSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const staticTargets = [
  ['src/assets', 'dist/assets'],
  ['src/docs/openapi.yml', 'dist/docs/openapi.yml'],
];

for (const [sourcePath, destinationPath] of staticTargets) {
  const src = resolve(root, sourcePath);
  const dest = resolve(root, destinationPath);

  if (!existsSync(src)) {
    console.warn(`[copy-assets] Source not found: ${src}`);
    continue;
  }

  cpSync(src, dest, { recursive: true });
  console.log(`[copy-assets] Copied ${src} → ${dest}`);
}
