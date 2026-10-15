// Broken-link check: crawls every page of the deployed site (internal links + the e-mail's /plan link shape) and checks
// every external link on those pages plus every source URL in data/*.json and data/*.md.
// Run: node scripts/check-links.mjs [https://….vercel.app]   → docs/qa/links.log, exit 1 on a broken link.
// Hosts that refuse automated fetches (CLAUDE.md "Blocked to automated fetches") answer 401/403/406/429 to scripts; those
// are listed as "blocked to scripts: check in a browser", not as broken.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';

const BASE = (process.argv[2] ?? 'https://etf-landing-page-sigma.vercel.app').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const START = ['/', '/plan/?t=VOO&m=3000&y=20', '/dekujeme/', '/chyba-formulare/', '/chyba-odeslani/', '/ochrana-osobnich-udaju/'];

const found = new Map(); // url -> Set of where it was found
const add = (url, where) => { if (!found.has(url)) found.set(url, new Set()); found.get(url).add(where); };

// 1. Crawl the site.
const seen = new Set();
const queue = [...START];
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const res = await fetch(BASE + path, { headers: { 'user-agent': UA } });
  add(BASE + path, 'crawl');
  if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html')) continue;
  const html = await res.text();
  for (const [, raw] of html.matchAll(/\s(?:href|src)="([^"#][^"]*)"/g)) {
    const href = raw.replace(/&amp;/g, '&');
    if (/^(mailto|tel|javascript|data):/.test(href)) continue;
    const u = new URL(href, BASE + path);
    if (u.origin === new URL(BASE).origin) {
      const p = u.pathname + u.search;
      if (!/\.(js|css|woff2|png|svg|ico|webmanifest)$/.test(u.pathname)) queue.push(p);
      add(u.href.split('#')[0], path);
    } else add(u.href, path);
  }
}

// 2. Source URLs recorded in data/.
for (const f of await readdir('data')) {
  if (!/\.(json|md)$/.test(f)) continue;
  const text = await readFile(`data/${f}`, 'utf8');
  for (const [m] of text.matchAll(/https?:\/\/[^\s"'<>)\]|`]+/g)) add(m.replace(/[.,;:*]+$/, ''), `data/${f}`);
}

// 3. Check each URL once (GET: many servers answer HEAD wrongly; Invesco answers 406 to an explicit accept list).
// Templates in data/ ({date}, YYYY-MM-DD) are skipped.
const check = async (url) => {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    res.body?.cancel();
    return res.status;
  } catch (e) { return `ERR ${e.cause?.code ?? e.name}`; }
};
const urls = [...found.keys()].filter((u) => !/[{}]|YYYY-MM-DD/.test(u));
const results = [];
for (let i = 0; i < urls.length; i += 8) {
  results.push(...await Promise.all(urls.slice(i, i + 8).map(async (u) => [u, await check(u)])));
}

const ok = [], blocked = [], broken = [];
for (const [u, s] of results) {
  const line = `${s}  ${u}  ← ${[...found.get(u)].join(', ')}`;
  if (typeof s === 'number' && s < 400) ok.push(line);
  else if ([401, 403, 405, 406, 429].includes(s)) blocked.push(line); // 406: Invesco refuses Node's fetch, curl gets 200
  else broken.push(line);
}
const out = [`# node scripts/check-links.mjs ${BASE} — ${new Date().toISOString()}`,
  `# ${seen.size} site pages crawled, ${results.length} unique URLs checked`,
  '', `## Broken (${broken.length})`, ...broken, '', `## Blocked to scripts: check in a browser (${blocked.length})`, ...blocked,
  '', `## OK (${ok.length})`, ...ok];
await mkdir('docs/qa', { recursive: true });
await writeFile('docs/qa/links.log', out.join('\n') + '\n');
console.log(out.slice(0, 4 + broken.length + 2 + blocked.length).join('\n'));
process.exit(broken.length ? 1 : 0);
