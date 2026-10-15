// Gzip size of the JS a page loads on first view (external <script src> + inline scripts). Budget: < 60 kB gz.
// Run after `npm run build`: node scripts/size.mjs [page.html ...]   (default: dist/index.html)
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const BUDGET = 60 * 1024;
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['dist/index.html'];
const gz = (s) => gzipSync(s).length;
let failed = false;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const rows = [];
  const seen = new Set();
  // Each external module plus every chunk it statically imports (shared chunks counted once).
  const add = (src) => {
    if (seen.has(src)) return;
    seen.add(src);
    const code = readFileSync(join('dist', src), 'utf8');
    rows.push([src, gz(code)]);
    for (const [, rel] of code.matchAll(/(?:import|from)\s*"(\.\/[^"]+\.js)"/g)) add(new URL(rel, `http://x${src}`).pathname);
  };
  for (const [, src] of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) add(src);
  for (const [, body] of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) if (body.trim()) rows.push(['(inline)', gz(body)]);
  const total = rows.reduce((s, [, n]) => s + n, 0);
  console.log(page);
  for (const [name, n] of rows) console.log(`  ${(n / 1024).toFixed(1).padStart(6)} kB  ${name}`);
  console.log(`  ${(total / 1024).toFixed(1).padStart(6)} kB  total (budget ${BUDGET / 1024} kB)`);
  if (total > BUDGET) failed = true;
}
process.exit(failed ? 1 : 0);
