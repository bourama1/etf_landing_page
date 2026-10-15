# Phase 4 — Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every funnel event from decisions §12 fires once, with the right props, through Umami Cloud (cookieless), proven locally with Playwright against the real Umami tracker; then the privacy page, README drafts and A/B test cards follow.

**Architecture:** One loader module (in `Base.astro`) injects the Umami script when `PUBLIC_UMAMI_WEBSITE_ID` is set, with `data-tag` = `ad_variant`. One `track()` wrapper (queue until the script loads, dev log/no-op without an ID, e-mail guard). Pure helpers (dedupe, visibility rule, prop builders) in `src/lib/funnel.ts` with unit tests. DOM wiring in `src/scripts/funnel.ts` (delegated listeners, `tool:result`, observers); only the server-confirmed events go inside `forms.ts` and `plan-page.ts`.

**Tech Stack:** Astro 7 static, vanilla TS, `node --test`, Playwright (installed), Umami Cloud tracker v2/v3 (`cloud.umami.is/script.js`).

**Spec:** `docs/decisions.md` §11, §12, §13; CLAUDE.md "Tracking"; Matěj's Phase 4 brief (2026-10-15).

## Provider verification (done before this plan, 2026-10-15)

Read from the raw HTML/JS (curl + text extraction), not from summaries. Scratch copies in the session scratchpad.

| Check | Finding | Source | Verdict |
|---|---|---|---|
| Free tier events | Hobby $0: "Up to 100K events per month", "1 website", "6 month data retention" | https://umami.is/pricing | OK, see event budget |
| How events are counted | "Each website hit or custom event counts as one event, and **each event data property stored counts as one event**" | https://docs.umami.is/docs/cloud/faq | Shapes the design: few props |
| Websites | 1 on Hobby; landing page + /plan are one site | pricing | OK |
| Funnel report on free plan | "Funnel Analysis" row: Hobby has a check icon (`lucide-check`), same as UTM parameters, Goals, Breakdown | pricing (icon read from HTML) | OK |
| Funnel mechanics | steps = "Viewed page" or "Triggered event", ordered, with a window in minutes | https://docs.umami.is/docs/funnel | OK |
| EU data location | Cloud FAQ: "servers are located in the US and EU". Signup app strings: "Select your data region" → "United States" / "European Union", "This is where your data will reside. Once selected this cannot be changed." | https://docs.umami.is/docs/cloud/faq, https://cloud.umami.is/signup (JS string table) | OK **if EU is picked at signup** |
| Processor terms | DPA (last updated 2026-08-02) auto-applies, EU SCCs 2021/914 Module Two; Umami Software, Inc. is US (San Francisco); subprocessors incl. AWS, Cloudflare, Vercel (USA), ClickHouse (USA/EU), Hetzner (EU) | https://umami.is/dpa, https://umami.is/subprocessors (2026-04-24) | Third-country transfer exists → privacy page must say so |
| Cookies / IP | "does not use any cookies in the tracking code"; session = "hash generated from the visitor's IP address, user agent, and website ID"; IP "is never stored" | https://docs.umami.is/docs/faq, /docs/sessions, /docs/metric-definitions | OK; legal basis researched in Task 6 |
| Script size | `cloud.umami.is/script.js` 4 810 B raw, **2 343 B gzip** (Last-Modified 2026-10-01) | measured with curl + gzip | OK (13.9 + 2.3 kB ≪ 60 kB) |
| Hobby commercial use | Terms: Services "for your personal, non-commercial use or internal business purpose" (no Hobby-only restriction found, unlike Vercel Hobby) | https://umami.is/terms | OK, note in README |
| Not determined | what happens above 100K on Hobby (no statement found) | — | README: watch Usage page |

Useful features found: `data-tag` (v2.11, "for filtering and A/B testing", stored on every event, not event data → **costs nothing**), automatic pageview stores "URL pathname and search" → the UTM insight breaks out all five `utm_*` from it.

PostHog comparison is **not** needed: Umami passes every check.

## Global Constraints

- Event names are fixed by decisions §12 (+ `step_complete`). Props snake_case.
- No e-mail address and no free text in any prop. Props are enums, ticker lists from the allow-list, or clamped numbers.
- Script loaded deferred/async, no layout shift, first-load JS < 60 kB gz (`node scripts/size.mjs`).
- `track()` no-ops (logs in dev) without `PUBLIC_UMAMI_WEBSITE_ID`; local dev and `npm test` need no account.
- Do not touch: honeypot `fld_q8`, a11y attributes, consent text, source/date labels.
- Unit tests only for logic (`src/lib/funnel.ts`, `src/lib/track.ts`). No markup tests.
- `lead_submitted` only after `/api/lead` answers `res.ok && data.ok`.
- Commit messages in English, one logical change each, trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Every skill use and subagent prompt logged verbatim in `docs/ai-worklog.md`.

## Decisions this plan proposes (for Matěj's review)

1. **`page_view` = Umami's automatic pageview, not a custom event.** It already carries the full URL query (all `utm_*`), and `data-tag` carries `ad_variant`. A custom `page_view` with 5 UTM props + variant + entry step would cost 8 billable events per visit and duplicate the built-in one. Entry step follows from the tag (a → Step A, b → Step B). README event table lists it as "page_view (Umami pageview)".
2. **`ad_variant` on every event via `data-tag`**, computed by the existing `adVariant()` (`a`/`b`/`unknown`), so the mapping has one source of truth. It stays as an explicit prop only on `interaction_start` and `lead_submitted` (decisions §12 lists it there; +2 events, a fallback if a report can't filter by tag).
3. **Event budget.** Fully engaged visit ≈ 30 billable events, 5-second bounce ≈ 3. At an assumed average of ~10 per visit, Hobby's 100K ≈ 10 000 visits/month. README states it; Umami Pro ($20/month, 1M events) is the upgrade.
4. **`interaction_complete` needs a real interaction.** Ad B shows a result on load; counting that would inflate B's funnel. It fires on the first `tool:result` after the visitor's first interaction.
5. **`section_view` rule:** ≥ 50 % of the section visible **or** the section fills ≥ 50 % of the viewport (the tool section is taller than two screens and could never hit "50 % of itself" on a phone).
6. **Verification uses the real Umami script**, served by Playwright from the live URL, with `gateway.umami.is/api/send` intercepted and recorded (nothing is sent to Umami). This checks the real payload (URL with UTMs, `tag`, `name`, `data`), which a `window.umami` stub can't. Fallback if it fails offline: stub `window.umami`.
7. **Website ID only in the Vercel Production environment**, so previews and local builds send nothing.
8. **`magnet_opened` cannot be attributed to an ad** (the e-mail link carries no `utm_content`; §6a keeps UTMs out of the e-mail). Brevo still has the variant on the contact. Noted, not fixed.

## Event table (the contract every task implements)

| Event | Trigger | Code hook | Props | Fire rule |
|---|---|---|---|---|
| `page_view` | page load | Umami auto pageview (loader in `Base.astro`) | URL incl. `utm_*` (auto), `tag` = ad_variant | per load |
| `section_view` | section rule (decision 5) | `funnel.ts`: IntersectionObserver on `[data-section]` | `section` (hero, tool, why, plan, about, faq, final; /plan: plan) | once per section per load |
| `interaction_start` | first chip tap, range/radio change, `[data-ret]`, `[data-expand]` in `.tool` (not in `.lead-form`) | `funnel.ts`: delegated `click`/`change` on `.tool` | `step` (a/b/c), `ad_variant` | once per load |
| `step_complete` | A: a chip turned on; B: `change` on a range or broker radio; C: `change` on a dividends radio | `funnel.ts`: same listeners | A: `step`, `tickers`; B: `step`, `monthly`, `years`, `broker`; C: `step`, `dividends` | once per step per load |
| `interaction_complete` | first `tool:result` after the first interaction | `funnel.ts`: `window` `tool:result` | `tickers`, `monthly`, `years` | once per load |
| `cta_click` | click on sticky link, `a[data-cta]`, form submit button | `funnel.ts`: delegated `click` on `document` | `location` (sticky, plan, why, inline, footer) | every click |
| `form_view` | form rule (≥ 50 % visible) | `funnel.ts`: IntersectionObserver on `.lead-form` | `location` (`data-location`) | once per form per load |
| `form_start` | first `focusin` on the e-mail input | `funnel.ts`: `focusin` on each `.lead-form` | `location` | once per form per load |
| `form_error` | client validation fails; server 400/429/5xx; network/timeout | `forms.ts` `submit()` | `reason` (empty, invalid, rate, server, network), `location` | every occurrence |
| `lead_submitted` | `/api/lead` answered `res.ok && data.ok` | `forms.ts` `submit()` before `thankYou()` | `location`, `ad_variant` | per success |
| `thank_you_view` | thank-you state rendered | `forms.ts` `thankYou()` | `location` | per render |
| `magnet_opened` | `/plan` load with `utm_source=email` | `plan-page.ts` after render | — (URL carries params) | once per load |

## Files

- Create `src/lib/funnel.ts` — pure: `once()`, `sectionVisible()`, `stepProps()`, `resultProps()`, `isSafeProps()`.
- Create `src/lib/funnel.test.ts`.
- Create `src/lib/track.ts` — `track()` + `loadUmami()` (browser).
- Create `src/lib/track.test.ts` — queue / no-op / e-mail guard with a fake `window`.
- Create `src/scripts/analytics.ts` — calls `loadUmami()`; imported from `Base.astro`.
- Create `src/scripts/funnel.ts` — DOM wiring for the index page; imported from `index.astro`.
- Modify `src/layouts/Base.astro` — `<script>import '../scripts/analytics.ts'</script>`.
- Modify `src/pages/index.astro` — import `funnel.ts`.
- Modify `src/scripts/forms.ts` — `form_error`, `lead_submitted`, `thank_you_view`.
- Modify `src/scripts/plan-page.ts` — `magnet_opened`.
- Modify `.env.example` — `PUBLIC_UMAMI_WEBSITE_ID=`.
- Create `scripts/funnel-check.mjs` — Playwright end-to-end event check.
- Modify `src/pages/ochrana-osobnich-udaju.astro`, `data/sources.md` (§10), `docs/decisions.md` (§12, §16).
- Create `docs/readme-drafts/tracking.md`, `docs/readme-drafts/ab-tests.md`.
- Modify `docs/ai-worklog.md`.

## Review Focus

1. **Ad B landing with no touch** must not produce `interaction_start`, `step_complete` or `interaction_complete` (the result is pre-rendered). Pinned in Task 5's Playwright run (ad B: load, wait, assert none).
2. **Slider drag** fires `tool:result` every animation frame; `interaction_complete` and `step_complete` B must still fire once. Pinned in Task 5 (drag across 10 steps, assert counts = 1) and Task 1 unit tests for `once()`.
3. **Events before the Umami script has loaded** (fast tap on a chip on 4G) must be queued, not lost. Pinned in Task 2 unit test (track before load → flush on load).
4. **An e-mail-like string in a prop** (a future change passing `email`, or a ticker param tampered into `x@y.cz`) must not be sent. Pinned in Task 1 (`isSafeProps`) and Task 2 (`track` drops it).
5. **Tall sections** (tool on a 390 px phone) must still produce `section_view`. Pinned in Task 1 (`sectionVisible` with a section 3× the viewport) and Task 5 (scroll run).

---

### Task 1: Pure funnel helpers

**Files:** Create `src/lib/funnel.ts`, `src/lib/funnel.test.ts`

**Interfaces:**
- Consumes: `Selection` from `src/lib/selection.ts`.
- Produces:
  - `type Props = Record<string, string | number>`
  - `once(): (key: string) => boolean` — returns `true` the first time a key is seen.
  - `sectionVisible(e: { intersectionRect: { height: number }; boundingClientRect: { height: number } }, viewportH: number): boolean`
  - `stepProps(step: 'a' | 'b' | 'c', sel: Selection): Props`
  - `resultProps(sel: Selection): Props`
  - `isSafeProps(p: Props | undefined): boolean`

- [ ] **Step 1: Write the failing tests** (`src/lib/funnel.test.ts`)

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once, sectionVisible, stepProps, resultProps, isSafeProps } from './funnel.ts';
import type { Selection } from './selection.ts';

const sel: Selection = { tickers: ['VOO', 'QQQ'], monthly: 3000, years: 20, returnPct: 5, broker: 'xtb', dividends: 'acc' };
const box = (visible: number, height: number) => ({ intersectionRect: { height: visible }, boundingClientRect: { height } });

test('once: true only the first time per key', () => {
  const seen = once();
  assert.equal(seen('a'), true);
  assert.equal(seen('a'), false);
  assert.equal(seen('b'), true);
});

test('sectionVisible: half of a short section', () => {
  assert.equal(sectionVisible(box(199, 400), 844), false);
  assert.equal(sectionVisible(box(200, 400), 844), true);
});

test('sectionVisible: a section 3x the viewport counts once it fills half the screen', () => {
  assert.equal(sectionVisible(box(421, 2532), 844), false);
  assert.equal(sectionVisible(box(422, 2532), 844), true);
});

test('sectionVisible: zero-height section never counts', () => {
  assert.equal(sectionVisible(box(0, 0), 844), false);
});

test('stepProps: only the fields of that step', () => {
  assert.deepEqual(stepProps('a', sel), { step: 'a', tickers: 'VOO,QQQ' });
  assert.deepEqual(stepProps('b', sel), { step: 'b', monthly: 3000, years: 20, broker: 'xtb' });
  assert.deepEqual(stepProps('c', sel), { step: 'c', dividends: 'acc' });
});

test('resultProps: tickers, amount, horizon', () => {
  assert.deepEqual(resultProps(sel), { tickers: 'VOO,QQQ', monthly: 3000, years: 20 });
});

test('isSafeProps: rejects anything that looks like an e-mail', () => {
  assert.equal(isSafeProps(undefined), true);
  assert.equal(isSafeProps({ location: 'inline' }), true);
  assert.equal(isSafeProps({ x: 'jan@seznam.cz' }), false);
  assert.equal(isSafeProps({ x: 'a@b' }), false);
});
```

- [ ] **Step 2: Run** `node --test src/lib/funnel.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** `src/lib/funnel.ts`

```ts
// Pure parts of the funnel tracking (decisions §12, plan 2026-10-15-phase4). DOM wiring: src/scripts/funnel.ts.
import type { Selection } from './selection.ts';

export type Props = Record<string, string | number>;

export function once() {
  const seen = new Set<string>();
  return (key: string) => !seen.has(key) && !!seen.add(key);
}

// ≥ 50 % of the section, or the section fills ≥ 50 % of the screen (the tool is taller than two phone screens).
export function sectionVisible(e: { intersectionRect: { height: number }; boundingClientRect: { height: number } }, viewportH: number) {
  const need = Math.min(e.boundingClientRect.height, viewportH) / 2;
  return need > 0 && e.intersectionRect.height >= need;
}

export function stepProps(step: 'a' | 'b' | 'c', s: Selection): Props {
  if (step === 'a') return { step, tickers: s.tickers.join(',') };
  if (step === 'b') return { step, monthly: s.monthly, years: s.years, broker: s.broker };
  return { step, dividends: s.dividends };
}

export const resultProps = (s: Selection): Props => ({ tickers: s.tickers.join(','), monthly: s.monthly, years: s.years });

// Last line of defence: no e-mail address ever leaves in an event (CLAUDE.md tracking, GDPR).
export const isSafeProps = (p?: Props) => !p || Object.values(p).every((v) => typeof v !== 'string' || !v.includes('@'));
```

- [ ] **Step 4: Run** `node --test src/lib/funnel.test.ts` → PASS; `npm test` → all green.
- [ ] **Step 5: Commit** `feat: pure funnel helpers (dedupe, section visibility, event props)`

### Task 2: `track()` wrapper and Umami loader

**Files:** Create `src/lib/track.ts`, `src/lib/track.test.ts`, `src/scripts/analytics.ts`; modify `src/layouts/Base.astro`, `.env.example`

**Interfaces:**
- Consumes: `Props`, `isSafeProps` (Task 1); `adVariant`, `sanitizeUtm` (`src/lib/selection.ts`).
- Produces: `track(name: string, props?: Props): void`; `loadUmami(): void`; `variant(): 'a' | 'b' | 'unknown'`; test hooks `_setup(win, id, dev)`.

- [ ] **Step 1: Write the failing tests** (`src/lib/track.test.ts`) — `track.ts` takes its globals through `_setup` so tests run in Node without a DOM.

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { track, _setup, _flush } from './track.ts';

test('no website ID: no-op, logs in dev', () => {
  const logs: unknown[][] = [];
  _setup({} as never, '', true, (...a) => logs.push(a));
  track('cta_click', { location: 'sticky' });
  assert.deepEqual(logs, [['[track]', 'cta_click', { location: 'sticky' }]]);
});

test('queued before the script loads, flushed in order after', () => {
  const sent: unknown[][] = [];
  const win: { umami?: { track: (n: string, d?: object) => void } } = {};
  _setup(win as never, 'site-id', false);
  track('interaction_start', { step: 'a', ad_variant: 'a' });
  track('step_complete', { step: 'a', tickers: 'VOO' });
  win.umami = { track: (n, d) => sent.push([n, d]) };
  _flush();
  track('interaction_complete', { tickers: 'VOO', monthly: 3000, years: 20 });
  assert.deepEqual(sent.map(([n]) => n), ['interaction_start', 'step_complete', 'interaction_complete']);
});

test('drops an event whose props contain an e-mail', () => {
  const sent: unknown[] = [];
  _setup({ umami: { track: (n: string) => sent.push(n) } } as never, 'site-id', false);
  track('form_error', { reason: 'jan@seznam.cz' });
  assert.deepEqual(sent, []);
});
```

- [ ] **Step 2: Run** `node --test src/lib/track.test.ts` → FAIL.

- [ ] **Step 3: Implement** `src/lib/track.ts`

```ts
// The one door to analytics (decisions §11–12). Umami Cloud, cookieless; ad_variant rides on every event as data-tag.
import { isSafeProps } from './funnel.ts';
import type { Props } from './funnel.ts';
import { adVariant, sanitizeUtm } from './selection.ts';

type Umami = { track: (name: string, data?: Props) => void };
type Win = { umami?: Umami };

let win: Win = typeof window === 'undefined' ? {} : (window as unknown as Win);
let id: string = import.meta.env?.PUBLIC_UMAMI_WEBSITE_ID ?? '';
let dev: boolean = !!import.meta.env?.DEV;
let log = (...a: unknown[]) => console.debug(...a);
let queue: [string, Props?][] = [];

export function _setup(w: Win, websiteId: string, isDev: boolean, logger = log) {
  win = w; id = websiteId; dev = isDev; log = logger; queue = [];
}
export function _flush() {
  const q = queue;
  queue = [];
  q.forEach(([n, p]) => track(n, p));
}

export const variant = () => adVariant(sanitizeUtm(new URLSearchParams(location.search)).utm_content);

export function track(name: string, props?: Props) {
  if (!isSafeProps(props)) return;
  if (!id) { if (dev) log('[track]', name, props); return; }
  if (win.umami) win.umami.track(name, props);
  else queue.push([name, props]); // script still loading (async): flushed by loadUmami's onload
}

export function loadUmami() {
  if (!id) return;
  const s = document.createElement('script');
  s.src = 'https://cloud.umami.is/script.js';
  s.async = true; // injected scripts never block parsing; no layout impact (no DOM output)
  s.dataset.websiteId = id;
  s.dataset.tag = variant();
  s.onload = _flush;
  document.head.append(s);
}
```

`src/scripts/analytics.ts`:

```ts
// Loaded on every page from Base.astro. No website ID (local, previews) → nothing is loaded.
import { loadUmami } from '../lib/track.ts';
loadUmami();
```

`src/layouts/Base.astro`: after `<slot />` add

```astro
    <script>
      import '../scripts/analytics.ts';
    </script>
```

`.env.example`: append

```
# Umami Cloud website ID (decisions §11). Set only in Vercel's Production environment; empty = no analytics, track() logs in dev.
PUBLIC_UMAMI_WEBSITE_ID=
```

- [ ] **Step 4: Run** `npm test` → all green. `npx astro build` → OK. `node scripts/size.mjs dist/index.html dist/plan/index.html` → under 60 kB (expect ≈ 14.5 kB + 2.3 kB external Umami, which size.mjs does not count: note it in the report).
- [ ] **Step 5: Commit** `feat: track() wrapper and cookieless Umami loader with ad_variant tag`

### Task 3: Funnel wiring on the landing page

**Files:** Create `src/scripts/funnel.ts`; modify `src/pages/index.astro`

**Interfaces:** Consumes `track`, `variant` (Task 2); `once`, `sectionVisible`, `stepProps`, `resultProps` (Task 1); `parseSelection` + `US_TICKERS`; `tool:result` event (`detail: Selection`).

- [ ] **Step 1: Implement** `src/scripts/funnel.ts`

```ts
// Funnel events on the landing page (decisions §12; event table in docs/superpowers/plans/2026-10-15-phase4-tracking.md).
// Listens from outside tool.ts/forms.ts: delegated DOM events, the tool:result event, two observers.
import { track, variant } from '../lib/track.ts';
import { once, sectionVisible, stepProps, resultProps } from '../lib/funnel.ts';
import { parseSelection } from '../lib/selection.ts';
import type { Selection } from '../lib/selection.ts';
import { US_TICKERS } from '../lib/data.ts';

const first = once();
const tool = document.querySelector<HTMLElement>('.tool');
const inline = document.querySelector<HTMLFormElement>('#lead-inline');
const sel = () => parseSelection(new URLSearchParams(new FormData(inline!) as unknown as Record<string, string>), US_TICKERS);

// section_view / form_view: thresholds at every 10 % so tall sections are re-checked as they scroll.
const seen = (attr: (el: Element) => [string, string]) => new IntersectionObserver((entries, obs) => entries.forEach((e) => {
  if (!sectionVisible(e, innerHeight)) return;
  const [name, key] = attr(e.target);
  obs.unobserve(e.target);
  if (first(key)) track(name, name === 'section_view' ? { section: key.slice(8) } : { location: key.slice(5) });
}), { threshold: [...Array(11).keys()].map((i) => i / 10) });
const sections = seen((el) => ['section_view', `section:${(el as HTMLElement).dataset.section}`]);
document.querySelectorAll('[data-section]').forEach((el) => sections.observe(el));
const forms = seen((el) => ['form_view', `form:${(el as HTMLElement).dataset.location}`]);
document.querySelectorAll('.lead-form').forEach((el) => forms.observe(el));

// form_start: first focus in the e-mail field of each form.
document.querySelectorAll<HTMLFormElement>('.lead-form').forEach((f) => f.addEventListener('focusin', (e) => {
  if ((e.target as HTMLInputElement).name === 'email' && first(`start:${f.dataset.location}`)) track('form_start', { location: f.dataset.location! });
}));

// cta_click: every click on a "go to the form" link or a submit button.
document.addEventListener('click', (e) => {
  const t = e.target as Element;
  const loc = t.closest('[data-sticky] a') ? 'sticky'
    : t.closest<HTMLElement>('a[data-cta]')?.dataset.cta
    ?? (t.closest('button[type="submit"]') && t.closest<HTMLFormElement>('.lead-form')?.dataset.location);
  if (loc) track('cta_click', { location: loc });
});

// interaction_start / step_complete: the visitor's own actions in the tool (never the ad-B preselection).
let touched = false;
const act = (step: 'a' | 'b' | 'c', complete: boolean) => {
  touched = true;
  if (first('start')) track('interaction_start', { step, ad_variant: variant() });
  if (complete && first(`step:${step}`)) track('step_complete', stepProps(step, sel()));
};
tool?.addEventListener('click', (e) => {
  const t = e.target as Element;
  const chip = t.closest<HTMLButtonElement>('[data-ticker]');
  // tool.ts flips aria-pressed in its own (earlier-registered) listener; "on" = a pick was added
  if (chip) act('a', chip.getAttribute('aria-pressed') === 'true' && chip.dataset.ticker !== 'other');
  else if (t.closest('[data-ret]')) act('b', false);
  else if (t.closest('[data-expand]')) act('a', false);
});
tool?.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.closest('.lead-form')) return;
  act(t.name === 'dividends' ? 'c' : 'b', true);
});

// interaction_complete: first result after a real interaction (ad B renders one on load, decisions §4).
window.addEventListener('tool:result', ((e: CustomEvent<Selection>) => {
  if (touched && first('result')) track('interaction_complete', resultProps(e.detail));
}) as EventListener);
```

Note for the implementer: `tool.ts` is imported in `Tool.astro`, which renders before this script in `index.astro`, so its click listener on `#step-a` runs before the one on `.tool` (bubbling from inner to outer element), meaning `aria-pressed` is already updated. Verify this in Task 5, not by reasoning.

`src/pages/index.astro`: after `</Base>` add

```astro
<script>
  import '../scripts/funnel.ts';
</script>
```

- [ ] **Step 2: Build and smoke-check** `npx astro build`; `npm test`; confirm `dist/index.html` has one module script per page script (no duplicate funnel.ts).
- [ ] **Step 3: Commit** `feat: funnel events on the landing page (sections, tool, CTAs, form view/start)`

### Task 4: Server-confirmed events in forms.ts and /plan

**Files:** Modify `src/scripts/forms.ts`, `src/scripts/plan-page.ts`

- [ ] **Step 1: forms.ts** — import `track`, `variant` from `../lib/track.ts`. In `submit()`:

```ts
  const loc = f.dataset.location!;
  if (!v.ok) { track('form_error', { reason: v.reason, location: loc }); return showError(f, MSG[v.reason], true); }
  ...
    if (res.ok && data?.ok) {
      track('lead_submitted', { location: loc, ad_variant: variant() }); // only after the server confirmed (decisions §6)
      return thankYou(...unchanged...);
    }
    if (res.status === 429) { track('form_error', { reason: 'rate', location: loc }); showError(f, MSG.rate, false); }
    else if (res.status === 400 && (data?.reason === 'invalid' || data?.reason === 'empty')) { track('form_error', { reason: data.reason, location: loc }); showError(...unchanged...); }
    else { track('form_error', { reason: 'server', location: loc }); showError(f, MSG.server, false); }
  } catch {
    track('form_error', { reason: 'network', location: loc });
    showError(f, MSG.server, false);
  }
```

In `thankYou()`, after `heading.focus();`: `track('thank_you_view', { location: f.dataset.location! });`
Update the header comment line "Analytics (Phase 4) hooks in at…" to say where they are now.

- [ ] **Step 2: plan-page.ts** — inside `if (root) { … }` after `replaceChildren`:

```ts
  // The e-mail's "Otevřít plán online" link carries utm_source=email (src/lib/email.ts); decisions §6 step 3.
  if (new URLSearchParams(location.search).get('utm_source') === 'email') track('magnet_opened');
```

- [ ] **Step 3: Run** `npm test`, `npx astro build`, `node scripts/size.mjs dist/index.html dist/plan/index.html dist/chyba-formulare/index.html`.
- [ ] **Step 4: Commit** `feat: form_error, lead_submitted, thank_you_view and magnet_opened`

### Task 5: Playwright funnel check (real Umami script, intercepted)

**Files:** Create `scripts/funnel-check.mjs`; output `docs/funnel-check.log`

- [ ] **Step 1: Write the script.** Pattern from `scripts/screenshots.mjs` (static server for `dist/` on :4399) plus `/api/lead` → `handleLead` with the dry-run Brevo (`brevoFromEnv({}, fetch)`). Build first with a fake ID: `PUBLIC_UMAMI_WEBSITE_ID=00000000-0000-4000-8000-000000000000 npx astro build`.
  - `page.route('https://cloud.umami.is/script.js', …)`: fetch once with Node and fulfil from memory.
  - `page.route('https://gateway.umami.is/api/send', r => { log.push(JSON.parse(r.request().postData()).payload); r.fulfill({ status: 200, body: '{}' }) })` — also record the payload `type` and fail on any request to another analytics host.
  - Scenarios (390×844, `isMobile`, `hasTouch`):
    1. **Ad A** `/?utm_source=instagram&utm_medium=paid_social&utm_campaign=etf_dvojce_2026q4&utm_content=ad_a_blocked`: tap VOO, tap QQQ, tap VOO off, "Pokračovat" → drag `#in-m` over 10 steps (keyboard ArrowRight ×10 + change), pick broker XTB, dividends acc, scroll to the bottom slowly, scroll back, click the sticky link, focus inline e-mail, submit empty → `form_error empty`, type `test@example.com`, submit → dry-run 200 → thank-you.
    2. **Ad B** same UTMs with `ad_b_fees`: wait 2 s with no input and **assert no interaction_start / step_complete / interaction_complete**; then move `#in-y`, then the same form path on the **footer** form with a server error forced once (`route('**/api/lead', 502)` for the first POST) → `form_error server`, then success.
    3. **No UTM** `/` → tag `unknown`.
    4. **/plan** `?t=VOO&m=3000&y=20&r=5&b=xtb&d=acc&utm_source=email` → `magnet_opened` once; same URL without `utm_source` → none.
    5. **No website ID** build is not repeated here; covered by the unit test.
  - Assertions: for each scenario a table of `name → count` and expected props; every `once` event count = 1; `page_view` payload `url` contains all five `utm_*`; every payload `tag` = expected variant; no payload value contains `@`. Exit 1 on any mismatch.
  - Write the human-readable log (one line per send: scenario, type, name, tag, data) to `docs/funnel-check.log`.
- [ ] **Step 2: Run** → all assertions pass. Fix the code (not the expectations) on failure, using superpowers:systematic-debugging.
- [ ] **Step 3: Rebuild without the fake ID** (`npx astro build`) so `dist/` is clean; `git checkout data/fx.json` if prebuild changed it.
- [ ] **Step 4: Commit** `test: Playwright funnel check against the real Umami tracker` (script + log).

### Task 6: Privacy page analytics paragraph (researched)

**Files:** Modify `data/sources.md` (new §10), `src/pages/ochrana-osobnich-udaju.astro`

- [ ] **Step 1: Research** (statute text first, like §9): GDPR art. 6(1)(f) and recital 47; ePrivacy Directive 2002/58/EC art. 5(3) and its Czech transposition, zákon 127/2005 Sb. § 89 odst. 3 (wording after the 2021/2022 amendment, opt-in); **EDPB Guidelines 2/2023 on the technical scope of art. 5(3)** (whether a cookieless script that reads screen size/language/UA and sends it counts as "gaining access"); any ÚOOÚ statement on cookieless analytics. Sources: EUR-Lex mirror, zakonyprolidi.cz, edpb.europa.eu, uoou.gov.cz. Record quotes and retrieval dates in `data/sources.md` §10 ("verified" / "my reading" / "not determined").
- [ ] **Step 2: ✋ If the reading says consent is needed** (EDPB 2/2023 may put the tracker's device reads under art. 5(3)), **stop and ask Matěj**: options (a) keep cookieless Umami without banner and state the reasoning + risk in README, (b) add a minimal consent bar that does not cover the first screen and load Umami only after consent (measurement loss), (c) send only server-side events. Do not pick one alone: it changes decisions §11.
- [ ] **Step 3: Write the paragraph** (Czech, same voice as the page): what is measured (page visits incl. link params, which sections/steps/buttons were used, form errors by type, country/browser/device), no cookies, no e-mail or IP stored (Umami keeps an anonymous hash of IP + browser + site), provider Umami Software, Inc. (USA) with data in the EU region, transfers under the EU SCCs (DPA), retention 6 months (Hobby), legal basis as researched, right to object (art. 21) + Do Not Track note only if we enable `data-do-not-track`. Add Umami to the "Kdo údaje uvidí" list. Remove the "Phase 4 adds…" comment.
- [ ] **Step 4: Build**, eyeball the page in the Playwright screenshot of `/ochrana-osobnich-udaju/` (re-run `node scripts/screenshots.mjs`, which scans every page for console errors and overflow).
- [ ] **Step 5: Commit** `data: legal basis for cookieless analytics` and `content: analytics paragraph on the privacy page` (two commits).

### Task 7: README drafts, A/B cards, decisions, worklog

**Files:** Create `docs/readme-drafts/tracking.md`, `docs/readme-drafts/ab-tests.md`; modify `docs/decisions.md`, `docs/ai-worklog.md`

- [ ] **Step 1: `tracking.md`** (Czech): the event table above; funnel definition (Umami funnel: Viewed page `/` → `interaction_start` → `interaction_complete` → `form_view` → `form_start` → `lead_submitted`, window 60 min, filtered by tag a / b); conversion formula **CR(variant) = Brevo contacts with `AD_VARIANT = v` ÷ Umami pageviews of `/` with tag `v`**, same date range; **measurement-loss check** = 1 − (Umami `lead_submitted` with tag v ÷ Brevo contacts with `AD_VARIANT = v`), expected causes (ad blockers, closed tab, honeypot bots counted in Umami not in Brevo); event budget; the eight decisions above; what is not tracked (no-JS visitors, `/dekujeme/`).
- [ ] **Step 2: Load `marketing-skills:ab-testing`** and write `ab-tests.md`: three cards from decisions §13 (ad angle + entry step; gate depth; ask framing), each with hypothesis (because/if/then), primary metric (Brevo leads ÷ pageviews per variant), guardrail metrics, MDE, **sample size per variant computed by a small Node script** (two-proportion z-test, α = 0.05 two-sided, power 0.8; baseline 4 %, 5 % and 6 % from `data/benchmarks.md`), duration at a **stated assumption** of daily visitors (e.g. 300/day, labelled as an assumption, not a forecast), ranking by expected impact with the reason. Only `data/benchmarks.md` numbers; no skill tables. Put the Node calculation in `scripts/sample-size.mjs` with an assert-based self-check against a hand-computed value.
- [ ] **Step 3: decisions.md** — update §12 (page_view = Umami pageview, tag, props trimmed, interaction_complete rule, section rule) and add §16 "Phase 4 tracking decisions" with the table of decisions 1–8 and the provider verification summary.
- [ ] **Step 4: ai-worklog.md** — entry for Phase 4: skills loaded (writing-plans, analytics, ab-testing), every subagent prompt verbatim, what was verified and how, mistakes caught.
- [ ] **Step 5: Commit** each file group separately (`docs: README draft for tracking and conversion formula`, `docs: A/B test cards with sample sizes`, `docs: phase 4 tracking decisions`, `docs: phase 4 worklog`).

### ✋ Stop and report to Matěj

Event table, the `docs/funnel-check.log` excerpts for ad A and ad B, `size.mjs` output (+ 2.3 kB Umami script), provider verification table with sources, and what's needed for the live check: (1) OK to create an Umami Cloud Hobby account, **region = European Union** (cannot be changed later), add website = the Vercel domain; (2) OK to deploy to Vercel with `PUBLIC_UMAMI_WEBSITE_ID` in Production only; (3) then: run both ad URLs on a phone, build the funnel report in Umami, screenshot into `docs/`.
