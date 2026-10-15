// Phase 5 QA on a deployed URL: every page on an emulated mid-range Android over throttled 4G (LCP, CLS, console
// errors, failed requests, horizontal overflow), then the same pages with JavaScript off (core message + form still there).
// Run: node scripts/qa-live.mjs [https://….vercel.app]   → docs/qa/qa-live.log, exit 1 on any problem.
// Throttling = Lighthouse's mobile preset (150 ms RTT, 1.6 Mbps down, 750 kbps up, 4× CPU). No consent is given, so
// Umami never loads: this measures the page a visitor from the ad sees first.
import { writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = (process.argv[2] ?? 'https://etf-landing-page-sigma.vercel.app').replace(/\/+$/, '');
const UTM = 'utm_source=instagram&utm_medium=paid_social&utm_campaign=etf_dvojce_2026q4&utm_term=cz&utm_content=';
const PAGES = [
  ['ad A', `/?${UTM}ad_a_blocked`], ['ad B', `/?${UTM}ad_b_fees`], ['no UTM', '/'],
  ['/plan', '/plan/?t=VOO,QQQ&m=3000&y=20&r=5&b=xtb&d=acc'], ['/dekujeme', '/dekujeme/'],
  ['/chyba-formulare', '/chyba-formulare/'], ['/chyba-odeslani', '/chyba-odeslani/'], ['privacy', '/ochrana-osobnich-udaju/'],
];
const DEVICE = { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A346B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' };
const LCP_MS = 2000, CLS_MAX = 0.1;

const lines = [`# node scripts/qa-live.mjs ${BASE} — ${new Date().toISOString()}`, `# device: 412×915 Android UA, 4G 150 ms / 1.6 Mbps, CPU 4×`];
const problems = [];
const browser = await chromium.launch();

for (const [label, path] of PAGES) {
  const ctx = await browser.newContext(DEVICE);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const msgs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) msgs.push(`console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => msgs.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => msgs.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) msgs.push(`HTTP ${r.status()}: ${r.url()}`); });
  // Every shift counts: nobody touches the page here, yet emulated Chrome flags early shifts hadRecentInput (Lighthouse counts them).
  await page.addInitScript(() => {
    window.__lcp = 0; window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);
  const lcp = await page.evaluate(() => window.__lcp);
  // Scroll the whole page so lazy parts, section observers and late shifts are included.
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } });
  await page.waitForTimeout(500);
  const { cls, overflow } = await page.evaluate(() => ({ cls: window.__cls, overflow: document.documentElement.scrollWidth > innerWidth }));
  lines.push(`[${label}] LCP ${Math.round(lcp)} ms · CLS ${cls.toFixed(3)} · overflow ${overflow}${msgs.length ? '\n  ' + msgs.join('\n  ') : ''}`);
  if (lcp > LCP_MS) problems.push(`${label}: LCP ${Math.round(lcp)} ms > ${LCP_MS}`);
  if (cls > CLS_MAX) problems.push(`${label}: CLS ${cls.toFixed(3)}`);
  if (overflow) problems.push(`${label}: horizontal overflow`);
  if (msgs.length) problems.push(`${label}: ${msgs.length} console/network problem(s)`);
  await ctx.close();
}

lines.push('', '# JavaScript off');
for (const [label, path] of PAGES) {
  const ctx = await browser.newContext({ ...DEVICE, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'load' });
  const r = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.innerText.trim().replace(/\s+/g, ' ') ?? '',
    forms: [...document.querySelectorAll('form[action="/api/lead"]')].length,
    tables: document.querySelectorAll('table').length,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  lines.push(`[${label}] h1 "${r.h1.slice(0, 70)}" · lead forms ${r.forms} · tables ${r.tables} · overflow ${r.overflow}`);
  if (!r.h1) problems.push(`no-JS ${label}: no h1`);
  if (r.overflow) problems.push(`no-JS ${label}: horizontal overflow`);
  if (['ad A', 'ad B', 'no UTM'].includes(label) && (!r.forms || !r.tables)) problems.push(`no-JS ${label}: form or twin table missing`);
  await ctx.close();
}

await browser.close();
lines.push('', problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'All checks passed.');
await mkdir('docs/qa', { recursive: true });
await writeFile('docs/qa/qa-live.log', lines.join('\n') + '\n');
console.log(lines.join('\n'));
process.exit(problems.length ? 1 : 0);
