# Phase 3 — Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A locally running ETF Dvojče landing page (Astro static + one vanilla-TS island), the tested fee calculator, the
form with a tested `/api/lead` Vercel function (Brevo behind env vars, dry-run without them), `/plan`, legal pages and
a no-JS fallback. No deploy, no accounts, no analytics.

**Architecture:** Astro builds static HTML from `content/page.md` copy and `data/*.json`. Pure logic lives in
`src/lib/*.ts` (calculator, input allow-list, plan model, e-mail renderer) and is shared by the island, `/plan` and
`api/lead.ts`. Node 26 runs `.ts` natively, so tests are `node --test` with no test framework. A tiny inline head
script sets `html.js` and `data-variant` before first paint, so the ad-B hero swaps without flash or CLS, and no-JS
visitors get the static table and a plain-POST form.

**Tech Stack:** Astro 7.3.x (only dependency), TypeScript (Node type-stripping), `node:test`, Brevo REST v3 via
`fetch`, ČNB `exrates/daily` API at build time.

**Spec:** `docs/decisions.md` (§3–6a, §8, §10–12, §14), `content/page.md`, `content/email.md`,
`content/calc-examples.mjs`, `data/sources.md` §7–8, `data/NOTES.md`, `CLAUDE.md`.

## Global Constraints

- Only dependency: `astro`. Anything else (Playwright, Vercel CLI, adapters, fontkit) → ask Matěj first.
- JS on first load < 60 kB gzipped; LCP < 2.0 s throttled 4G (measured in Phase 5); no font CLS.
- All copy verbatim from `content/page.md` / `content/email.md`. Every `{…}` is computed from `data/` at build or
  run time. No number typed by hand in `src/` (exceptions: UI ranges and the 2 % fixed-fee note threshold, which are
  product decisions recorded in decisions §15, not data).
- `[DOPLNIT …]` placeholders stay visible and marked; they are listed in the README later.
- Vykání, lowercase "vy/vám". Never "ETF z NYSE", never "lower tax", never "twin is cheaper", never "Fio prodává".
- Design: decisions §10 tokens (`paper #F1F3EE`, `ink #1A2421`, `muted #5A6762`, `blocked #B8361E`, `allowed #17704A`,
  `marker #F3DC5A`), Archivo self-hosted, single column 16 px gutter / 36rem desktop, chips pill, result block square
  with 2 px ink rule, one user-triggered animation, `prefers-reduced-motion` respected. Banned list in §10.
- a11y: AA contrast, tap targets ≥ 44 px, labels on inputs, `aria-live` on the result, focus visible.
- `/api/lead` follows decisions §6a rules 1–6 exactly. Secrets only in env; `.env.example` committed.
- Ponytail must not remove: a11y attributes, consent text, honeypot, server validation, source/date labels.
- No analytics code (Phase 4). Leave `data-section` attributes on sections so Phase 4 can hook in without markup edits.
- Commits: small, English, conventional prefix, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Every subagent prompt is logged verbatim in `docs/ai-worklog.md` before dispatch; every review finding after.

## Decisions this plan takes (go to `docs/decisions.md` §15 in Task 1)

| # | Decision | Why |
|---|---|---|
| 1 | Sliders: monthly 500–30 000 Kč step 500 (default 3 000), years 1–40 (default 20), return 0–10 % step 0,5 (default 5) | page.md left the range to Phase 3; 30 000 keeps Fio under its 1 400 EUR tier at default rate but the 4,95 EUR tier is still reachable at high EUR rates |
| 2 | ETF side uses the **highest TER** among the visitor's shown twins (VOO → 0,07 %, labelled with that fund's ticker, VUAA first on ties in data order) | never flatters the ETF; reproduces calc-examples |
| 3 | "Nevím" = commission 0 + the **highest published FX surcharge** computed from `brokers.json` (today XTB 0,5 %) | page.md copy |
| 4 | ČS: 0,35 % **min. 4 EUR** per buy (the Xetra rule) + custody 0,08 % p.a. added to ongoing cost | conservative and matches the "pevný poplatek" copy for ČS; the no-minimum fractional regular order (internet banking only) would make ČS cheaper at small amounts — **flagged to Matěj** |
| 5 | XTB 0,2 % above 100 000 EUR monthly turnover ignored | `shortcut:` comment; only matters for a sale above 100 000 EUR |
| 6 | Twin order everywhere: accumulating first, then alphabetical by Xetra ticker | page.md §9 and result example "SPYL · SXR8 · VUAA"; "Pořadí není doporučení" stays |
| 7 | Picks sharing an index are grouped ("VOO, SPY, IVV → S&P 500") in result, thank-you table, e-mail, `/plan` | avoids three identical tables |
| 8 | Fallback form (no picks) → plan for VOO, SPY, IVV; subject "Váš ETF plán pro S&P 500" | page.md §7, email.md subject |
| 9 | URL / hidden-field param names: `t` (tickers, comma), `m`, `y`, `r`, `b` (`unknown`/`xtb`/`t212`/`fio`/`cs`), `d` (`acc`/`dist`/`both`) | short `/plan` links |
| 10 | Honeypot field name `fld_q8` | meaningless to autofill (§5) |
| 11 | `/api/lead` order: upsert contact → send e-mail → set `PLAN_SENT_AT`. Failure in step 1–2 → 502; failure in step 3 → logged, still 200 | a failed send never blocks the visitor for 24 h |
| 12 | Newsletter consent stored as `NEWSLETTER=true` + `NEWSLETTER_CONSENT_AT` + `CONSENT_TEXT_V=1`; an unticked box never clears an earlier consent | GDPR art. 7(1) demonstrability |
| 13 | No-JS form: server answers form-encoded POSTs with 303 → `/dekujeme/` or `/chyba-formulare/`; JSON POSTs get JSON | §4 no-JS requirement |
| 14 | Hero variant chosen by a ≤ 300 B inline head script (`html.js`, `data-variant`) | no flash/CLS; no-JS = variant A |
| 15 | Without `BREVO_API_KEY` the function runs in **dry-run**: logs and writes the e-mail to `.dev/last-email.html` (gitignored) | local testing, and the source of the real e-mail screenshot for section 4 |
| 16 | Daily FX rebuild (proposal only): **GitHub Actions `schedule` → `curl -X POST` a Vercel Deploy Hook** (hook URL as a repo secret) | no extra function; Vercel cron would need a function that calls the hook anyway. Caveat: GitHub pauses schedules after 60 days without repo activity |
| 17 | Rate limit (proposal only): (a) Vercel WAF rate-limit rule on `/api/lead` if Hobby allows it — VERIFY; (b) Upstash Redis free tier — needs an account | decisions §6a rule 5 |

## Review Focus

1. **Instagram in-app browser height (~700 px usable at 390 wide):** hero B with sliders must still show headline,
   sub, the first slider and the result line. Task 13 screenshots at 390×844 *and* 390×700; shorten hero B sub first.
2. **Double submit** (inline, then sticky; or double tap): button disabled while sending; server dedupe (rule 3) is
   the real guard. Test in Task 8: second POST within 24 h → 200, no second `sendEmail` call.
3. **Brevo down or slow:** fetch timeout 8 s → 502 → "Plán se nepodařilo odeslat…" and the form stays usable. Test
   in Task 8.
4. **Unusual but valid e-mails** (`Jana.Novak+etf@Seznam.CZ`, surrounding spaces) accepted and lowercased; header
   injection (`a@b.cz\r\nBcc: x@y.cz`) rejected. Test in Task 6.
5. **Fixed-fee tier crossing:** Fio at a monthly amount above 1 400 EUR and the sale value above 3 000 EUR use the
   right tier; ČS minimum dominates at small amounts. Tests in Task 5.

---

## File structure

```
astro.config.mjs            static output, fonts, dev proxy /api -> :8787
package.json                scripts: dev, build (prebuild = fetch-fx), test, size
tsconfig.json               extends astro strict, allowImportingTsExtensions
.env.example
api/lead.ts                 Vercel function: POST(request) -> handleLead(request, deps)
api/lead.test.ts
scripts/fetch-fx.mjs (+ .test.mjs)   ČNB -> data/fx.json, fallback to last file
scripts/dev.mjs             local API server on :8787 + spawns `astro dev`
scripts/size.mjs            gzip size of first-load JS
data/fx.json                generated, committed (fallback)
src/lib/fees.ts (+test)     calculator
src/lib/selection.ts (+test) allow-list, clamps, e-mail validation, UTM, ad variant
src/lib/data.ts (+test)     data view model + cs-CZ formatters
src/lib/plan.ts (+test)     plan model shared by e-mail, /plan, thank-you table
src/lib/email.ts (+test)    escape + render e-mail {subject, html, text}
src/lib/brevo.ts            Brevo REST client + dry-run client
src/layouts/Base.astro      head, tokens, fonts, variant script
src/styles/global.css
src/components/*.astro      Hero, Tool, WhyBlocked, PlanContents, About, Faq, FinalForm, LeadForm, Footer, NoJsTable
src/scripts/tool.ts         island: steps A/B/C, result, sticky bar
src/scripts/forms.ts        progressive enhancement of every .lead-form, thank-you state
src/scripts/plan-page.ts    /plan renderer (textContent only)
src/pages/index.astro, plan.astro, dekujeme.astro, chyba-formulare.astro, ochrana-osobnich-udaju.astro
public/plan-preview.png     real e-mail screenshot (Task 13)
```

---

### Task 1: Scaffold Astro, layout, tokens, fonts, decisions §15

**Files:** Create `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/layouts/Base.astro`,
`src/styles/global.css`, `src/pages/index.astro` (stub), `.env.example`; Modify `.gitignore` (add `.dev/`),
`docs/decisions.md` (append §15 = the table above).

**Interfaces:** Produces `Base.astro` with props `{ title: string; description: string; noindex?: boolean }` and a
default slot; CSS custom properties `--paper --ink --muted --blocked --allowed --marker --font`.

- [ ] **Step 1:** `npm init -y`, then `npm install astro@7.3.8` (exact version, the only dependency). Do not run
  `npm create astro` (it adds packages).
- [ ] **Step 2:** `package.json` scripts:

```json
{
  "type": "module",
  "scripts": {
    "dev": "node scripts/dev.mjs",
    "prebuild": "node scripts/fetch-fx.mjs",
    "build": "astro build",
    "preview": "astro preview",
    "test": "node --test \"src/**/*.test.ts\" \"api/**/*.test.ts\" \"scripts/**/*.test.mjs\"",
    "size": "node scripts/size.mjs"
  }
}
```

- [ ] **Step 3:** `astro.config.mjs` — static output, Archivo through Astro's built-in `fonts` config
  (provider google, `weights: ["400 800"]`, `subsets: ["latin", "latin-ext"]`, `fallbacks: ["sans-serif"]` so Astro
  generates the metric-matched fallback), `vite.server.proxy: { '/api': 'http://localhost:8787' }`.
  **Checkpoint:** inspect the generated `@font-face`/woff2 in `dist/`: is the `wdth` axis present (needed for the
  wide ticker style)? Does `font-feature-settings: "tnum"` change digit widths (render "1111" vs "0000" widths in the
  browser in Task 13)? If `wdth` is missing, fall back to downloading the two variable woff2 files that
  `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap` lists (latin,
  latin-ext) into `public/fonts/`, write `@font-face` by hand, and keep Astro's generated fallback face. Report which
  path was taken and the woff2 sizes.
- [ ] **Step 4:** `tsconfig.json`: `{"extends":"astro/tsconfigs/strict","compilerOptions":{"allowImportingTsExtensions":true}}`.
- [ ] **Step 5:** `Base.astro`: `<html lang="cs">`, meta from page.md §0 (title, description, og:title,
  og:description, viewport), `<Font cssVariable="--font" preload />`, and this inline script before any CSS-dependent
  content:

```html
<script is:inline>
  // Runs before paint: enables the island UI and picks the hero by ad (decisions §4, §15 #14).
  var c = new URLSearchParams(location.search).get('utm_content') || '';
  document.documentElement.className = 'js';
  document.documentElement.dataset.variant = c.indexOf('ad_b_') === 0 ? 'b' : 'a';
</script>
```

  `global.css`: the six tokens on `:root`, `body{background:var(--paper);color:var(--ink);font-family:var(--font)}`,
  `.num{font-variant-numeric:tabular-nums}`, `.ticker{font-stretch:125%;font-weight:800}`,
  `html:not(.js) .needs-js{display:none}`, `html.js .no-js{display:none}`,
  `[data-variant="a"] .only-b, [data-variant="b"] .only-a{display:none}`, and a `prefers-reduced-motion` reset.
- [ ] **Step 6:** `.env.example`:

```
# Brevo (decisions §6a). Without BREVO_API_KEY /api/lead runs in dry-run mode.
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=ETF Dvojče
BREVO_REPLY_TO=
BREVO_PLAN_LIST_ID=
BREVO_NEWSLETTER_LIST_ID=
SITE_URL=http://localhost:4321
```

- [ ] **Step 7:** `npx astro build` succeeds; stub index renders "ETF Dvojče" in Archivo.
- [ ] **Step 8:** Commit `chore: scaffold Astro static site with tokens and self-hosted Archivo` and separately
  `docs: phase 3 decisions §15`.

### Task 2: GDPR legal basis research (lead agent, not a subagent)

**Files:** Modify `data/sources.md` (new §9), `docs/decisions.md` §5 (replace VERIFY), `docs/ai-worklog.md`.

- [ ] **Step 1:** Fetch and quote: GDPR art. 6(1)(a)/(b)/(f), art. 7(1)–(4), art. 13, art. 21(2)–(3) (EUR-Lex via a
  mirror, cite EUR-Lex per CLAUDE.md); zákon 480/2004 Sb. § 2, § 7 (zakonyprolidi.cz); EDPB Guidelines 2/2019 on
  art. 6(1)(b) (requested service); ÚOOÚ guidance on obchodní sdělení if reachable.
- [ ] **Step 2:** Answer, with quotes: (1) basis for sending the requested plan e-mail; (2) basis for storing selections
  + UTM with the contact (attribution); (3) basis and form of the newsletter consent (separate, unticked, demonstrable,
  withdrawable); (4) whether the plan e-mail may contain any marketing (expected: no) and what the footer may say;
  (5) retention period to propose.
- [ ] **Step 3:** If any answer changes the form (fields, checkbox text, microcopy), **stop and ask Matěj** before
  Task 9. Otherwise record in decisions §5 and continue.

### Task 3: EUR/CZK build-time fetch

**Files:** Create `scripts/fetch-fx.mjs`, `scripts/fetch-fx.test.mjs`, `data/fx.json` (generated).

**Interfaces:** Produces `data/fx.json`:
`{"rate":24.355,"validFor":"2026-10-14","source_url":"https://api.cnb.cz/cnbapi/exrates/daily?date=…&lang=CZ","retrieved_at":"2026-10-15"}`
(values come from the live call, not from this example). Exports `updateFx({ fetch, today, file })`.

- [ ] **Step 1: failing tests** (`node:test`, temp file in `os.tmpdir()`):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { updateFx } from './fetch-fx.mjs';

const tmp = () => join(mkdtempSync(join(tmpdir(), 'fx-')), 'fx.json');
const ok = (body) => async () => ({ ok: true, json: async () => body });

test('writes EUR rate and validFor from the ČNB response', async () => {
  const file = tmp();
  await updateFx({ file, today: '2026-10-15', fetch: ok({ rates: [
    { currencyCode: 'USD', rate: 22.1, validFor: '2026-10-14', amount: 1 },
    { currencyCode: 'EUR', rate: 24.355, validFor: '2026-10-14', amount: 1 }] }) });
  const fx = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(fx.rate, 24.355);
  assert.equal(fx.validFor, '2026-10-14');
  assert.equal(fx.retrieved_at, '2026-10-15');
});

test('keeps the last file when the API fails', async () => {
  const file = tmp();
  writeFileSync(file, '{"rate":24.365,"validFor":"2026-10-09"}');
  const r = await updateFx({ file, today: '2026-10-15', fetch: async () => { throw new Error('offline'); } });
  assert.equal(r.kept, true);
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).rate, 24.365);
});

test('throws when the API fails and there is no file yet', async () => {
  await assert.rejects(updateFx({ file: tmp(), today: '2026-10-15', fetch: async () => ({ ok: false, status: 500 }) }));
});

test('rejects an implausible rate instead of writing it', async () => {
  const file = tmp();
  writeFileSync(file, '{"rate":24.365,"validFor":"2026-10-09"}');
  const r = await updateFx({ file, today: '2026-10-15', fetch: ok({ rates: [{ currencyCode: 'EUR', rate: 0, validFor: 'x', amount: 1 }] }) });
  assert.equal(r.kept, true);
});
```

- [ ] **Step 2:** `node --test scripts/fetch-fx.test.mjs` → FAIL (module missing).
- [ ] **Step 3:** Implement: URL `https://api.cnb.cz/cnbapi/exrates/daily?date=${today}&lang=CZ`, 8 s
  `AbortSignal.timeout`, pick `currencyCode === 'EUR'`, rate per 1 unit (`rate / amount`), sanity range 15–40; on any
  failure keep an existing file (`console.warn`, return `{kept:true}`), else throw. CLI entry when run directly:
  `today` = local date in `Europe/Prague`.
- [ ] **Step 4:** tests PASS; run `node scripts/fetch-fx.mjs` for real; check `data/fx.json` against
  sources.md §7 (24.355 for 2026-10-14 or a newer business day).
- [ ] **Step 5:** Commit `feat: fetch EUR/CZK from ČNB at build time with last-file fallback`.

### Task 4: Broker data fields for the calculator (lead agent)

**Files:** Modify `data/brokers.json`, `data/sources.md` §7 (one line).

- [ ] Add `"id"` (`xtb`, `t212`, `fio`, `cs`) and numeric `"custody_pct"` read from the already-cited sources in
  sources.md §7: XTB `0` (fee only above 250 000 EUR, note kept), T212 `0`, Fio `0`, ČS `0.08`. No new numbers.
- [ ] Commit `data: add broker ids and numeric custody_pct for the calculator`.

### Task 5: Fee calculator (TDD)

**Files:** Create `src/lib/fees.ts`, `src/lib/fees.test.ts`.

**Interfaces:**
- Consumes: `data/bank-funds.json`, `data/brokers.json` (with Task 4 fields), `data/fx.json`.
- Produces:
  - `finalValue({monthly, years, returnPct, entryPct?, ongoingPct?, exitPct?}): number` — identical model to
    `content/calc-examples.mjs`.
  - `type BrokerId = 'unknown'|'xtb'|'t212'|'fio'|'cs'`
  - `brokerFor(id: BrokerId, brokers): Broker` (`unknown` = synthetic, fx = max published `fx_pct`)
  - `commissionEur(commission, eur: number): number`
  - `etfValue(inp: Inputs, broker: Broker, terPct: number, eurCzk: number): number`
  - `compare(inp: Inputs, ctx: {brokerId, terPct, eurCzk, banks, brokers}) => { noFee, etf, etfCost, bankMin, bankMax, bankCostMin, bankCostMax, fixedFeePct: number|null }`
    (`fixedFeePct` = commission as % of one monthly buy when the commission is a fixed/minimum fee above 2 %, else null)
  - `yearRows(inp, ctx, marks = [1,5,10,15,20]) => {year, paidIn, bankMin, bankMax, etf}[]` (marks > years dropped,
    the horizon itself appended if not a mark)
  - `roundK(n) = Math.round(n/1000)*1000`
  - `type Inputs = { monthly: number; years: number; returnPct: number }`

- [ ] **Step 1: failing tests** — expected numbers are the output of `node content/calc-examples.mjs` (run it in this
  step and paste its output into the test file header comment):

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import banksJson from '../../data/bank-funds.json' with { type: 'json' };
import brokersJson from '../../data/brokers.json' with { type: 'json' };
import { finalValue, compare, yearRows, roundK, commissionEur, brokerFor, etfValue } from './fees.ts';

const banks = banksJson.funds, brokers = brokersJson.brokers;
const base = { monthly: 3000, years: 20, returnPct: 5 };
const ctx = { brokerId: 'unknown' as const, terPct: 0.07, eurCzk: 24.355, banks, brokers };

test('reproduces content/calc-examples.mjs for the default inputs', () => {
  const r = compare(base, ctx);
  assert.equal(roundK(r.noFee), 1222000);
  assert.equal(roundK(r.etf), 1200000);
  assert.equal(roundK(r.etfCost), 22000);
  assert.equal(roundK(r.bankMin), 883000);
  assert.equal(roundK(r.bankMax), 950000);
  assert.equal(roundK(r.bankCostMin), 272000);
  assert.equal(roundK(r.bankCostMax), 339000);
});

test('"Nevím" uses the highest published FX surcharge from brokers.json', () => {
  const max = Math.max(...brokers.map((b) => b.fx_pct ?? 0));
  assert.equal(brokerFor('unknown', brokers).fx_pct, max);
});

test('Fio fixed fee: 3.95 EUR on a 125 EUR buy is 3.16 % (calc-examples)', () => {
  const fio = brokerFor('fio', brokers);
  assert.equal(commissionEur(fio.commission, 125), 3.95);
  assert.equal((commissionEur(fio.commission, 125) / 125 * 100).toFixed(2), '3.16');
});

test('Fio tiers: 1 401 EUR -> 4.95, 10 000 EUR -> 0.15 % = 15, 3 500 EUR -> min 6.95', () => {
  const c = brokerFor('fio', brokers).commission;
  assert.equal(commissionEur(c, 1401), 4.95);
  assert.equal(commissionEur(c, 10000), 15);
  assert.equal(commissionEur(c, 3500), 6.95);
});

test('ČS: 0.35 % with a 4 EUR minimum, custody adds to ongoing cost', () => {
  const cs = brokerFor('cs', brokers);
  assert.equal(commissionEur(cs.commission, 123), 4);
  assert.equal(commissionEur(cs.commission, 2000), 7);
  const withCustody = etfValue(base, cs, 0.07, 24.355);
  const sameNoCustody = etfValue(base, { ...cs, custody_pct: 0 }, 0.07, 24.355);
  assert.ok(withCustody < sameNoCustody);
});

test('fixed-fee note appears for Fio at 3 000 Kč and not for XTB', () => {
  assert.ok(compare(base, { ...ctx, brokerId: 'fio' }).fixedFeePct! > 2);
  assert.equal(compare(base, { ...ctx, brokerId: 'xtb' }).fixedFeePct, null);
});

test('year rows: 1/5/10/15/20 and the 20-year row equals compare()', () => {
  const rows = yearRows(base, ctx);
  assert.deepEqual(rows.map((r) => r.year), [1, 5, 10, 15, 20]);
  assert.equal(rows[4].paidIn, 720000);
  assert.equal(roundK(rows[4].etf), 1200000);
  assert.equal(roundK(rows[4].bankMin), 883000);
  assert.equal(roundK(rows[4].bankMax), 950000);
  assert.deepEqual(yearRows({ ...base, years: 7 }, ctx).map((r) => r.year), [1, 5, 7]);
});

test('0 % return and no fees returns exactly the money paid in', () => {
  assert.equal(finalValue({ monthly: 1000, years: 2, returnPct: 0 }), 24000);
});
```

- [ ] **Step 2:** `node --test src/lib/fees.test.ts` → FAIL (module missing).
- [ ] **Step 3: implement** (bank side = funds with `ongoing_pct != null`, as calc-examples):

```ts
// Fee model, decisions §4/§15 and content/calc-examples.mjs (the oracle these tests reproduce).
export type Inputs = { monthly: number; years: number; returnPct: number };
export type BrokerId = 'unknown' | 'xtb' | 't212' | 'fio' | 'cs';
type Tier = { up_to_eur: number | null; fee_eur?: number; fee_pct?: number; min_eur?: number };
export type Commission = { pct?: number; min_eur?: number; tiers_eur?: Tier[] };
export type Broker = { id: BrokerId; name: string; commission: Commission; fx_pct: number | null; custody_pct: number };
type Bank = { name: string; entry_max_pct: number; ongoing_pct: number | null; exit_pct: number | null };

export function finalValue({ monthly, years, returnPct, entryPct = 0, ongoingPct = 0, exitPct = 0 }:
  Inputs & { entryPct?: number; ongoingPct?: number; exitPct?: number }) {
  const g = Math.pow(1 + returnPct / 100, 1 / 12) * Math.pow(1 - ongoingPct / 100, 1 / 12);
  let v = 0;
  for (let m = 0; m < years * 12; m++) v = (v + monthly * (1 - entryPct / 100)) * g;
  return v * (1 - exitPct / 100);
}

export function brokerFor(id: BrokerId, brokers: Broker[]): Broker {
  if (id !== 'unknown') return brokers.find((b) => b.id === id)!;
  const fx = Math.max(...brokers.map((b) => b.fx_pct ?? 0));
  return { id, name: 'Nevím', commission: { pct: 0, min_eur: 0 }, fx_pct: fx, custody_pct: 0 };
}

// shortcut: ignores XTB's 0.2 % above 100 000 EUR monthly turnover; upgrade if sale values that large matter.
export function commissionEur(c: Commission, eur: number) {
  if (c.tiers_eur) {
    const t = c.tiers_eur.find((t) => t.up_to_eur == null || eur <= t.up_to_eur)!;
    return t.fee_eur ?? Math.max((eur * t.fee_pct!) / 100, t.min_eur ?? 0);
  }
  return Math.max((eur * (c.pct ?? 0)) / 100, c.min_eur ?? 0);
}

const commissionPct = (b: Broker, czk: number, eurCzk: number) => (commissionEur(b.commission, czk / eurCzk) * eurCzk / czk) * 100;

export function etfValue(inp: Inputs, b: Broker, terPct: number, eurCzk: number) {
  const fx = b.fx_pct ?? 0;
  const gross = finalValue({ ...inp, entryPct: fx + commissionPct(b, inp.monthly, eurCzk), ongoingPct: terPct + b.custody_pct });
  return gross * (1 - (fx + commissionPct(b, gross, eurCzk)) / 100);
}

export const roundK = (n: number) => Math.round(n / 1000) * 1000;

type Ctx = { brokerId: BrokerId; terPct: number; eurCzk: number; banks: Bank[]; brokers: Broker[] };

export function compare(inp: Inputs, ctx: Ctx) {
  const b = brokerFor(ctx.brokerId, ctx.brokers);
  const noFee = finalValue(inp);
  const etf = etfValue(inp, b, ctx.terPct, ctx.eurCzk);
  const bankVals = ctx.banks.filter((f) => f.ongoing_pct != null).map((f) =>
    finalValue({ ...inp, entryPct: f.entry_max_pct, ongoingPct: f.ongoing_pct!, exitPct: f.exit_pct ?? 0 }));
  const bankMin = Math.min(...bankVals), bankMax = Math.max(...bankVals);
  const fixed = commissionPct(b, inp.monthly, ctx.eurCzk);
  const pctOnly = (b.commission.pct ?? 0); // a pure-percentage fee is not a "fixed fee"
  return { noFee, etf, etfCost: noFee - etf, bankMin, bankMax, bankCostMin: noFee - bankMax, bankCostMax: noFee - bankMin,
    fixedFeePct: fixed > 2 && fixed > pctOnly + 1e-9 ? fixed : null };
}

export function yearRows(inp: Inputs, ctx: Ctx, marks = [1, 5, 10, 15, 20]) {
  const years = marks.filter((y) => y < inp.years);
  years.push(inp.years);
  return years.map((year) => {
    const r = compare({ ...inp, years: year }, ctx);
    return { year, paidIn: inp.monthly * 12 * year, bankMin: r.bankMin, bankMax: r.bankMax, etf: r.etf };
  });
}
```

- [ ] **Step 4:** tests PASS; `node content/calc-examples.mjs` output unchanged.
- [ ] **Step 5:** Commit `feat: fee calculator reproducing calc-examples, with broker costs and year rows`.

### Task 6: Input allow-list and e-mail validation (TDD)

**Files:** Create `src/lib/selection.ts`, `src/lib/selection.test.ts`.

**Interfaces:** Produces
- `RANGES = { monthly: [500, 30000, 500, 3000], years: [1, 40, 1, 20], returnPct: [0, 10, 0.5, 5] }` (min, max, step, default)
- `type Selection = { tickers: string[]; monthly: number; years: number; returnPct: number; broker: BrokerId; dividends: 'acc'|'dist'|'both' }`
- `parseSelection(p: URLSearchParams, knownTickers: string[]): Selection`
- `toParams(s: Selection): URLSearchParams` (inverse; used for `/plan` links)
- `validateEmail(raw: unknown): { ok: true; email: string } | { ok: false; reason: 'empty'|'invalid' }`
- `sanitizeUtm(p: URLSearchParams): Record<'utm_source'|'utm_medium'|'utm_campaign'|'utm_content'|'utm_term', string>`
- `adVariant(utmContent: string): 'a'|'b'|'unknown'`

- [ ] **Step 1: failing tests**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSelection, toParams, validateEmail, sanitizeUtm, adVariant, RANGES } from './selection.ts';

const known = ['VOO', 'SPY', 'IVV', 'VTI', 'QQQ', 'VT', 'SCHD'];
const p = (s: string) => new URLSearchParams(s);

test('defaults when nothing is sent', () => {
  assert.deepEqual(parseSelection(p(''), known),
    { tickers: [], monthly: 3000, years: 20, returnPct: 5, broker: 'unknown', dividends: 'both' });
});
test('drops unknown tickers, uppercases, dedupes, keeps data order', () => {
  assert.deepEqual(parseSelection(p('t=qqq,VOO,<a href=x>,VOO,ABC'), known).tickers, ['VOO', 'QQQ']);
});
test('clamps and snaps numbers to slider ranges', () => {
  const s = parseSelection(p('m=999999&y=-3&r=7.3'), known);
  assert.equal(s.monthly, RANGES.monthly[1]);
  assert.equal(s.years, 1);
  assert.equal(s.returnPct, 7.5);
  assert.equal(parseSelection(p('m=abc'), known).monthly, 3000);
});
test('enums fall back to defaults', () => {
  const s = parseSelection(p('b=revolut&d=<script>'), known);
  assert.equal(s.broker, 'unknown');
  assert.equal(s.dividends, 'both');
});
test('toParams round-trips', () => {
  const s = parseSelection(p('t=VOO,QQQ&m=5000&y=10&r=6&b=fio&d=acc'), known);
  assert.deepEqual(parseSelection(toParams(s), known), s);
});
test('e-mail: trims and lowercases valid addresses', () => {
  assert.deepEqual(validateEmail('  Jana.Novak+etf@Seznam.CZ '), { ok: true, email: 'jana.novak+etf@seznam.cz' });
});
test('e-mail: empty, invalid, header injection, too long', () => {
  assert.deepEqual(validateEmail(''), { ok: false, reason: 'empty' });
  assert.deepEqual(validateEmail(undefined), { ok: false, reason: 'empty' });
  for (const bad of ['jana', 'jana@', 'jana@seznam', 'a b@c.cz', 'a@b.cz\r\nBcc: x@y.cz', 'a@b.c', `${'a'.repeat(250)}@b.cz`])
    assert.deepEqual(validateEmail(bad), { ok: false, reason: 'invalid' }, bad);
});
test('UTM: trimmed, control chars stripped, capped at 100, missing = ""', () => {
  const u = sanitizeUtm(p(`utm_source=%20instagram%20&utm_content=ad_a_blocked%0D%0A&utm_term=${'x'.repeat(300)}`));
  assert.equal(u.utm_source, 'instagram');
  assert.equal(u.utm_content, 'ad_a_blocked');
  assert.equal(u.utm_term.length, 100);
  assert.equal(u.utm_medium, '');
});
test('ad variant from utm_content', () => {
  assert.equal(adVariant('ad_a_blocked'), 'a');
  assert.equal(adVariant('ad_b_fees'), 'b');
  assert.equal(adVariant('AD_B_x'), 'unknown');
  assert.equal(adVariant(''), 'unknown');
});
```

- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** implement. Rules: tickers = `known.filter(k => requested.has(k))` (keeps data order); number =
  `Number(v)`; non-finite → default; clamp; snap to step (`Math.round((v-min)/step)*step+min`); e-mail: `String`,
  trim, lowercase, length ≤ 254, regex `^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$`, and reject any char < 0x20.
  UTM: strip `[\u0000-\u001f\u007f]`, trim, slice(0, 100).
- [ ] **Step 4:** PASS. **Step 5:** commit `feat: input allow-list, clamps and e-mail validation for the lead form`.

### Task 7: Data view model, plan model, e-mail renderer (TDD)

**Files:** Create `src/lib/data.ts`, `src/lib/plan.ts`, `src/lib/email.ts`, `src/lib/plan.test.ts`, `src/lib/email.test.ts`.

**Interfaces:**
- `data.ts`: `fmtPct(0.07) → "0,07 %"`, `fmtCzk(22000) → "22 000 Kč"` (`Intl.NumberFormat('cs-CZ')`, nbsp),
  `fmtDate('2026-09-30') → "30. 9. 2026"`, `xetraTicker(f)`, `usdLondonTicker(f)` (LSE listing with currency USD,
  else null), `DATA_DATE = etfs.snapshot.retrieved_at`, `US`, `UCITS` arrays, `byIsin`.
- `plan.ts`: `buildPlan(sel: Selection, fx: {rate, validFor}) => Plan` where
  `Plan = { groups: Group[]; fees: { rows, compare, terPct, terTicker, brokerName }; dataDate: string; fallback: boolean }`,
  `Group = { kind: 'same'|'nearest'|'none'|'other'; picks: string[]; indexName: string; twins: Twin[]; similar: Twin[] }`,
  `Twin = { xetra, london: string|null, name, isin, terPct, distribution, fundCurrency, kidCs: boolean, kidUrl, issuer, asOf, inception, sourceUrl }`.
  Empty `tickers` → fallback `['VOO','SPY','IVV']`, `fallback: true`. Twins filtered by `dividends`, sorted acc first
  then by Xetra ticker. `terPct` = max TER over all shown twins (decision §15 #2).
- `email.ts`: `esc(s)`; `renderEmail(plan, sel, siteUrl) => { subject, html, text }`.

- [ ] **Step 1: failing tests** (`plan.test.ts`):

```ts
test('VOO+SPY+IVV group into one S&P 500 group with 6 twins, acc first', () => {
  const plan = buildPlan(parseSelection(new URLSearchParams('t=VOO,SPY,IVV'), US_TICKERS), fx);
  assert.equal(plan.groups.length, 1);
  assert.deepEqual(plan.groups[0].picks, ['VOO', 'SPY', 'IVV']);
  assert.deepEqual(plan.groups[0].twins.map((t) => t.xetra), ['SPYL', 'SXR8', 'VUAA', 'IUSA', 'SPY5', 'VUSA']);
});
test('dividends=acc filters to accumulating twins', () => { /* QQQ -> EQQB, SXRV */ });
test('VTI is "nearest" with the S&P 500 twins; SCHD is "none"; VT has VWCE/VGWL as similar', () => { /* … */ });
test('empty tickers -> fallback S&P 500 plan', () => { /* fallback true, picks VOO,SPY,IVV */ });
test('fee rows end at the horizon and use the max shown TER', () => { /* VOO acc-only -> terPct 0.07, terTicker VUAA */ });
test('kidCs mirrors etfs.json: SXR8 true, IUSA false, EQQB false (null)', () => { /* … */ });
```

  (The implementer writes the bodies with concrete expected values read from `data/etfs.json`; the reviewer checks
  each expected value against the JSON, not against the implementation.)

  `email.test.ts`:

```ts
test('esc escapes & < > " \'', () => assert.equal(esc(`<a href="x">'&`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;'));
test('subject variants (email.md)', () => {
  assert.equal(render('t=VOO').subject, 'Váš ETF plán: VOO a jeho evropská dvojčata');
  assert.equal(render('t=VOO,QQQ').subject, 'Váš ETF plán: VOO, QQQ a jejich evropská dvojčata');
  assert.equal(render('').subject, 'Váš ETF plán pro S&P 500');
});
test('html contains ISINs, year-20 row, sources, disclaimer; no raw "<script"', () => {
  const { html, text } = render('t=VOO');
  for (const s of ['IE00B5BMR087', '1 200 000 Kč', '883 000–950 000 Kč', 'Toto není doporučení',
    'Minulá výkonnost není zárukou budoucích výnosů', 'nejde o daňové poradenství']) assert.ok(html.includes(s), s);
  assert.ok(text.includes('IE00B5BMR087'));
});
test('online plan link carries only allow-listed params', () => {
  const { html } = render('t=VOO&m=5000');
  assert.match(html, /\/plan\?t=VOO&amp;m=5000&amp;y=20&amp;r=5&amp;b=unknown&amp;d=both/);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** implement. E-mail body = `content/email.md` sections Top, 1–5, Footer, verbatim,
  every `{…}` from `plan`. Inline-styled, table-based HTML (max-width 600 px, Archivo → Arial fallback; e-mail
  clients won't load the webfont). Plain-text part from the same model. Section 2 table and section 4 checklist are
  static copy from email.md. `[DOPLNIT …]` placeholders stay as visible text. Every inserted value goes through `esc`.
- [ ] **Step 4:** PASS. **Step 5:** two commits: `feat: plan model shared by e-mail, /plan and thank-you table`,
  `feat: plan e-mail renderer with escaping`.

### Task 8: `/api/lead` + Brevo client + local API server (TDD)

**Files:** Create `api/lead.ts`, `api/lead.test.ts`, `src/lib/brevo.ts`, `scripts/dev.mjs`.

**Interfaces:**
- `brevo.ts`: `type Brevo = { getContact(email): Promise<{attributes: Record<string, unknown>} | null>;
  upsertContact(email, attributes, listIds: number[]): Promise<void>; sendEmail(msg: {to, subject, html, text}): Promise<void> }`;
  `brevoFromEnv(env, fetch): Brevo` (dry-run when no `BREVO_API_KEY`: logs, writes `.dev/last-email.html`).
  Every call uses `AbortSignal.timeout(8000)` and throws on non-2xx (404 on getContact → null).
- `lead.ts`: `handleLead(req: Request, deps: { brevo: Brevo; now: () => Date; log: (msg: string, data?: object) => void; siteUrl: string }): Promise<Response>`;
  `export async function POST(req: Request)` wires real deps.

- [ ] **Step 1: failing tests** — a fake Brevo records calls:

```ts
const fake = (existing: Record<string, unknown> | null = null, fail: Partial<Record<'get'|'upsert'|'send', boolean>> = {}) => {
  const calls: string[] = []; const upserts: any[] = [];
  return { calls, upserts, brevo: {
    async getContact() { calls.push('get'); if (fail.get) throw new Error('x'); return existing && { attributes: existing }; },
    async upsertContact(email: string, attributes: object, lists: number[]) { calls.push('upsert'); if (fail.upsert) throw new Error('x'); upserts.push({ email, attributes, lists }); },
    async sendEmail() { calls.push('send'); if (fail.send) throw new Error('x'); },
  } };
};
const now = new Date('2026-10-15T10:00:00Z');
const json = (body: object) => new Request('http://x/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) });
const form = (body: string) => new Request('http://x/api/lead', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
const deps = (f: ReturnType<typeof fake>) => ({ brevo: f.brevo, now: () => now, log: () => {}, siteUrl: 'https://example.cz' });

test('new address: upsert, send, then PLAN_SENT_AT; 200 {ok:true}', async () => {
  const f = fake();
  const res = await handleLead(json({ email: 'a@b.cz', t: 'VOO', utm_content: 'ad_b_fees' }), deps(f));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.deepEqual(f.calls, ['get', 'upsert', 'send', 'upsert']);
  assert.equal(f.upserts[0].attributes.AD_VARIANT, 'b');
  assert.equal(f.upserts[1].attributes.PLAN_SENT_AT, now.toISOString());
});
test('same address within 24 h: attributes updated, no e-mail, still 200', async () => {
  const f = fake({ PLAN_SENT_AT: '2026-10-15T01:00:00Z' });
  const res = await handleLead(json({ email: 'a@b.cz' }), deps(f));
  assert.equal(res.status, 200);
  assert.ok(!f.calls.includes('send'));
});
test('after 24 h a new plan is sent', async () => {
  const f = fake({ PLAN_SENT_AT: '2026-10-14T09:59:00Z' });
  await handleLead(json({ email: 'a@b.cz' }), deps(f));
  assert.ok(f.calls.includes('send'));
});
test('honeypot: fake success, nothing stored or sent, logged', async () => {
  const f = fake(); const logs: string[] = [];
  const res = await handleLead(json({ email: 'a@b.cz', fld_q8: 'x' }), { ...deps(f), log: (m) => logs.push(m) });
  assert.equal(res.status, 200);
  assert.deepEqual(f.calls, []);
  assert.equal(logs.length, 1);
});
test('invalid e-mail: 400 with reason, nothing called', async () => {
  const f = fake();
  const res = await handleLead(json({ email: 'nope' }), deps(f));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { ok: false, reason: 'invalid' });
  assert.deepEqual(f.calls, []);
});
test('hostile hidden fields never reach Brevo unfiltered', async () => {
  const f = fake();
  await handleLead(json({ email: 'a@b.cz', t: '<a href="x">Váš účet</a>,VOO', m: '1e9', b: 'evil' }), deps(f));
  const a = f.upserts[0].attributes;
  assert.equal(a.TICKERS, 'VOO');
  assert.equal(a.MONTHLY, 30000);
  assert.equal(a.BROKER, 'unknown');
});
test('newsletter: ticked adds list + consent time; unticked never clears earlier consent', async () => {
  const f = fake();
  await handleLead(json({ email: 'a@b.cz', newsletter: 'on' }), deps(f));
  assert.equal(f.upserts[0].attributes.NEWSLETTER, true);
  assert.equal(f.upserts[0].attributes.NEWSLETTER_CONSENT_AT, now.toISOString());
  const g = fake({ NEWSLETTER: true });
  await handleLead(json({ email: 'a@b.cz' }), deps(g));
  assert.equal('NEWSLETTER' in g.upserts[0].attributes, false);
});
test('Brevo failure on upsert or send: 502 server', async () => {
  for (const which of ['upsert', 'send'] as const) {
    const res = await handleLead(json({ email: 'a@b.cz' }), deps(fake(null, { [which]: true })));
    assert.equal(res.status, 502);
    assert.deepEqual(await res.json(), { ok: false, reason: 'server' });
  }
});
test('no-JS form POST: 303 to /dekujeme/ or /chyba-formulare/', async () => {
  const ok = await handleLead(form('email=a%40b.cz'), deps(fake()));
  assert.equal(ok.status, 303); assert.equal(ok.headers.get('location'), '/dekujeme/');
  const bad = await handleLead(form('email=x'), deps(fake()));
  assert.equal(bad.status, 303); assert.equal(bad.headers.get('location'), '/chyba-formulare/');
});
test('rejects non-POST (405) and bodies over 10 kB (413)', async () => {
  assert.equal((await handleLead(new Request('http://x/api/lead'), deps(fake()))).status, 405);
  assert.equal((await handleLead(json({ email: 'a@b.cz', pad: 'x'.repeat(11000) }), deps(fake()))).status, 413);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** implement per decisions §6a and §15 #11–13. Attributes:
  `TICKERS, MONTHLY, YEARS, RETURN_PCT, BROKER, DIVIDENDS, AD_VARIANT, UTM_SOURCE, UTM_MEDIUM, UTM_CAMPAIGN,
  UTM_CONTENT, UTM_TERM, LAST_REQUEST_AT` (+ `NEWSLETTER*`, `PLAN_SENT_AT`). Lists: plan list always, newsletter
  list only when ticked. JSON response if `accept` includes `application/json`, else 303. Never echo input.
- [ ] **Step 4:** `scripts/dev.mjs`: `node:http` server on 8787 that turns the Node request into a `Request`, calls
  `POST` from `api/lead.ts`, and spawns `npx astro dev` (inherit stdio, kill child on exit). Manual check:
  `curl -s -X POST localhost:8787/api/lead -H "content-type: application/json" -H "accept: application/json" -d "{\"email\":\"a@b.cz\",\"t\":\"VOO\"}"`
  → `{"ok":true}` and `.dev/last-email.html` exists.
- [ ] **Step 5:** commit `feat: /api/lead with allow-list, dedupe, honeypot and Brevo client (dry-run without key)`.

### Task 9: Static page, sections, no-JS table, legal and static pages

**Load `frontend-design` before this task.** Copy verbatim from `content/page.md` (section numbers below).

**Files:** Create `src/components/{Hero,Tool,WhyBlocked,PlanContents,About,Faq,FinalForm,LeadForm,Footer,NoJsTable}.astro`,
`src/pages/{index,dekujeme,chyba-formulare,ochrana-osobnich-udaju}.astro`.

**Interfaces:** `LeadForm.astro` props `{ location: 'inline'|'sticky'|'footer'; heading; body }` renders
`<form class="lead-form" method="post" action="/api/lead" data-location>` with `email` (label "Váš e-mail",
`type=email autocomplete=email inputmode=email required`), `newsletter` checkbox (unticked), honeypot
`<div class="hp" aria-hidden="true"><label>Nevyplňujte<input name="fld_q8" tabindex="-1" autocomplete="off"></label></div>`,
hidden `t m y r b d utm_*`, button "Poslat plán", microcopy with privacy link, and an `aria-live="polite"` status `<p>`.
Tool markup (`Tool.astro`) has `class="needs-js"` and stable ids/`data-*` hooks consumed by Task 10.

- [ ] **Step 1:** `index.astro` in decisions §8 order, each `<section data-section="…">`: hero (both 1A/1B texts,
  `.only-a`/`.only-b`) → tool (`needs-js`) + `NoJsTable` (`no-js`, page.md §9, rows generated from `etfs.json`, order
  decision §15 #6) → §3 → §4 (image slot `public/plan-preview.png`, `width`/`height` set, `loading="lazy"`; until Task 13
  the file is absent and the slot shows its alt text) → §5 → §6 FAQ (`<details>`) → §7 final form + footer.
  All `{…}` via `src/lib/data.ts`: counts ({6}/{3}/{2}/{7}), TER ranges, dates, data date.
- [ ] **Step 2:** `/dekujeme/` (page.md §8 heading without the address: "Hotovo. Plán je na cestě." + spam hint +
  link back), `/chyba-formulare/` (invalid-e-mail copy + the footer form again), both `noindex`.
- [ ] **Step 3:** `/ochrana-osobnich-udaju/` from Task 2's findings: controller `[DOPLNIT …]`, purposes, legal bases,
  recipients (Brevo, Vercel; Umami named as Phase 4 if decided), retention, rights (incl. objection, withdrawal,
  complaint to ÚOOÚ), no profiling. Every legal statement cites the article.
- [ ] **Step 4:** `npm run build`; open `dist/index.html` with JS disabled: core message, twin table and footer form
  are present. Check every `{…}` in page.md is filled (grep the built HTML for `{` and `[CHYBÍ`).
- [ ] **Step 5:** commits per page/section group, e.g. `feat: landing page sections and no-JS twin table`,
  `feat: privacy notice with marked operator placeholders`, `feat: no-JS thank-you and form error pages`.

### Task 10: Tool island — steps A/B/C, result, animation, ad entry

**Files:** Create `src/scripts/tool.ts`; Modify `src/components/Tool.astro` (add `<script>` import and a
`<script type="application/json" id="tool-data">` with only the fields the island needs: US tickers + index + twin
ISINs, twins' display fields, banks, brokers, fx, ranges).

**Interfaces:** Consumes `fees.ts` (`compare`), `selection.ts` (`RANGES`, `toParams`), `plan.ts` (`buildPlan`), `data.ts`
formatters. Produces `window` event `tool:result` with `detail: Selection` (consumed by Task 11) and keeps
the hidden fields of every `.lead-form` in sync.

- [ ] **Step 1:** Step A: chips are `<button aria-pressed>`; tap toggles; per pick render the pair (`<del>` US ticker +
  "U většiny brokerů nejde koupit", twin header with count, twin rows, "KID v češtině" link only where `kidCs`,
  per-chip special cases VTI/SCHD/VT/Jiné, "Pořadí není doporučení"). All text via `textContent`/`createElement`.
- [ ] **Step 2:** Step B: three `<input type=range>` with `<output>`, broker radio group (default Nevím) with the
  per-broker helper lines from page.md, fixed-fee note when `fixedFeePct`, FX label "Přepočet kurzem ČNB k {validFor}".
  Live result line with `marker` behind the bank number; `aria-live="polite"` on the result, updated on `change` and
  throttled on `input` (rAF).
- [ ] **Step 3:** Step C: three radios (default "Nevím, ukažte obojí"); filters the twin lists.
- [ ] **Step 4:** Result block (page.md §2 "Result block") + inline `LeadForm location="inline"`; sticky bar markup
  (shown by Task 11). Fire `tool:result` when the first pick exists and Step B has a value.
- [ ] **Step 5:** Entry: `data-variant="b"` → VOO preselected, Step A collapsed "Vybráno: VOO · změnit", Step B open;
  otherwise Step A open. "Pokračovat na poplatky" / "Ještě jedno upřesnění" move focus to the next step heading.
- [ ] **Step 6:** Animation: on chip activation, `<del>` strike-through draws left→right (`background-size` 0→100 %,
  240 ms) then twin rows slide/fade in (staggered 40 ms, max 6). `@media (prefers-reduced-motion: reduce)` → none.
- [ ] **Step 7:** Manual check in `npm run dev` with `?utm_content=ad_a_blocked`, `?utm_content=ad_b_fees`, none:
  default numbers equal calc-examples (22 000 Kč; 272 000–339 000 Kč). Commit `feat: three-step tool island with twins, fee calculator and dividend filter`.

### Task 11: Forms, sticky bar, thank-you state

**Files:** Create `src/scripts/forms.ts`; import it from `LeadForm.astro`.

- [ ] **Step 1:** Enhance every `.lead-form`: on submit, client-check (`validateEmail`) → show page.md states (Empty /
  Invalid) in the status `<p>`, `aria-invalid` on the field; else disable the button, "Posíláme…", `fetch('/api/lead',
  {method:'POST', headers:{'content-type':'application/json', accept:'application/json'}, body})` with all fields
  incl. `utm_*` from `location.search`. 200 → thank-you; 400 → Invalid; 429 → Rate limit; other/timeout (10 s) →
  Server error, button re-enabled.
- [ ] **Step 2:** Thank-you state replaces the submitted form's block (page.md §8): heading with the address via
  `textContent`, full table for the current picks (ISIN, TER, dividends, source/as-of) from `buildPlan`, "Zadat znovu"
  restores the form, share button (`navigator.share` if present, else copy `origin + pathname + '?utm_source=share'`
  to clipboard and say "Odkaz zkopírován"). Hide the sticky bar after success.
- [ ] **Step 3:** Sticky bar: visible after `tool:result`, hidden while the inline form intersects the viewport
  (`IntersectionObserver`), tap → scroll to inline form + focus e-mail. Final form heading/body switch to "Poslat plán
  e-mailem" / "Pošleme vám plán pro {picks}." after `tool:result`.
- [ ] **Step 4:** Manual check with `npm run dev`: inline submit → thank-you + `.dev/last-email.html`; second submit →
  thank-you, no new e-mail (dry-run Brevo has no memory: verify dedupe only via the Task 8 tests, say so in the worklog).
  Commit `feat: progressive lead forms, sticky bar and thank-you state`.

### Task 12: `/plan` page

**Files:** Create `src/pages/plan.astro`, `src/scripts/plan-page.ts`.

- [ ] Static shell (`noindex`) + script: `parseSelection(location.search)` → `buildPlan` → render the same sections as
  the e-mail with `createElement`/`textContent` only (no `innerHTML` anywhere in the file; reviewer greps). No-JS:
  a message + link to the home page. Manual check: `/plan?t=<img src=x onerror=alert(1)>,VOO&m=9e9` renders VOO
  only with 30 000 Kč. Commit `feat: /plan page rendered from allow-listed URL params`.

### Task 13: QA, e-mail preview image, budget, screenshots (lead agent)

- [ ] `npm test` → all green (paste output). `npm run build` → OK. `node data/validate.mjs` → OK.
- [ ] `scripts/size.mjs`: sum gzip sizes of the JS files `dist/index.html` references (`<script src>` + inline)
  → must be < 60 kB. Commit `chore: first-load JS size script`.
- [ ] Screenshots via the `anthropic-skills:built-in-browser` skill (no headless browser on this machine; if it
  can't set a 390×844 viewport, ask Matěj before adding Playwright): `npm run preview`, then
  `/?utm_content=ad_a_blocked` and `/?utm_content=ad_b_fees` at 390×844 and 390×700 → `docs/screenshots/`. If hero B
  doesn't fit, shorten its sub-line first (and record it in content/page.md).
- [ ] Render `.dev/last-email.html` for `t=VOO`, screenshot the top of it → `public/plan-preview.png` (optimised,
  < 80 kB). Commit `feat: real plan e-mail preview in "Co vám přijde e-mailem"`.
- [ ] `/ponytail-review` on the branch; fix or reject findings in the worklog. Worklog entry for Phase 3.
- [ ] ✋ Report to Matěj: test output, bundle size, both screenshots, open items for Phase 4–5 (Umami, Brevo/Vercel
  accounts, rate-limit choice, daily FX rebuild, Vercel `.ts` import resolution in `api/`, List-Unsubscribe header in
  Brevo transactional, LCP/CLS measurement on throttled 4G, real-inbox test, `[DOPLNIT]` list).
