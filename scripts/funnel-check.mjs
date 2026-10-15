// End-to-end check of every funnel event (decisions §12, plan docs/superpowers/plans/2026-10-15-phase4-tracking.md Task 5).
// Builds the site with a fake Umami website ID into .dev/dist-funnel, runs the REAL Umami tracker (fetched from
// cloud.umami.is) in Chromium after the visitor accepts the consent bar, and intercepts its sends to gateway.umami.is: nothing
// reaches Umami. /api/lead runs
// the real handler in Brevo dry-run. Writes docs/funnel-check.log; exits 1 on any mismatch.
// Run: node scripts/funnel-check.mjs   (needs `npx playwright install chromium` once)
// Live: LIVE_URL=https://….vercel.app UMAMI_WEBSITE_ID=<id> node scripts/funnel-check.mjs — no build, no interception:
// the events really go to Umami (check them in its Realtime view) and every send must be stored. Umami answers bots
// (incl. the "HeadlessChrome" user agent) with 200 {"beep":"boop"} and stores nothing, so live runs use a phone UA.
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { handleLead } from '../api/lead.ts';
import { brevoFromEnv } from '../src/lib/brevo.ts';

const LIVE = process.env.LIVE_URL?.replace(/\/+$/, '');
const ID = LIVE ? process.env.UMAMI_WEBSITE_ID : '00000000-0000-4000-8000-000000000000';
if (LIVE && !ID) throw new Error('LIVE_URL needs UMAMI_WEBSITE_ID');
const OUT = '.dev/dist-funnel';
if (!LIVE) execSync(`npx astro build --outDir ${OUT}`, { stdio: 'ignore', env: { ...process.env, PUBLIC_UMAMI_WEBSITE_ID: ID } });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };
const deps = { brevo: brevoFromEnv({}, fetch), now: () => new Date(), log: () => {}, siteUrl: 'http://localhost:4398' };
const server = LIVE ? null : createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:4398');
  if (url.pathname === '/api/lead') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const out = await handleLead(new Request(url, { method: req.method, headers: req.headers, body: Buffer.concat(chunks) }), deps);
    res.writeHead(out.status, Object.fromEntries(out.headers)).end(Buffer.from(await out.arrayBuffer()));
    return;
  }
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (p === '' || p.endsWith('\\') || p.endsWith('/')) p = join(p, 'index.html');
  try {
    const body = await readFile(join(OUT, p)).catch(() => readFile(join(OUT, p, 'index.html')));
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'text/html; charset=utf-8' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(4398);
const base = LIVE ?? 'http://localhost:4398';
const umamiJs = await (await fetch('https://cloud.umami.is/script.js')).text();

const UTM = 'utm_source=instagram&utm_medium=paid_social&utm_campaign=etf_dvojce_2026q4&utm_term=cz&utm_content=';
const browser = await chromium.launch();
const lines = [];
const problems = [];

async function run(label, path, steps) {
  const sent = [];
  let scriptLoaded = false;
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    ...(LIVE && { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' }) });
  if (!LIVE) await page.route('https://cloud.umami.is/script.js', (r) => r.fulfill({ contentType: 'text/javascript', body: umamiJs }));
  page.on('response', async (res) => {
    if (!res.url().startsWith('https://gateway.umami.is/')) return;
    const body = await res.text().catch(() => '');
    if (!res.ok() || body.includes('beep')) problems.push(`${label}: Umami did not store a send (${res.status()} ${body.slice(0, 40)})`);
  });
  await page.route('https://gateway.umami.is/**', (r) => {
    const body = JSON.parse(r.request().postData() ?? '{}');
    sent.push(body);
    const p = body.payload ?? {};
    lines.push(`[${label}] ${(p.name ?? 'page_view (pageview)').padEnd(22)} tag=${p.tag ?? '-'} ${p.name ? JSON.stringify(p.data ?? {}) : `url=${p.url}`}`);
    return LIVE ? r.continue() : r.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  page.on('request', (r) => { const h = new URL(r.url()).host; if (h !== (LIVE && new URL(LIVE).host) && !/^(localhost|cloud\.umami\.is|gateway\.umami\.is)/.test(h)) problems.push(`${label}: unexpected request ${r.url()}`); });
  page.on('request', (r) => { if (r.url().startsWith('https://cloud.umami.is/')) scriptLoaded = true; });
  page.on('pageerror', (e) => problems.push(`${label}: pageerror ${e.message}`));
  lines.push(`--- ${label}: ${path}`);
  await page.goto(base + path);
  await page.waitForTimeout(800);
  await steps(page, () => scriptLoaded);
  await page.waitForTimeout(800);
  await page.close();
  return sent.map((b) => ({ type: b.type, ...(b.payload ?? {}) }));
}

const slowScroll = async (page) => {
  for (let i = 0; i < 80; i++) {
    const done = await page.evaluate(() => { scrollBy(0, 250); return innerHeight + scrollY >= document.body.scrollHeight - 2; });
    await page.waitForTimeout(60);
    if (done) break;
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
};
// The bar appears after the first scroll/tap/key; before the answer the tracker must not even be downloaded.
async function consent(page, label, v, loaded) {
  await page.waitForSelector('.consent');
  if (loaded()) problems.push(`${label}: Umami script requested before consent`);
  await page.click(`.consent button[data-consent="${v}"]`);
  await page.waitForTimeout(600);
}
const keys = async (page, sel, key, n) => { await page.focus(sel); for (let i = 0; i < n; i++) await page.keyboard.press(key); };

// --- expectations
const count = (ev, name) => ev.filter((e) => (name === 'page_view' ? !e.name : e.name === name)).length;
const find = (ev, name, pred = () => true) => ev.find((e) => e.name === name && pred(e.data ?? {}));
function expect(label, ev, tag, counts, props = []) {
  for (const [name, n] of Object.entries(counts)) if (count(ev, name) !== n) problems.push(`${label}: ${name} ×${count(ev, name)}, expected ×${n}`);
  // Umami funnels are ordered: each step must reach Umami after the one before it.
  const at = (name, loc) => ev.findIndex((e) => e.name === name && (!loc || e.data?.location === loc));
  for (const [x, y, loc] of [['interaction_start', 'interaction_complete'], ['form_view', 'form_start', 'inline'], ['form_view', 'form_start', 'footer'],
    ['form_start', 'lead_submitted', 'inline'], ['form_start', 'lead_submitted', 'footer']]) {
    if (at(y, loc) >= 0 && !(at(x, loc) >= 0 && at(x, loc) < at(y, loc))) problems.push(`${label}: ${y}${loc ? ' ' + loc : ''} reached Umami before ${x}`);
  }
  if (ev.some((e) => /fbclid|[?&](t|m|y|r|b|d)=/.test(String(e.url)))) problems.push(`${label}: URL sent with non-UTM params`);
  if (ev.length && ev[0].name) problems.push(`${label}: first send is ${ev[0].name}, expected the pageview`);
  for (const e of ev) {
    if (e.website !== ID) problems.push(`${label}: wrong website ${e.website}`);
    if (e.tag !== tag) problems.push(`${label}: ${e.name ?? 'pageview'} tag=${e.tag}, expected ${tag}`);
    if (JSON.stringify(e.data ?? {}).includes('@') || String(e.url).includes('@')) problems.push(`${label}: '@' in ${e.name}`);
  }
  for (const [name, want] of props) if (!find(ev, name, (d) => Object.entries(want).every(([k, v]) => d[k] === v))) problems.push(`${label}: no ${name} with ${JSON.stringify(want)}`);
}
const ONCE = ['interaction_start', 'interaction_complete'];

// 1. Ad A: chips, sliders, broker, dividends, full scroll, why-link, sticky CTA, empty + bad e-mail, success.
const a = await run('ad A', `/?${UTM}ad_a_blocked&fbclid=IwAR0test`, async (page, loaded) => {
  await page.click('button[data-ticker="VOO"]');
  await consent(page, 'ad A', 'yes', loaded);
  await page.click('button[data-ticker="QQQ"]');
  await page.click('button[data-ticker="VOO"]');
  await page.click('[data-next="b"]');
  await keys(page, '#in-m', 'ArrowRight', 10);
  await page.click('label:has(input[name="broker"][value="xtb"])');
  await page.click('label:has(input[name="dividends"][value="acc"])');
  await slowScroll(page);
  await page.click('a[data-cta="why"]');
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.click('[data-sticky] a');
  await page.waitForTimeout(600);
  await page.click('#lead-inline button[type="submit"]');
  await page.fill('#lead-inline-email', 'a@b');
  await page.click('#lead-inline button[type="submit"]');
  await page.fill('#lead-inline-email', 'test@example.com');
  await page.click('#lead-inline button[type="submit"]');
  await page.waitForSelector('.thanks');
});
expect('ad A', a, 'a', { page_view: 1, interaction_start: 1, interaction_complete: 1, step_complete: 3, section_view: 7, form_view: 2,
  form_start: 1, cta_click: 5, form_error: 2, lead_submitted: 1, thank_you_view: 1, magnet_opened: 0 }, [
  ['interaction_start', { step: 'a', ad_variant: 'a' }], ['step_complete', { step: 'a', tickers: 'VOO' }],
  ['step_complete', { step: 'b', monthly: 3500, years: 20 }], ['step_complete', { step: 'c', dividends: 'acc' }],
  ['interaction_complete', { tickers: 'VOO', monthly: 3000, years: 20 }], ['cta_click', { location: 'why' }], ['cta_click', { location: 'sticky' }],
  ['form_start', { location: 'inline' }], ['form_error', { reason: 'empty', location: 'inline' }], ['form_error', { reason: 'invalid', location: 'inline' }],
  ['lead_submitted', { location: 'inline', ad_variant: 'a' }], ['thank_you_view', { location: 'inline' }]]);
for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content=ad_a_blocked']) if (!a.find((e) => !e.name)?.url.includes(k)) problems.push(`ad A: pageview url lacks ${k}`);

// 2. Ad B: no touch for 2 s (result pre-rendered: no interaction events), then horizon slider, plan CTA, footer form
//    with one forced server error, then success.
let failNext = true;
const b = await run('ad B', `/?${UTM}ad_b_fees`, async (page, loaded) => {
  await page.waitForTimeout(2000);
  if (await page.locator('.consent').count()) problems.push('ad B: consent bar shown before any interaction');
  const early = lines.filter((l) => l.startsWith('[ad B]') && ONCE.concat('step_complete').some((n) => l.includes(` ${n} `)));
  if (early.length) problems.push(`ad B: interaction events without a touch: ${early.join(' | ')}`);
  await keys(page, '#in-y', 'ArrowLeft', 1);
  await consent(page, 'ad B', 'yes', loaded);
  await keys(page, '#in-y', 'ArrowLeft', 2);
  await page.locator('a[data-cta="plan"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.click('a[data-cta="plan"]');
  await page.waitForTimeout(600);
  await page.route('**/api/lead', (r) => (failNext ? (failNext = false, r.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false,"reason":"server"}' })) : r.fallback()));
  await page.locator('#lead-footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.fill('#lead-footer-email', 'test@example.com');
  await page.click('#lead-footer button[type="submit"]');
  await page.waitForTimeout(400);
  await page.click('#lead-footer button[type="submit"]');
  await page.waitForSelector('.thanks');
});
expect('ad B', b, 'b', { page_view: 1, interaction_start: 1, interaction_complete: 1, step_complete: 1, form_start: 2, cta_click: 3,
  form_error: 1, lead_submitted: 1, thank_you_view: 1 }, [
  ['interaction_start', { step: 'b', ad_variant: 'b' }], ['step_complete', { step: 'b', monthly: 3000, years: 19 }],
  ['interaction_complete', { tickers: 'VOO', monthly: 3000, years: 19 }], ['cta_click', { location: 'plan' }], ['form_view', { location: 'footer' }],
  ['form_start', { location: 'footer' }], ['form_error', { reason: 'server', location: 'footer' }],
  ['lead_submitted', { location: 'footer', ad_variant: 'b' }], ['thank_you_view', { location: 'footer' }]]);
for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content=ad_b_fees']) if (!b.find((e) => !e.name)?.url.includes(k)) problems.push(`ad B: pageview url lacks ${k}`);

// 3. No UTM (or an unknown ad): tag unknown, nothing but pageview + sections.
const n = await run('no UTM', '/', async (page, loaded) => {
  await page.mouse.wheel(0, 300);
  await consent(page, 'no UTM', 'yes', loaded);
});
expect('no UTM', n, 'unknown', { page_view: 1, interaction_start: 0, lead_submitted: 0 });

// 4. /plan from the e-mail link: magnet_opened once; without utm_source=email: none.
const planQ = '/plan/?t=VOO&m=3000&y=20&r=5&b=xtb&d=acc';
const p1 = await run('/plan from e-mail', `${planQ}&utm_source=email`, async (page, loaded) => {
  await page.mouse.wheel(0, 300);
  await consent(page, '/plan from e-mail', 'yes', loaded);
  await page.reload(); // the stored "Souhlasím": no bar, tracker loads straight away
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);
  if (await page.locator('.consent').count()) problems.push('/plan: consent bar shown again after Souhlasím');
});
expect('/plan from e-mail', p1, 'unknown', { page_view: 2, magnet_opened: 2 });
const p2 = await run('/plan direct', planQ, async (page, loaded) => {
  await page.mouse.wheel(0, 300);
  await consent(page, '/plan direct', 'yes', loaded);
});
expect('/plan direct', p2, 'unknown', { page_view: 1, magnet_opened: 0 });

// 5. Refusal: the same ad A path, "Nesouhlasím": the tracker is never downloaded and nothing is sent.
let refusedLoaded = false;
const x = await run('ad A refused', `/?${UTM}ad_a_blocked`, async (page, loaded) => {
  await page.click('button[data-ticker="VOO"]');
  await consent(page, 'ad A refused', 'no', loaded);
  await keys(page, '#in-m', 'ArrowRight', 2);
  await slowScroll(page);
  await page.fill('#lead-inline-email', 'test@example.com');
  await page.click('#lead-inline button[type="submit"]');
  await page.waitForSelector('.thanks');
  await page.click('[data-consent-open]'); // footer link brings the choice back (art. 7(3) GDPR)
  if (!(await page.locator('.consent').count())) problems.push('ad A refused: footer link did not reopen the bar');
  refusedLoaded = loaded();
});
if (x.length || refusedLoaded) problems.push(`ad A refused: ${x.length} sends, script loaded: ${refusedLoaded}`);

// 7. Bar still open (no answer yet): it is first in tab order and the sticky CTA never lands the form heading under it.
const o = await run('bar open', `/?${UTM}ad_a_blocked`, async (page) => {
  await page.click('button[data-ticker="VOO"]');
  await page.waitForSelector('.consent');
  const firstFocusable = await page.evaluate(() => !![...document.querySelectorAll('a[href],button,input,select,textarea')]
    .find((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed')?.closest('.consent'));
  if (!firstFocusable) problems.push('bar open: the consent bar is not first in keyboard order');
  await page.waitForSelector('[data-sticky]:not([hidden])');
  await page.click('[data-sticky] a');
  await page.waitForTimeout(1500);
  const covered = await page.evaluate(() => document.querySelector('#lead-inline-h').getBoundingClientRect().top
    < document.querySelector('.consent').getBoundingClientRect().bottom);
  if (covered) problems.push('bar open: consent bar covers the form heading after the sticky CTA');
});
if (o.length) problems.push(`bar open: ${o.length} sends without an answer`);

await browser.close();
server?.close();
lines.push('', problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'All expectations met.');
await writeFile(LIVE ? 'docs/funnel-check-live.log' : 'docs/funnel-check.log', `# node scripts/funnel-check.mjs — ${new Date().toISOString()}\n${lines.join('\n')}\n`);
console.log(lines.join('\n'));
process.exit(problems.length ? 1 : 0);
