// Visual QA after `npm run build`: first-screen screenshots of both hero variants, a console-error and overflow scan
// of every page, and public/plan-preview.png (the real plan e-mail, rendered by src/lib/email.ts).
// Run: node scripts/screenshots.mjs   (needs `npx playwright install chromium` once)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { buildPlan } from '../src/lib/plan.ts';
import { renderEmail } from '../src/lib/email.ts';
import { parseSelection } from '../src/lib/selection.ts';
import { US_TICKERS, FX } from '../src/lib/data.ts';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  if (p === '' || p.endsWith('\\') || p.endsWith('/')) p = join(p, 'index.html');
  try {
    const body = await readFile(join('dist', p)).catch(() => readFile(join('dist', p, 'index.html')));
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'text/html; charset=utf-8' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(4399);
const base = 'http://localhost:4399';
await mkdir('docs/screenshots', { recursive: true });

const browser = await chromium.launch();
const problems = [];

// 1. First screen of both heroes, at the full phone viewport and at the Instagram in-app height.
for (const [variant, utm] of [['a', 'ad_a_blocked'], ['b', 'ad_b_fees']]) {
  for (const h of [844, 700]) {
    const page = await browser.newPage({ viewport: { width: 390, height: h }, deviceScaleFactor: 2 });
    await page.goto(`${base}/?utm_source=instagram&utm_medium=paid_social&utm_content=${utm}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/hero-${variant}-390x${h}.png` });
    // What is fully visible above the fold?
    const fold = await page.evaluate((vh) => {
      const vis = (sel) => { const e = document.querySelector(sel); if (!e) return 'missing'; const r = e.getBoundingClientRect(); return r.height === 0 ? 'hidden' : r.bottom <= vh ? 'yes' : `no (bottom ${Math.round(r.bottom)})`; };
      const trust = [...document.querySelectorAll('.trust, [data-trust]')].find((e) => e.getBoundingClientRect().height > 0);
      return { h1: vis('h1'), firstControl: vis('[data-step="a"] button[data-ticker], #in-m'), resultLine: vis('.result-line'),
        trust: trust ? (trust.getBoundingClientRect().bottom <= vh ? 'yes' : `no (bottom ${Math.round(trust.getBoundingClientRect().bottom)})`) : 'not found' };
    }, h);
    console.log(`hero ${variant} 390x${h}:`, JSON.stringify(fold));
    await page.close();
  }
}

// 2. After a chip tap (variant a): the twin list, full page.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto(`${base}/?utm_content=ad_a_blocked`);
  await page.click('button[data-ticker="VOO"]');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/screenshots/tool-after-voo-390.png', fullPage: true });
  await page.close();
}

// 3. Every page: console errors, failed requests, horizontal overflow, tabular figures.
for (const path of ['/', '/?utm_content=ad_b_fees', '/plan/?t=VOO,QQQ&m=5000&y=10&r=5&b=fio&d=acc', '/dekujeme/', '/chyba-formulare/', '/chyba-odeslani/', '/ochrana-osobnich-udaju/']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('console', (m) => m.type() === 'error' && problems.push(`${path} console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`${path} pageerror: ${e.message}`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`${path} ${r.status()} ${r.url()}`));
  await page.goto(base + path);
  await page.evaluate(() => document.fonts.ready);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 0) problems.push(`${path} horizontal overflow ${over}px`);
  if (path === '/') {
    const tnum = await page.evaluate(() => {
      const s = document.createElement('span'); s.className = 'num'; document.body.append(s);
      s.textContent = '1111'; const a = s.getBoundingClientRect().width; s.textContent = '0000'; const b = s.getBoundingClientRect().width; s.remove();
      return { w1111: a, w0000: b, fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`) };
    });
    console.log('tabular figures (equal widths = tnum works):', JSON.stringify(tnum));
  }
  await page.close();
}

// 4. The plan e-mail preview for section 4 ("Co vám přijde e-mailem"): top of the real e-mail for VOO.
{
  const sel = parseSelection(new URLSearchParams('t=VOO'), US_TICKERS);
  const { html } = renderEmail(buildPlan(sel, FX), sel, 'https://etfdvojce.cz');
  const page = await browser.newPage({ viewport: { width: 600, height: 760 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: 'public/plan-preview.png' });
  await page.close();
}

await browser.close();
server.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'No console errors, failed requests or overflow.');
