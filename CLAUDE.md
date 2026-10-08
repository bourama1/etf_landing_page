# CLAUDE.md — ETF lead-magnet landing page (job assignment, Zadanie B)

## What this project is

A take-home task for a **Junior AI Developer** position. The deliverable is a mobile-first landing page that
compares **NYSE-traded ETFs** for a **Czech retail investor** arriving from a mobile ad, works as a **lead magnet**
(value in exchange for a contact), is deployed on free hosting, and measures the full funnel from arrival to form
submission.

The reviewer's main question: **"Could we start running ads to this page tomorrow?"**
Everything — copy, design, tracking, legal basics, speed — is judged against that.

- **Deadline:** 16 Oct 2026 (reply to the e-mail with the GitHub repo link + live URL).
- **The original brief is at the bottom of this file (Slovak, verbatim). It is the source of truth.**
  When it is ambiguous, make a decision, note it in `docs/decisions.md`, and justify it later in the README.

## Hard deliverables (checklist)

- [ ] Public GitHub repo with **incremental commit history** (no single "initial commit" dump)
- [ ] Live URL on free hosting
- [ ] `README.md` containing:
  - target audience, what the visitor gets for their contact, and **when** we ask for it
  - **rationale for the order of sections**
  - **expected conversion rate** with the reasoning / benchmarks it is based on
  - **three A/B test hypotheses ranked by expected impact**
  - how AI was used: what instructions agents got, how output was checked, **where the AI made mistakes**
  - what is missing / what I would do with more time
  - data sources for every number on the page
- [ ] `ads/` — **two ad versions** (visual + copy), each linked to the page via UTM parameters
- [ ] `ai-log/` — exports of Claude Code conversations (`/export`)
- [ ] Funnel tracking working on the live page (arrival → interaction → form view → form start → submit)

## The key domain insight — read before designing anything

**Czech retail investors generally cannot buy US-domiciled ETFs listed on NYSE** (e.g. VOO, SPY, QQQ, VTI).
Under the EU PRIIPs regulation, a product sold to retail clients needs a Key Information Document (KID), and US
issuers do not publish one, so EU brokers block these orders for retail clients. Professional clients (MiFID II)
are an exception.

This is not a footnote — it is the best hook for the page. The visitor saw "VOO / S&P 500 ETF" in an ad or on a
forum, tries to buy it, and hits a wall. The page can deliver real value by **comparing popular NYSE ETFs with
their UCITS equivalents listed in Europe** (same index, different domicile, fees, accumulating vs distributing,
currency, where to buy them from CZ).

Before relying on it, **verify and cite** (with retrieval date) each of these in `data/`:
- PRIIPs/KID restriction still applies to retail in 2026 (regulation text + at least one broker's help page)
- US dividend withholding tax for CZ residents (treaty rate with W-8BEN) and how Irish-domiciled UCITS ETFs differ
- US estate tax exposure for non-US holders of US-domiciled assets
- Czech personal income tax rules for selling securities (time test, annual exemption threshold, any cap) — these
  changed recently, so do **not** use remembered numbers

If a claim cannot be verified from a primary or reputable source, it does not go on the page.

## Phase plan (stop for my review at each ✋)

**Phase 0 — Decisions (no code).** Write `docs/decisions.md` covering:
1. Persona(s): age, income, investing experience, device, what the ad promised them, what they fear (fees,
   choosing wrong, taxes, "is it legal for me to buy this?").
2. The lead magnet: what exactly is delivered (e.g. a personalised PDF/e-mail "your UCITS alternatives to the
   ETFs you wanted + fee impact over 20 years + tax checklist for CZ"). Must be **useful before the form** —
   the page shows a meaningful partial result, the full/personalised version is behind the e-mail.
3. **The moment we ask for the contact** (e.g. after the visitor sees their calculated result, not on load).
4. Interactive elements (comparison, fee calculator, portfolio builder) — pick at most 1–2; each must end in the CTA.
5. Form fields: aim for **e-mail only** + an optional, unticked marketing-consent checkbox (a required one would not
   be freely given, GDPR art. 7(4); see `docs/decisions.md` §5). Justify any extra field.
6. What happens after submit: on-page thank-you state with immediate value + e-mail delivery.
7. Two ad concepts with different angles (so the A/B test is meaningful), platform (Meta/IG feed or stories,
   TikTok, Google Discovery…), and how the page's first screen mirrors each ad's promise (message match via
   `utm_content`).
8. Hosting/analytics/form-backend choice (see Stack).
✋ Stop and show me the decisions.

**Phase 1 — Data.** Collect real ETF data into `data/etfs.json` (see Data rules). ✋ Show me the table + sources.

**Phase 2 — Copy.** Write all Czech page copy and both ads into `content/` before building UI. ✋ Review.

**Phase 3 — Build.** Page, interactive element, form, thank-you state, legal pages.

**Phase 4 — Tracking.** Implement and verify every funnel event on the deployed URL.

**Phase 5 — Deploy + QA.** Real phone test (or emulated mid-range Android on throttled 4G), Lighthouse,
form end-to-end with a real inbox, broken-link check.

**Phase 6 — README + ads export + ai-log.**

## Plugins & skills — how to use them here

Installed: superpowers, marketing-skills, frontend-design, ponytail, claude-md-management.
Use them per phase; don't load everything at once.

| Phase | Use | Notes |
|---|---|---|
| 0 Decisions | `product-marketing` first (writes `.agents/product-marketing.md` that all marketing skills read), then superpowers `brainstorming` driven by `lead-magnets`, `offers`, `free-tools`, `marketing-psychology` | Brainstorming's design doc = `docs/decisions.md` |
| 1 Data | no skill; plain research with sources | Never let a skill fill in numbers |
| 2 Copy + ads | `copywriting` → `copy-editing`; `ads` + `ad-creative` for the two ads; `emails` for the post-submit e-mail | Skills are English/SaaS-oriented: final copy must be natural Czech |
| 3 Build | superpowers `writing-plans` → `executing-plans` (or `subagent-driven-development` for the build, so the README has real agent prompts to show); `frontend-design` for UI; ponytail on `full` | No git worktrees needed: work on `main` with small commits |
| 4 Tracking | `analytics` for the event plan; `ab-testing` for the 3 hypotheses | |
| 5 QA | `cro` audit of the deployed page; superpowers `verification-before-completion`; `/ponytail-review` | |
| End of each session | claude-md-management to fold learnings into this file | Keep this file short |

Overrides (these win over plugin defaults):
- **TDD only where logic lives:** the fee/comparison calculator maths, form validation, and the lead API. No tests for
  static markup or copy. Don't delete UI code for lacking tests.
- **Ponytail must not remove** tracking events, consent/GDPR text, the honeypot, server-side validation, a11y attributes,
  or source/date labels. Those are requirements, not bloat.
- **Marketing skills must not add** fake social proof, fake counters, fake scarcity/urgency, or performance promises,
  even if a framework suggests them (finance + honesty rules below).
- Every skill used and every subagent prompt gets a line in `docs/ai-worklog.md`.

## Data rules (non-negotiable)

- **Never write a number from memory.** Every figure (TER, AUM, index, domicile, distribution policy, ISIN,
  ticker, inception date, returns) must come from a fetched source.
- Prefer primary sources: issuer fund pages and factsheets (Vanguard, iShares, SPDR, Invesco), KID documents,
  regulators (ESMA, ČNB, EUR-Lex), finanční správa (financnisprava.cz) for tax.
- Each record stores, per field or per record: `source_url`, `retrieved_at` (ISO date), and `as_of` date of the
  figure where the source states one.
- The page shows "Zdroj: … , stav k …" near the data. A static, dated snapshot is fine and preferred over a live
  API (no keys, no breakage on launch day). Document how to refresh it.
- If sources disagree, note it in `data/NOTES.md` and use the issuer's figure.
- Returns: only historical, clearly labelled, with the "minulá výkonnost není zárukou…" warning. No projections
  presented as expected returns — calculators use a user-adjustable assumption and say so.

## Copy & design rules

- **All page and ad copy in Czech**, natural and spoken — written for someone reading on a phone for 5 seconds.
  Short sentences, concrete numbers, "vy" form (decide formal vs informal in Phase 0 and keep it consistent).
- The first screen (no scrolling on a ~390×844 viewport) must contain: a headline that matches the ad promise,
  one line of what they get, and a visible primary action. No hero stock photo taking half the screen.
- **Must not look like a default Claude/AI output.** Avoid: purple/blue gradients, generic glassmorphism cards,
  emoji bullet lists, "Odemkněte svůj potenciál", "v dnešní uspěchané době", three identical feature cards,
  Inter-everything with no typographic character. Load the `frontend-design` skill guidance if available and
  commit to a deliberate visual direction (write it down in `docs/decisions.md`).
- Trust signals that are honest: data sources, dates, "nejsme broker, nic neprodáváme" (if true), no fake
  testimonials, no fake counters ("1 248 lidí si stáhlo…"), no fake urgency.
- Accessibility basics: contrast AA, tap targets ≥ 44 px, labels on inputs, works without JS for the core message.

## Legal basics (needed for "launch ads tomorrow")

- GDPR: clear purpose of the e-mail, consent checkbox (not pre-ticked) if we send marketing; privacy notice page;
  operator identity. Where real company details are unknown, use clearly marked placeholders and list them in
  README as "must fill before launch".
- Analytics consent: prefer a cookieless / no-persistent-ID analytics setup so no consent banner blocks the first
  screen; if that is not possible, explain the trade-off.
- Disclaimer: informational content, not investment advice/recommendation; past performance warning.
- Note in README: ad platforms have rules for financial-services ads — verify the current Meta/Google policy
  before launch.

## Tracking (the funnel)

Events (names are a suggestion; keep them consistent and documented in README):
`page_view` (with all UTM params + `ad_variant`), `section_view` (per section, once), `interaction_start`,
`interaction_complete` (result shown), `cta_click` (with location), `form_view`, `form_start` (first focus),
`form_error` (with reason), `lead_submitted` (**fired only after server confirms**), `thank_you_view`,
`magnet_opened` (e-mail/PDF link click, if feasible).

- Store the UTM/ad variant with the lead record so conversion can be attributed per ad.
- Build a funnel/report view in the analytics tool and screenshot it into `docs/` for the README.
- Note: **Vercel Web Analytics custom events are not available on the free Hobby plan** (Pro/Enterprise only), so
  use another tool for events — e.g. PostHog (EU cloud, has funnels), Umami, or Plausible-style alternatives.
  Verify the free-tier terms before choosing.

## Stack (defaults — confirm in Phase 0)

- Lightweight static-first site for mobile speed: Astro (or Vite + vanilla/Preact). Performance budget:
  LCP < 2.0 s on throttled 4G, total JS on first load < ~60 kB gzipped, no layout shift from fonts.
- Form backend: one serverless function → store lead (e.g. Supabase / Brevo contact list) and send the magnet
  e-mail (e.g. Brevo / Resend). Validate e-mail server-side, add a honeypot field, no CAPTCHA unless needed.
- Hosting: Vercel or Cloudflare Pages. Note that Vercel's Hobby plan is limited to non-commercial use — mention
  this in README and say what a real launch would use.
- Secrets only in env vars; provide `.env.example`; never commit keys.

## How to work with me (the human)

- I am the candidate; the reviewer will read how I worked with AI. Optimise for **transparency and verifiability**,
  not just output.
- Keep `docs/ai-worklog.md` updated as we go — after each significant step add: what was asked (or what a subagent
  was instructed), what came back, how it was checked, and **any mistake or hallucination caught** and how. Don't
  hide errors; they are part of the deliverable.
- If you spawn subagents, record their exact prompt in the worklog.
- Before claiming something works, prove it: run it, open it, check the deployed URL, show the event arriving in
  the analytics tool.
- **Commit small and often** with descriptive messages (e.g. `feat: fee calculator with UCITS comparison`,
  `data: add iShares CSPX factsheet figures`). One logical change per commit.
- Ask me before: choosing paid services, creating accounts, deploying, or making a decision that changes the
  concept. Otherwise pick a sensible default and note it in `docs/decisions.md`.
- Remind me at the end of each session to run `/export` and save it into `ai-log/`.
- README language: Czech (the reviewer writes Slovak; Czech is fine). Code, comments and commit messages: English.

## Repo layout (target)

```
/                 README.md, CLAUDE.md, .env.example
/src              page source
/data             etfs.json, sources, NOTES.md
/content          Czech copy (page + e-mail + thank-you)
/ads              ad-a/, ad-b/ (image + copy.md + target URL with UTMs)
/docs             decisions.md, ai-worklog.md, funnel screenshots, Lighthouse report
/ai-log           /export dumps
```

---

## Appendix — original brief (verbatim, Slovak)

> ZADANIE B: Konverzná landing page
>
> Cieľom je landing page s porovnaním ETF obchodovaných na NYSE pre českého drobného investora, ktorý prichádza z
> reklamy na mobile a stránke venuje len niekoľko sekúnd. Stránka má fungovať ako lead magnet: ponúknuť
> návštevníkovi hodnotu a výmenou za ňu získať jeho kontakt. Pekný dizajn nestačí, stránka musí byť optimalizovaná
> na prínos kontaktov. Zároveň nesmie pôsobiť ako základný výstup od Claude. Dizajn aj texty majú byť premyslené
> pre túto cieľovú skupinu. Pri hodnotení sa budem riadiť hlavne otázkou, či by sme na ňu mohli zajtra spustiť
> reklamu.
>
> Určte cieľovú skupinu, čo návštevník dostane výmenou za kontakt a v ktorom momente oň požiadate. Hodnota by mala
> byť zrejmá ešte pred vyplnením formulára. Navrhnite aj dve verzie reklamy. Prvá obrazovka stránky by mala
> nadväzovať na prísľub reklamy a okamžite komunikovať, čo návštevník získa.
>
> Výber interaktívnych prvkov, napríklad porovnania fondov, kalkulačky poplatkov alebo skladania portfólia,
> nechávam na Vás. Každý z nich by mal viesť ku kontaktu. Formulár by mal mať čo najmenej polí. Premyslite aj to,
> čo návštevník dostane po jeho odoslaní.
>
> Použite skutočné dáta s uvedením zdroja a merajte celú cestu od príchodu po odoslanie formulára. V README
> zdôvodnite poradie sekcií, uveďte očakávanú konverziu a tri hypotézy na A/B test zoradené podľa očakávaného
> dopadu. Stránku nasaďte na bezplatný hosting, napríklad Vercel.
>
> General instructions from the e-mail: work in Claude Code or similar; if time runs out, prioritise the essential
> parts and state what is missing; in README describe how you worked with AI (what instructions agents got, how
> you checked their output, where they made mistakes); if something in the brief is unclear, decide yourself and
> justify it in README. Repo must contain the result (for B: both ad versions), code with incremental commit
> history, and an `ai-log` folder with Claude Code conversation exports (`/export`). Use only real data with
> sources.
