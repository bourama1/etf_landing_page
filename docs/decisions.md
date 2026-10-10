# Phase 0 — Decisions

Status: **draft for review (✋)** · 2026-10-08 · revised the same day after `/ponytail-audit` (§4, §5, §6a, §7, §11, §12)
Inputs: `CLAUDE.md` (brief), `.agents/product-marketing.md` (positioning context), skills `product-marketing`,
`lead-magnets`, `offers`, `frontend-design`. Decisions marked **[user]** were made by Matěj in the Phase 0
brainstorm. Everything else is my default proposal and can be vetoed at this review.

Anything tagged **VERIFY** is a working assumption that Phase 1 must source before it appears on the page.

---

## 0. Premise check: does the hook hold?

CLAUDE.md says Czech retail investors "generally cannot buy" US-domiciled ETFs. A quick check on 2026-10-08
mostly confirms it, with one exception that changes the wording:

- **Confirmed (secondary sources):** EU brokers must block retail purchases of a PRIIP without a KID, and US issuers
  generally don't publish KIDs ([IBKR PRIIPs](https://ibkb.interactivebrokers.com/de/node/2993),
  [SEB notice](https://www.seb.lt/en/1st-january-2023-investment-fund-units-and-etfs-purchase-retail-client-restricted-if-priips-kid-not)).
  Selling existing holdings is usually still allowed.
- **Exception found:** [Finhacker](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-1-cast)
  quotes Fio saying ČNB took a "relatively accommodating" position, so Fio clients can still trade US ETFs
  execution-only (no advice, no active offering). The quote is secondhand and undated. Fio's current page only says
  it "does not offer ETFs, it provides market access". **Verified in Phase 1:** Fio's page says "U nás můžete
  obchodovat i s americkými ETF", and ČNB RS2018-12 B.2 backs execution-only access (`data/sources.md` §1).

**Decision:** the page never says "z Česka VOO nekoupíte". The wording is **"U většiny brokerů vám VOO jako
drobnému investorovi neprodají."** The concept rests on two legs, so it survives if Fio is confirmed:
1. *Access:* most brokers block it, and the UCITS twin is what you can actually buy.
2. *Suitability:* even where the US version is available, an **accumulating** UCITS twin may suit a Czech resident
   better: no payouts to declare each year, and no US estate-tax exposure.
   **Phase 1 update (2026-10-10, approved by Matěj):** the dividend-withholding argument was dropped. With a W-8BEN, a
   Czech resident pays 15 % on a US ETF, and an Irish fund pays the same 15 % at fund level. An Irish
   *distributing* class is actually the least tax-efficient option. Sources: `data/sources.md` §2–3. Fio confirmed
   that it sells US ETFs execution-only (`sources.md` §1.2–1.3), so leg 2 is what the page tells Fio users.

**Second correction:** while drafting the positioning I wrote "same index, lower fees". That is not safe. The US
originals have very low TERs and the UCITS twins are not reliably cheaper. The fee story is therefore framed as
**bank/active fund vs. index ETF** (ad B), not US vs. UCITS. Fees within the UCITS shortlist are compared neutrally.

---

## 1. Personas

Ages and behaviours below are planning assumptions, not data. They get sharper once real comments are mined
(Phase 2, from r/czech, r/eupersonalfinance and the comments on Finex/Finhacker articles).

### P1 — "Zablokovaný začátečník" (primary, ad A)
- **Who:** 24–35, full-time employee (IT, office, healthcare), saves a fixed amount monthly. Opened a broker app in
  the last year (XTB, Trading 212, Revolut, IBKR, Portu).
- **Experience:** Has watched US finance YouTube or read Reddit. Knows "S&P 500" and "VOO" but not "UCITS" or
  "domicil".
- **Device/context:** phone, Instagram in-app browser, a few seconds of attention, often on the go.
- **What the ad promised:** "Broker vám nedovolí koupit VOO? Má evropské dvojče."
- **Fears:** "Is it legal for me?", picking the wrong one among dozens of S&P 500 trackers, taxes, being sold to.
- **Job:** "Tell me the ticker I can actually buy and why it's equivalent."

### P2 — "Spořič s bankovním fondem" (secondary, ad B)
- **Who:** 30–45, has money in a savings account or a bank's mutual fund, heard ETFs are "cheaper" and is unsure how
  much it matters.
- **Experience:** Low. May never have opened a broker app.
- **Device/context:** phone, Facebook/Instagram feed.
- **What the ad promised:** "Kolik vás za 20 let stojí poplatky? Spočítejte si to v korunách."
- **Fears:** a hidden-fee sales pitch, complexity, losing money, taxes when selling.
- **Job:** "Show me in crowns what fees cost me, and what the cheaper route is."

**Anti-persona:** active traders, professional clients, crypto and stock-tip seekers, anyone wanting return
predictions.

---

## 2. Lead magnet (offer)

**Name:** *Váš ETF plán z Česka.* A personalised one-page plan delivered by e-mail.

| Offer component | Decision |
|---|---|
| 1. Twins | For every US ETF the visitor picked: the UCITS twin(s) with ISIN, Xetra ticker, TER, acc/dist and fund currency, with "zdroj, stav k …" (`data/etfs.json`). No same-index twin (VTI, SCHD) is said plainly (wording: open item). |
| 2. Akumulační, nebo distribuční? | A 3-row table for a Czech resident: US ETF / Irish acc / Irish dist. It covers the 15 % US tax, Czech tax on payouts, yearly paperwork and US estate tax. It answers the Fio user who *can* buy VOO. Source: `data/sources.md` §2.5, §3. |
| 3. Fees in CZK | Bank equity fund (entry "až 3–5 %", ongoing 1,75–2,59 %; KIDs in `data/bank-funds.json`) vs. index ETF (TER **plus** broker commission and FX: `data/brokers.json`), at their monthly amount, horizon and an adjustable return. Year-by-year in the e-mail. |
| 4. Daně z ETF v Česku 2026 (main part, not a bonus) | 3-year test per purchase (§ 4/1/u) · 100 000 Kč yearly limit on *sale proceeds*, all-or-nothing (§ 4/1/t) · no cap since 1. 1. 2026 · when foreign dividends go in the tax return (§ 38g(2)) · keep purchase confirmations · US estate tax above $60k for US ETFs. Every rule cites `data/sources.md` §2–4. Marked "informativní, nejde o daňové poradenství". |
| 5. Jak ho koupit | **Generic** (Matěj, 2026-10-10): "zadejte ISIN do vyhledávání u svého brokera", check acc/dist and exchange. No broker list, no ranking, no availability claims. |
| Guarantee | Exactly one e-mail with the plan. Newsletter only with a separate opt-in. One-click unsubscribe. "Nejsme broker, nic neprodáváme." |
| Scarcity/urgency | **None, on purpose.** The only time element is the honest "data k [datum]". No countdowns, no fake counters. |
| Price | An e-mail address. |

**Value equation check** (`offers` skill):
- *Dream outcome:* "I know exactly which ETF to buy and won't mess up taxes". Strong.
- *Likelihood:* sources and dates on every number, plus operator transparency. Medium, and it is the weakest lever
  because a new brand has no track record. Mitigation: show the sources visibly and the method in one sentence.
- *Time delay:* partial answer within ~10 s of the first tap, full plan in the inbox within a minute.
- *Effort:* 2–3 taps, then an e-mail address.

**Useful before the form:** the twin ticker and key facts (TER, acc/dist), a one-line verdict for every pick and the
total CZK fee difference appear immediately, so the visitor leaves with an answer even without converting. The
plan adds what the page holds back: ISINs and exchange tickers, the acc/dist tax table, the year-by-year fee
breakdown, the tax checklist and the buying steps.

*v2, 2026-10-10:* reworked after Phase 1 via the `lead-magnets` skill and approved by Matěj. The tax checklist
went from bonus to a main part because it is the best-sourced and most CZ-specific content. Section 2 replaces the
"UCITS = lower tax" idea. The fee comparison now includes broker costs, because without them it would flatter the ETF.

---

## 3. When we ask for the contact

- **Never on load.** No popup, no exit-intent modal (an in-app browser has no real exit intent anyway).
- **Primary ask:** inline, directly below the partial result, in the same visual block. "Chcete to celé, i s
  daňovým checklistem? Pošleme vám plán e-mailem."
- **Secondary ask:** a sticky bottom bar *after* the result is shown ("Poslat plán e-mailem") so it stays in reach
  while the visitor scrolls through the explainer.
- **Fallback ask:** a short form at the end of the page for skimmers who never touched the tool. It sends the plan
  for the default pick (VOO→S&P 500).

---

## 4. Interactive element

**[user]** chose *all three* proposed elements (translator, fee calculator, quiz). CLAUDE.md caps it at 1–2, so this
is a **deviation, resolved as one flow with three steps** rather than three separate widgets. One flow means one
"result" moment and one CTA. Veto this here if you'd rather cut to two.

```
Step A  Které ETF jste chtěli koupit?     chips: VOO · SPY · IVV · VTI · QQQ · VT · SCHD · "jiné"
        -> each tapped chip shows its UCITS twin(s) instantly (ticker, TER, acc/dist)
Step B  Kolik měsíčně a na jak dlouho?     amount slider (CZK) + horizon (years) + adjustable return
        -> fee line in CZK: bank fund vs. index ETF (ad B story) + spread within the twin shortlist
Step C  Dvě upřesnění (filters)            "Dividendy: vyplácet / reinvestovat" · "Měna fondu: USD / EUR / nevím"
        -> narrows the twin list; labelled as a filter, not a recommendation
Result  shortlist + fee number  ->  inline e-mail ask
```

- **Message match by ad:** `utm_content=ad_a_*` opens on Step A (as above). `utm_content=ad_b_*` opens on Step B
  with a VOO-equivalent preselected, so the first thing the visitor sees is the fee calculator the ad promised.
  No UTM, or any other value (Meta preview, typo, a future ad), opens on Step A with `ad_variant=unknown`. The raw
  `utm_content` is still stored, so those visits can be attributed later.
- **The quiz is reduced to two neutral filters.** A quiz that outputs "your ETF" reads as a personal recommendation
  (investment-advice risk under MiFID II, **VERIFY** wording in Phase 3). Filters plus a shortlist, with "Toto není
  doporučení" next to the result, stays on the information side.
- **Bank-fund fee comparison:** use actual TER and entry-fee ranges from KIDs of real Czech bank equity funds,
  cited. Do not name a bank in the headline. **VERIFY/source in Phase 1.**
- **Return assumption:** a user-adjustable slider with a visible label ("předpoklad, ne předpověď") and a default
  that is justified and sourced (e.g. a long-run historical figure with a citation) or kept deliberately
  conservative. Phase 1 decides.
- **No-JS:** the static page still states the core message and shows a static VOO/SPY/QQQ→twin table. The
  interactive layer enhances it.

---

## 5. Form fields

- **E-mail** (required, `type=email`, `autocomplete=email`, `inputmode=email`). That is the only required field.
- **Checkbox "Chci občas dostat novinky o ETF"** (optional, **not pre-ticked**). Delivering the requested plan
  doesn't need marketing consent, and making marketing consent a condition of getting the plan would not be freely
  given (GDPR art. 7(4)). The legal basis for sending the plan and for the newsletter is **VERIFY in Phase 3**,
  including Czech law 480/2004 Sb. on commercial communications.
- Text under the button: "Jeden e-mail s plánem. Odhlásíte se jedním klikem. Zásady ochrany osobních údajů."
- **Hidden:** the selections (tickers, amount, horizon, filters), UTM params, `ad_variant`, and a honeypot field.
- **Honeypot that autofill won't touch:** a meaningless field name (not `name`/`phone`/`email2`), `autocomplete="off"`,
  `tabindex="-1"`, `aria-hidden="true"`, and visually hidden. If it is filled, the server returns the normal success
  response (so bots learn nothing), sends nothing, and logs the drop so false positives can be counted.
- **No name field.** Personalisation comes from the selections, not the name, and every extra field costs
  conversions. No phone. No CAPTCHA unless spam shows up.

---

## 6. After submit

1. **Server confirms** (validates the e-mail, stores the contact with its attributes, sends the e-mail). Only then
   does `lead_submitted` fire. The rules for `/api/lead` are in §6a.
2. **On-page thank-you state replaces the form block:**
   - "Hotovo. Plán je na cestě na *vas@email.cz*." Plus a hint to check Promotions/Spam.
   - Unlocks on the page right away: the full comparison table, including ISINs and fee numbers for all picks.
   - The tax checklist and broker steps stay in the e-mail. That gives a reason to enter a real address and
     receive the e-mail.
   - Next step: "Pošlete to kamarádovi, který taky chtěl VOO" (pre-filled share link, no personal data).
3. **E-mail:** a short HTML e-mail with the plan inline, plus a "Otevřít plán online" link to `/plan?…`, which
   renders the plan from URL parameters (no database lookup). Loading that page fires `magnet_opened`. `/plan`
   follows the same input rule as the server (§6a, rule 1): unknown tickers are dropped and numbers clamped. It
   writes values with `textContent`, never `innerHTML`, so a crafted link can't inject content on our domain.

### 6a. Rules for `/api/lead`

This is the only part of the site that accepts input from the internet and sends e-mail in our name, so it gets
explicit rules. They come from `/ponytail-audit` findings 1–4 (see `docs/ai-worklog.md`).

1. **Never trust the hidden fields.** Tickers must exist in `data/etfs.json` and unknown ones are dropped. Amount,
   horizon and return are clamped to fixed ranges (the same ranges as the sliders). Filters must be one of their
   allowed values. Nothing from the request is put into the e-mail except these checked values. UTM values are
   stored as contact attributes (trimmed, length-capped) and **never** rendered in the e-mail. The e-mail template
   escapes everything it inserts. Without this rule, anyone could post `tickers=<a href="…">Váš účet je
   zablokován</a>` with a stranger's address and our sender would deliver a phishing mail.
2. **Validate the e-mail server-side:** syntax check plus a length cap. The client check is only for UX.
3. **One plan per address per 24 h.** The contact in Brevo stores `PLAN_SENT_AT`. If it is less than 24 h old, the
   attributes are updated but no new e-mail goes out. This needs no extra service because Brevo is the shared
   store, so it works across serverless instances.
4. **An existing contact is a success, not an error.** A second submit (inline form, then the sticky bar, or a
   return visit tomorrow) updates the contact and returns 2xx, so the visitor sees the thank-you state and
   `lead_submitted` fires. Combined with rule 3, they don't get spammed with copies.
5. **Per-IP rate limit** against a script with random addresses burning the free daily send limit. On Vercel each
   serverless instance has its own memory, so an in-process counter is not reliable. Options in order of
   preference: (a) a Vercel Firewall rate-limit rule on `/api/lead`, if the Hobby plan allows it (**VERIFY**);
   (b) a free Upstash Redis counter (**VERIFY** free tier, and it is a new account, so it needs Matěj's OK).
   Starting limit: a few submits per IP per hour, tuned after launch.
6. **Honeypot hit:** fake success, no contact stored, no e-mail sent, logged (see §5).

---

## 7. Ads

Platform: **Meta (Instagram Stories 9:16 + Feed 4:5)**. This matches the persona's device and context. TikTok is a
possible later test. **VERIFY Meta's financial-services ad policy before launch** (noted for the README).

| | Ad A — "Blocked trade" **[user]** | Ad B — "Fees in CZK" **[user]** |
|---|---|---|
| Persona | P1 | P2 |
| Hook (draft) | "Broker vám nedovolí koupit VOO?" | "Kolik vás za 20 let stojí poplatky?" |
| Promise | "Najdeme evropské dvojče, které koupit můžete." | "Spočítejte si to v korunách. Za 30 sekund." |
| Visual idea | Broker-app-style "Produkt není dostupný" error → VOO struck through → twin ticker beside it | Two cost lines in CZK diverging over 20 years (bank fund vs. index ETF) with *sourced* fees |
| Page opens on | Step A (translator) | Step B (fee calculator), VOO preselected |
| `utm_content` | `ad_a_blocked` | `ad_b_fees` |

UTM scheme: `utm_source=instagram&utm_medium=paid_social&utm_campaign=etf_dvojce_2026q4&utm_content=ad_a_blocked`
(or `ad_b_fees`). The page derives `ad_variant` from `utm_content` (`ad_a_*` → `a`, `ad_b_*` → `b`, anything
else → `unknown`). It is stored with the lead and sent with every analytics event.

Why these two make a meaningful A/B test: different persona, different emotional driver (blocked access vs.
money), and a different opening step on the page. The result tells us which problem the market cares about more.

---

## 8. Section order (draft; full rationale goes to the README)

1. **Hero** (variant by ad). Headline mirroring the ad, one line on what you get, and Step A chips (or Step B
   slider) **already in the first screen**. The interaction *is* the primary action. Trust line: "Nejsme broker.
   U každého čísla zdroj a datum."
2. **Tool → partial result → inline e-mail ask.** Value first, ask at the peak of interest.
3. **"Proč VOO často nejde koupit"**: three short facts with sources, for the sceptic who scrolls before tapping.
4. **What's in the plan**: a real preview of the e-mail plan (a screenshot of the actual template, not a mock
   book cover).
5. **Who's behind this / where the data comes from**: operator, method in one sentence, data date.
6. **FAQ**: free? spam? is it advice? "Fio mi VOO koupit dovolí — co teď?" Taxes?
7. **Final e-mail form + footer** (disclaimer, past-performance warning, operator, privacy).

Logic: on a 5-second visit, the only thing that earns more seconds is an answer to the question the ad raised, so
the tool goes first. Explanation and trust come after for those who need them, and the last section catches
skimmers.

---

## 9. Brand, voice, operator

- **Operator [user]:** independent, neutral brand, not a broker, sells nothing, no affiliate links. Real
  operator identity (name, IČO, address, contact e-mail) goes in as **clearly marked placeholders** listed in the
  README as "must fill before launch".
- **Brand name (proposal):** **ETF Dvojče**. It carries the concept ("evropské dvojče vašeho ETF") and works for
  both ads. Veto welcome.
- **Address form: vykání** (CLAUDE.md says "vy"), with a relaxed spoken tone: "Pošleme vám to", not "Zašleme Vám
  dokument". Lowercase "vy/vám" throughout, as in normal web copy.
- **Voice:** calm, factual, short. The knowledgeable friend, not a finfluencer. Banned phrases: those listed in
  CLAUDE.md and `.agents/product-marketing.md`.

---

## 10. Visual direction

**Concept: "the pocket dictionary / departure board".** The page *translates* tickers. Its memorable element is the
**ticker pair**: the US ticker set large and struck through, with its UCITS twin beside it, like a dictionary
headword with its translation. All the boldness goes there. Everything else stays quiet.

| Token | Hex | Role |
|---|---|---|
| `paper` | `#F1F3EE` | background, a cool grey-green (deliberately not cream) |
| `ink` | `#1A2421` | text, a pure dark green-black |
| `muted` | `#5A6762` | secondary text, source lines |
| `blocked` | `#B8361E` | US ticker "nelze koupit" state (always with strike-through + text, never colour alone) |
| `allowed` | `#17704A` | UCITS twin "lze koupit" state (always with a text label) |
| `marker` | `#F3DC5A` | only behind the visitor's own computed CZK number, never decoratively |

- **Type:** one family, **Archivo** (variable, `wdth` + `wght`, has Latin Extended for Czech diacritics; **VERIFY**
  subset size and `tnum` support). Tickers use wide widths and heavy weights like a departure board. Body text uses
  normal width at 400. Tabular figures for all numbers. Self-hosted, subset, with a metric-matched fallback so
  there is no CLS.
- **Layout:** single left-aligned column on mobile (16 px gutter). On desktop the same column is centred at ~36rem.
  Nothing needs a wider layout. Different elements get different radii (chips are pill-shaped, the result block is
  square-cornered with a 2 px ink rule). No identical card grid.
- **Motion:** exactly one orchestrated moment, user-triggered. Tapping a chip draws the strike-through and slides
  the twin in. `prefers-reduced-motion` shows it without animation.
- **Avoided on purpose:** cream + terracotta, black + acid accent, broadsheet hairlines, the SaaS card kit,
  ALL-CAPS eyebrows, middot meta strings, `→` in buttons, monospace data labels, purple/blue gradients, stock hero
  photos, emoji bullets.
- **Self-check against defaults:** for a generic "ETF comparison page" the default I'd reach for is a navy/teal
  fintech card grid with a big-number hero. (This is a thought experiment; no separate prompt was run.) This plan
  swaps that for the strike-through ticker pair and semantic (not decorative) colour.

---

## 11. Stack

| Concern | Choice | Notes |
|---|---|---|
| Site | **Astro** (static output) + small vanilla TS island for the tool | JS budget < 60 kB gz. The tool is a few kB. |
| Hosting **[user]** | **Vercel Hobby** | The Hobby plan is non-commercial. The README states that a real launch moves to Vercel Pro or Cloudflare Pages. **VERIFY** current terms. |
| Form backend | One Vercel serverless function `/api/lead` → **Brevo** (create contact with attributes incl. UTMs + send transactional e-mail) | One vendor for list + e-mail. **VERIFY** free-tier limits (incl. the daily send cap). Input, dedupe and rate-limit rules in §6a. |
| Analytics | **Umami Cloud** (cookieless, tiny script, custom events, funnel report) as first choice. PostHog EU (cookieless `persistence: memory`) as fallback. | Cookieless → no consent banner over the first screen. **VERIFY** before creating accounts: free-tier limits, funnel availability on the free plan, EU data location. PostHog's JS bundle size has to be measured against the budget. |
| Secrets | env vars only, `.env.example` committed | |

No accounts get created until you approve them, as CLAUDE.md requires.

---

## 12. Tracking plan (names fixed now, implementation in Phase 4)

| Event | Fires when | Key props |
|---|---|---|
| `page_view` | load | all `utm_*`, `ad_variant`, entry step |
| `section_view` | section ≥50 % visible, once per section | `section` |
| `interaction_start` | first chip tap / first slider move | `step`, `ad_variant` |
| `step_complete` | Step A/B/C finished | `step`, selections |
| `interaction_complete` | result + fee number rendered | tickers, amount, horizon |
| `cta_click` | any "Poslat plán" button | `location` (inline / sticky / footer) |
| `form_view` | form ≥50 % visible | `location` |
| `form_start` | first focus on the e-mail field | `location` |
| `form_error` | client or server validation fails | `reason` |
| `lead_submitted` | **only after `/api/lead` returns 2xx** | `location`, `ad_variant` |
| `thank_you_view` | thank-you state rendered | |
| `magnet_opened` | `/plan` page load from the e-mail link | `utm_source=email` |

`step_complete` is an addition to CLAUDE.md's list, needed because the tool now has three steps.

**Source of truth for conversions:** Brevo contacts per `ad_variant`, not Umami. `lead_submitted` is a browser event,
so it is lost when the visitor closes the tab right after submitting or an ad blocker blocks the analytics script.
The lead still exists in Brevo. Umami measures the funnel *up to* the form. The A/B result and the README's
conversion figure use Brevo lead counts divided by Umami `page_view` per variant, and the gap between Brevo leads
and Umami `lead_submitted` is reported as a measurement-loss check.

---

## 13. Open items, and what feeds the README

- **Expected conversion rate:** deferred to the README, where it must rest on **cited** benchmarks. The
  `lead-magnets` skill ships benchmark tables (e.g. "Finance 10–20 %") **with no sources**, so they are not used as
  evidence. Logged in `docs/ai-worklog.md`.
- **A/B hypotheses (draft ranking, to refine):**
  1. Ad angle + matching entry step (A blocked vs. B fees). Largest: it changes audience, promise and first screen.
  2. Gate depth: show all twins before the form vs. show one twin, with the rest behind the e-mail.
  3. Ask framing: "Poslat plán" vs. "Poslat daňový checklist" as the headline benefit.
- **Phase 1 verification list:** PRIIPs text plus ≥2 broker pages (incl. Fio's current stance), US WHT for CZ
  residents and Irish-fund structure, US estate-tax exposure, CZ time test / exemption threshold / cap, bank-fund
  TER/fee ranges from real KIDs, all ETF figures from issuer pages.
