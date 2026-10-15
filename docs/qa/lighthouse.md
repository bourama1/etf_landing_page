# Lighthouse (mobile) on the deployed URL — 2026-10-15

`npx lighthouse@13.5.0 <url> --form-factor=mobile` (default mobile preset: simulated slow 4G, 150 ms RTT,
1.6 Mbps, 4× CPU slowdown), Playwright's Chromium 1248, 3 runs per page, median run by LCP saved as
`lighthouse-<page>.html`. URL: https://etf-landing-page-sigma.vercel.app (commit 06ebb60).

| Page | LCP runs (ms) | LCP median | FCP | CLS | TBT | Perf | A11y | Best pr. | SEO | Audits < 0.9 |
|---|---|---|---|---|---|---|---|---|---|---|
| ad A `/?utm_content=ad_a_blocked` | 1365 / 1371 / 1491 | 1371 | 921 | 0.000 | 0 | 100 | 100 | 100 | 100 | network-dependency-tree (informative) |
| ad B `/?utm_content=ad_b_fees` | 1364 / 1368 / 1371 | 1368 | 918 | 0.000 | 0 | 100 | 100 | 100 | 100 | network-dependency-tree (informative) |
| `/plan/?t=VOO&m=3000&y=20` | 1364 / 1364 / 1365 | 1364 | 850 | 0.000 | 10 | 100 | 100 | 100 | 60 | is-crawlable: `noindex` is deliberate (personal plan URLs) |
| `/ochrana-osobnich-udaju/` | 1217 / 1218 / 1220 | 1218 | 820 | 0.000 | 0 | 100 | 100 | 100 | 100 | network-dependency-tree (informative) |

Budget (CLAUDE.md): LCP < 2.0 s on throttled 4G ✔, CLS ≈ 0 ✔.

## First run (commit 7bbf7f9), before the fixes

| Page | LCP | CLS | Perf | Problems |
|---|---|---|---|---|
| ad A | 1370 | 0.000 | 100 | `/favicon.ico` 404 in the console |
| ad B | 1366 | **0.138** | 95 | Step A collapsed by a deferred script after first paint; favicon 404 |
| `/plan` | 1364 | **0.429** | 81 | footer pushed down when the plan renders; `td-has-header`; favicon 404 |
| privacy | 1215 | 0.000 | 100 | favicon 404 |

Lighthouse's lab run did not show the font-swap shift that `scripts/qa-live.mjs` found under real (not simulated)
throttling: 0.12–0.22 on every page, caused by a fallback font scaled 130.8 % instead of ~98 %. Fixes: commits
4ab27e6 (font metrics), ef1a489 (ad B), 2fd35e3 (`/plan` height), 74a2e60 (row headers), c779079 (favicon).
