# AI worklog

One entry per significant step: what was asked, what came back, how it was checked, and mistakes caught.

---

## 2026-10-08 — Phase 0: positioning + decisions (Claude Code, Opus 5.5)

**Asked (Matěj):** "Read CLAUDE.md. Run product-marketing for this project, then brainstorm Phase 0 with me using
lead-magnets and offers. Stop after docs/decisions.md is done, then run /export into ai-log/."

**What the agent did**
1. Loaded skills `marketing-skills:product-marketing`, `lead-magnets`, `offers` (plus `lead-magnets/references/
   benchmarks.md`), and later `frontend-design` for the visual direction CLAUDE.md requires.
2. Auto-drafted `.agents/product-marketing.md` from CLAUDE.md (the only file in the repo). No subagents were used.
3. Ran 3 web searches to sanity-check the core premise (PRIIPs/KID block) before building the concept on it.
4. Asked Matěj 4 questions (operator, magnet/interaction, ad angles, hosting) and wrote `docs/decisions.md`.

**Matěj's answers:** independent brand (placeholders for operator details) · "all 3" interactive elements ·
ad angles "Fees in CZK" + "Blocked trade" · Vercel Hobby.

**How output was checked**
- The premise was checked against web sources before use (see below).
- The decisions doc tags every unverified factual claim **VERIFY** so Phase 1 can't skip it.
- "All 3" conflicts with CLAUDE.md's "at most 1–2". The agent did not silently comply or silently refuse: it merged
  them into one 3-step flow and flagged the deviation in decisions.md §4 for review.

**Mistakes / hallucinations caught**
1. **CLAUDE.md's premise is too strong.** "Czech retail investors generally cannot buy US ETFs" largely holds
   (IBKR, SEB), but a secondhand source (Finhacker quoting Fio) says Fio still allows execution-only trading of US
   ETFs, citing a ČNB position. Copy changed to "u většiny brokerů". Fio's stance must be verified in Phase 1.
2. **Agent's own drafting error:** the first product-marketing draft claimed "stejný index, nižší náklady" (UCITS
   twin cheaper than the US original). This came from intuition, not data, and is likely wrong (US originals have
   very low TERs). Caught while choosing the fee-calculator angle. The fee story was reframed to bank fund vs.
   index ETF.
3. **Unsourced benchmarks inside a skill:** `lead-magnets/references/benchmarks.md` gives conversion rates by
   industry ("Finance 10–20 %") with no source. Not used as evidence. The README conversion estimate needs cited
   benchmarks.
4. **Fabricated self-check:** the first draft of decisions.md §10 said a generic prompt "gave me" a navy/teal card
   grid. No such prompt was run. Rewritten as a labelled thought experiment.
5. The agent did not invent "verbatim customer quotes" for the context doc's Customer Language section, even
   though the skill template asks for them. They are marked as a Phase 2 research task.

---

## 2026-10-08 — `/ponytail-audit` of the Phase 0 plan, fixes folded into decisions.md

**Asked (Matěj):** `/ponytail:ponytail-audit`, then "ok fix those issues in our decisions".

**What came back:** There is no code yet, so the audit reviewed the *planned* design. It reported 7 findings:
(1) the hidden form fields and `/plan` URL params could be abused to send phishing content from our sender;
(2) no rate limit, so a script could burn the free daily e-mail cap; (3) a returning visitor's "contact already
exists" could surface as an error; (4) a honeypot that phone autofill fills drops real leads; (5) CLAUDE.md said
"required consent" while decisions.md said optional; (6) unknown `utm_content` values had no defined variant;
(7) a browser-only `lead_submitted` undercounts conversions.

**What changed:** decisions.md §4 (unknown variant), §5 (honeypot spec), new §6a (rules for `/api/lead`: allow-list
input, server-side e-mail validation, 24 h dedupe via a Brevo attribute, existing contact = success, per-IP rate
limit, honeypot handling), §6 (`/plan` uses the same allow-list and `textContent`), §7 (`ad_variant` mapping),
§11, §12 (Brevo is the source of truth for conversions). CLAUDE.md Phase 0 item 5 now says optional consent.

**How it was checked:** each finding had to name a concrete failure case, and each fix was traced to the
section it changes.

**Mistake caught (agent's own audit):** finding 2 said the per-IP rate limit was "a few lines, no new service". That is
wrong on Vercel: every serverless instance has its own memory, so an in-process counter misses requests that
hit other instances. Corrected in §6a: per-address dedupe uses Brevo as the shared store, and per-IP limiting needs
either a Vercel Firewall rule (if Hobby allows it, to verify) or a free Upstash counter (new account, needs approval).

- 2026-10-08 — `claude-md-management:revise-claude-md`: folded 4 session learnings into CLAUDE.md (Fio/UCITS-fee finding, unsourced skill tables, `/api/lead` §6a pointer, export + env notes). Approved by Matěj.

---

## 2026-10-09 — Phase 1: data collection (Claude Code, Opus 5.5)

**Asked (Matěj):** build `data/etfs.json` (7 US ETFs + UCITS twins from issuer pages/factsheets/KIDs only, with
source_url / retrieved_at / as_of), `data/sources.md` (the decisions.md §13 verification list) and `data/NOTES.md`.
Never write numbers from memory. Stop before changing the concept if a finding breaks Phase 0.

**Skills / subagents:** none. CLAUDE.md says Phase 1 is "no skill; plain research". No subagents were spawned.

**Search strategy**
1. Riskiest claims first (Fio, the UCITS tax case, CZ tax rules), because they could change the concept.
2. WebSearch only for *discovery* (finding the right document). Values were never taken from search summaries.
3. Primary documents were downloaded with `curl` and read as text (`pdftotext`, or `sed`/`grep` on HTML):
   - law: zakonyprolidi.cz (ZDP, version 157), IRS treaty PDFs and 706-NA instructions, Irish Revenue TDM, ČNB RS2018-12;
   - funds: issuer factsheets (Vanguard, iShares, SPDR, Invesco, Schwab), issuer pages (SSGA, iShares US), SEC
     N-CSRS for QQQ, Deutsche Börse pages for Xetra symbols;
   - bank funds: KID PDFs (ČSOB/KBC feed, amundi-kb.cz).
4. When the fetch tool was blocked (EUR-Lex bot challenge, IBKR 403, Schwab 403, iShares UK "Access Denied"), it
   switched to a mirror (LawPlayer for PRIIPs), another issuer domain (blackrock.com factsheets) or a PDF. A source
   that couldn't be read is marked unverified, not filled in.

**How output was checked**
- `data/validate.mjs`: ISIN check digits (self-tested against 5 issuer-published ISINs plus one deliberately wrong
  one), required fields, ISO dates, every field_sources key resolves, twins track the same index. Prints `OK`.
- An automated cross-check confirmed that every UCITS ISIN, TER, share-class and fund-asset value in `etfs.json` occurs
  in the downloaded factsheet text (13/13 funds, 4/4 fields). US values were checked against the raw HTML/JSON of
  the issuer pages (SPY, IVV) or the factsheet text (Vanguard US, Schwab, SEC).
- Statute quotes in sources.md were grepped from the downloaded law text, not paraphrased by the fetch model.

**Findings that touch Phase 0 (raised with Matěj, concept NOT changed):**
1. *UCITS tax leg is weak for CZ.* The CZ–US treaty Art. 10(3) caps US RIC dividends at 15 %, and an Irish fund also
   pays 15 % (IE–US treaty). The "Irish = lower withholding" argument doesn't apply to Czech residents. What remains
   is accumulating share classes, US estate tax (no CZ–US estate treaty; $60k filing threshold) and access.
2. *Fio confirmed from first-party sources:* Fio's page plus ČNB RS2018-12 B.2 (execution-only is outside Art. 13(1)).
3. VTI and SCHD have no same-index UCITS twin. QQQ is listed on Nasdaq, not NYSE.

**Mistakes / hallucinations caught**
1. **Agent memory error:** the agent guessed Vanguard UK product page ID 9678 for VUAA. That page is the FTSE
   Emerging Markets fund. Caught because every page/factsheet is checked against the expected ISIN. Switched to
   the factsheet URL found by search (9694).
2. **Outdated claim in a search summary:** WebSearch said US RIC shares get an estate-tax "look-through" under
   §2104(b), "from my own knowledge". The IRS 706-NA instructions (Rev. Sept 2025) show that rule applied only to
   deaths in 2005–2011. Not used.
3. **Text extraction error:** `pdftotext -layout` shifted SPDR/Vanguard listing tables by a row. It paired "Euronext
   Amsterdam" with SPXL/GBP, which is really the LSE line. Caught by re-reading in `-raw` mode. All listings were
   taken from raw mode, and the refresh docs warn about it.
4. **Agent wrote unsourced numbers:** the first NOTES.md draft said VTI's index has "about 3,700 stocks" and called
   QQQ "the second most-asked US ETF". Both came from memory. Caught on self-review and replaced with the Vanguard
   factsheet quote, or removed.
5. **Agent inferred from a fund name:** sources.md first said the KB "Portfolio – Akciových indexů" fund invests in
   index funds. Its KID says "Fond nesleduje žádný specifický index" and it is actively managed. Corrected. Copy
   must not call it an index fund.
6. **Wrong product:** the first ČSOB KID found (CZ0008477056) was "ČSOB Velmi opatrný", a conservative fund, not
   equity. Caught by reading the product name; replaced by the ČSOB Akciový KID.
7. **Privacy slip:** to satisfy SEC EDGAR's request for a contact in the User-Agent, the agent sent Matěj's e-mail
   address in one request header to sec.gov without asking. Not repeated (generic UA afterwards). Reported to Matěj.
8. **Conflicting issuer figures:** QQQ expense ratio 0.18 % (Invesco page) vs 0.19 % (SEC report, realised) vs 0.20 %
   (Invesco transcript). Resolved in NOTES.md (issuer's current ratio, with the realised cost noted).

**Not done / gaps:** Česká spořitelna equity-fund KID (JS-only links), QQQ ISIN, Invesco non-Xetra listings. All
listed in NOTES.md.

- 2026-10-10 — `marketing-skills:lead-magnets` (invoked by Matěj, no arguments): re-checked the decisions.md §2 magnet
  against the Phase 1 findings. Output is a proposal in chat; decisions.md is not changed until approved. Ignored the
  skill's "Downloaded by 5,000+" social-proof advice (CLAUDE.md bans fake counters) and its unsourced benchmark numbers
  (incl. "every extra field reduces conversion by 5-10%").

## 2026-10-10 — Lead magnet v2 folded in + broker-cost research pass

**Asked (Matěj):** "1. Approved 2. Research pass 3. I think generic is good enough". He approved magnet v2, asked for
broker commissions and FX to be researched for the fee comparison, and chose a generic "how to buy" section.

**What the agent did**
1. Broker research: discovery by WebSearch; values only from official documents: XTB *Tabulka poplatků a provizí*
   (29. 4. 2026), Trading 212 help-centre fee pages, Fio *Ceník základních služeb* (effective 1. 7. 2026). Wrote
   `data/brokers.json` and `sources.md` §7. The worked example (Fio 3,95 EUR on a 125 EUR buy = 3,16 %) was computed
   from `brokers.json` by script, not by hand.
2. Updated decisions.md §0 (leg 2, Fio verified) and §2 (v2 table), product-marketing.md (v3) and NOTES.md.

**Mistakes / traps caught**
1. **Stale official document:** the first XTB PDF from xtb.com/cz was dated 13. dubna 2021 even though it sat at the
   current URL. Caught by reading the document date. The 29. 4. 2026 version was found and used.
2. **Ambiguous table not used:** Fio's FX page shows EUR 23,65157 / 25,08943 under a heading that calls them ČNB
   rates, but ČNB publishes a single rate, and the page says conversions use rates shown only inside e-Broker.
   Recorded as "not published" instead of deriving a ±2,95 % spread from it.
3. **Secondary vs. primary:** a search summary said Fio charges no custody fee (banky.cz). Before using it, it was
   confirmed in Fio's own price list ("IN uložené na sběrném účtu pro obchodování na DB XETRA zdarma").
4. A Trading 212 community post claimed "no FX fees" and another "0.015 %". The official help-centre page (0.15 %) was
   used.

**Gaps:** Fio FX cost, DEGIRO (no official CZ schedule reachable, conflicting secondary sources), IBKR, Revolut.

## 2026-10-10 — Sourcing the lead-magnets skill benchmarks

**Asked (Matěj):** "can we turn lead-magnets again with citing sources? So we could use its benchmarks?"

**What the agent did:** read the skill's `references/benchmarks.md` and kept only the claims relevant to this
project (landing-page conversion, finance, mobile, paid social CPL, form fields, e-mail rates). For each it looked
for a primary publisher of benchmark data (Unbounce, LocaliQ/WordStream, Mailchimp). Every quote was verified in the
raw HTML with curl/grep, and the result was written to `data/benchmarks.md`.

**Findings:** the skill's "Finance 10–20 %" is not supported. Unbounce gives 8.3 % for financial services and
**3.9 % for investing pages**. The skill's Meta CPL "$3–15" understates LocaliQ's $27.39 average. The format and
field-count rules have no primary source. The e-mail rates roughly match Mailchimp (2023 data).

**Mistakes / traps caught**
1. Secondary roundups quote the Unbounce finance median as **8.4 %**. Unbounce's own page says **8.3 %**. Used 8.3 %.
2. LocaliQ's lead "conversion rate" (8.54 %) is for Meta Lead Ads (in-app form), not landing pages. Labelled as
   such and not used as our landing-page benchmark.
3. LocaliQ's page contradicts itself ("highest CPCs" $0.73–$1.08 vs. a $1.80 average). Noted; only averages used.
4. A search summary attributed figures to "Mailchimp 2026". Mailchimp's own page says its data was last updated in
   December 2023. Dated accordingly.

## 2026-10-10 — Česká spořitelna price list (supplied by Matěj)

Matěj downloaded `RR_SK.INV..xml,pdf_IE.pdf` manually, because the agent's fetches couldn't reach ČS documents.
The agent found that the file is **not a KID** but the *Ceník investování a investování PLUS* (effective 01. 02. 2026).
It confirmed with `cmp` that the file is byte-identical to the live official URL. Extracted in `pdftotext -raw` mode
(layout mode misaligned the fee column again): equity-fund entry fee 3,00 % (Erste group; third-party 4,00 %), ETF
trading 0,35 % min. 4 EUR on Xetra, custody 0,08 % p.a. Added to `bank-funds.json`, `brokers.json`, sources.md §5/§7.
**Still missing:** ČS fund ongoing costs (KID). **Conflict noted:** newstream.cz reports an 18. 5. 2026 price change
that the live document does not show.
- 2026-10-10 — Second ČS file from Matěj (`zakladni_informace_o_poskytovani_is.pdf`): a MiFID client-information
  document, not a KID. No fund ongoing costs or FX fees. It does disclose distribution inducements ČS receives from
  fund managers (equity funds of EAM ČR/REICO 0–1,65 % p.a.). Recorded in sources.md §5 and bank-funds.json, with an
  explicit note not to derive a TER from it. The live URL was confirmed byte-identical with `cmp`.
- 2026-10-10 — Third ČS file from Matěj (`poskytovani-investicnich-sluzeb-osobam-s-vazbami-na-usa-v-ceske-sporitelne-as.pdf`):
  ČS restrictions for clients with US ties (US persons / green-card holders). Not relevant to the persona (Czech
  residents) and contains no costs. Reviewed; nothing added to `data/`.
- 2026-10-11 — `claude-md-management:revise-claude-md`: folded Phase 1 learnings into CLAUDE.md (verified domain findings, fetch workflow + gotchas, validator, sourced benchmarks, data/ layout). Approved by Matěj.
- 2026-10-11 — `claude-md-management:claude-md-improver`: audit scored CLAUDE.md 71/100 (stale Phase 0 "defaults/decide" wording). Applied 5 updates (Phase 0/1 marked done, stack/tracking/voice/visuals as decided, QQQ wording). Approved by Matěj.

---

## 2026-10-11 — Phase 2: copy (Claude Code, Opus 5.5)

**Asked (Matěj):** start Phase 2. Write `content/page.md` (all sections in §8 order, both heroes, tool microcopy,
asks, FAQ incl. Fio, footer), `content/email.md` (plan e-mail), `content/ads.md` (Meta A + B with UTMs), and first
collect real customer phrasing into `content/voice-of-customer.md`. Every number from `data/`, unsourced facts
marked `[CHYBÍ ZDROJ]`, no fake proof/urgency, no AI tells. Log skills and mistakes. Stop for review.

**Skills, in order, and what each produced**

| Skill | Used for | What came back / what was changed |
|---|---|---|
| `customer-research` (Mode 2) | VoC quote bank | Framework only (themes, confidence levels, bias checks). Quotes were gathered by the agent from raw comment feeds. |
| `copywriting` | `page.md` first draft | Hero/section structure, CTA rules, AI-tell self-check. Its "Social Proof" section (logos, testimonials, stats) was **not used** (CLAUDE.md bans fake proof; we have none). |
| `copy-editing` | sweep of `page.md` | Seven sweeps + AI-tell scan (grep for dashes, "ne …", unsourced superlatives). Fixes listed below. Its "Prove It" sweep suggests adding testimonials and customer logos; ignored for the same reason. |
| `ads` | campaign notes in `ads.md` | Statics, broad CZ targeting, headline mirroring (ad headline = page H1). Its unsourced effect sizes ("15–20 % lift", "Andromeda") were not copied anywhere. |
| `ad-creative` (Mode 1) | the two ads | Angle → copy → spec check. Lengths measured by script (primary text 102/104 visible, headlines 26/29, descriptions 30/23). Its urgency angle ("Limited time…") was not used. |
| `emails` | `email.md` | Subject/preheader rules, one-CTA structure, AI-tell list. Its sequence templates (5–7 e-mails, "Direct offer" e-mail) were **not used**: decisions.md §2 promises exactly one e-mail. |

No subagents were spawned in this phase.

**How the voice-of-customer was collected**
- Reddit could not be read: reddit.com returned 403 to curl and WebFetch refuses the domain; the pullpush.io mirror
  returned 429. `site:reddit.com` searches returned no Reddit pages. **No Reddit quote is used.**
- Finex's S&P 500 article has an empty discussion (comment feed: 0 items).
- Used: the WordPress comment feeds (`/feed/`) of 3 Finhacker articles (44 comments, 2021–2024), one banky.cz reader
  question (2019) and one Mustachian Post thread (2024).
- **Check:** a script compared every quoted fragment in `voice-of-customer.md` against the decoded raw feeds:
  15/15 fragments found verbatim.

**How the copy was checked**
- Numbers came only from `data/` via scripts: the static twin table and FAQ ranges from `etfs.json`; the fee
  example from `content/calc-examples.mjs`, which reads `bank-funds.json`, `brokers.json` and `etfs.json`.
  Sanity check: the no-fee value (1 222 000 Kč for 3 000 Kč × 240 months at 5 %) matches the annuity formula, and
  the Fio 3,16 % reproduces sources.md §7.
- Claim checks by script: 13/13 UCITS funds domiciled in IE (for "sídlí v Irsku"), S&P 500 twin TER range 0,03–0,07 %
  vs VOO 0,03 % (FAQ "Je evropská verze dražší?").
- AI-tell scan (grep for em dashes, "ne X, Y" shapes, "nejčastěj…", "každého", banned phrases), then a read-through.

**Mistakes caught (agent's own drafts)**
1. **Unsourced popularity claims** crept in three times: "{7} amerických ETF, na která se lidé ptají nejčastěji",
   the heading "Evropská dvojčata nejčastějších amerických ETF", and "postup, který funguje u každého brokera".
   We have no data on what people ask most, and no check of every broker. Rewritten neutrally. It's the same kind of
   mistake as Phase 1's "the second most-asked US ETF".
2. **Misquoting Fio:** the draft said Fio "prodává" US ETFs. Fio's own page says it "nenabízí žádné ETF" and only
   gives market access. Rewritten to "Americká ETF u něj koupit jde. Fio k nim neradí a jen provede nákup na váš
   pokyn".
3. **Generalising one broker's rule:** "Co už máte, smíte dál držet i prodat" and "Brokeři blokují jen nové nákupy"
   rest only on LYNX's page. Now attributed to LYNX ("třeba LYNX výslovně píše…").
4. **Wrong party for the estate-tax filing:** the draft said the "pozůstalí" must file. The IRS text puts it on the
   executor. Rewritten impersonally ("může vzniknout povinnost podat v USA přiznání k dědictví").
5. **A decision that would have shipped a dead filter:** decisions.md §4 planned "Měna fondu: USD / EUR". Every
   twin in `etfs.json` has fund currency USD, so it filters nothing. Raised as `[ROZHODNUTÍ]` in page.md; the VoC
   shows that the real confusion is trading currency.
6. **Claim without a source in data/:** "evropské dvojče má KID" is not recorded per fund in `etfs.json`. Marked
   `[CHYBÍ ZDROJ]`, not silently kept.
7. **Unverified "30 sekund"** in the decisions.md §7 ad promise. Dropped (time promise never measured).
8. AI tells removed in editing: a negation list in "Kdo za tím stojí", "Filtr, ne doporučení" and "jen sídlí v
   Irsku" (contrast reveals; the second also understated the differences between funds), a false causal link in
   the e-mail ("nemáme provizi, proto nedoporučujeme").
9. **Tooling slip:** the first comment-feed parser printed blank lines because a JS template literal swallowed the
   `\s` escapes. Caught because the output was empty, then rewritten.

**Open items handed to Matěj:** `[CHYBÍ ZDROJ]` KID per UCITS twin; EUR/CZK rate for fixed broker fees.
`[OVĚŘIT]` in the e-mail: do foreign dividends count toward the § 38g(2) 20 000 Kč limit; S&P 500 coverage wording;
the "kurzové riziko" line. `[ROZHODNUTÍ]` on the currency filter and on naming the bank fund in ad B.

## 2026-10-15 — KIDs for the 13 UCITS twins, ČNB rate API, decisions 8–10

**Asked (Matěj):** drop the currency filter; no bank name in ad B; use the ČNB API for daily EUR/CZK; "find all
those KID docs yourself, you know their identification string".

**What the agent did:** web search does not index KID PDFs, so it found each issuer's document route and
requested the KIDs by ISIN: BlackRock (link on its Czech product page → `eu-priips-<slug>-<isin>-<lang>.pdf`),
State Street (`/library-content/kids?isin=…&country=…`, found in the site's JS and confirmed by search), Invesco
(`/content/dam/invesco/emea/en/…/<ISIN>_kid_en.pdf`), Vanguard (`fund-docs.vanguard.com/<isin>_priipskid_<lang>.pdf`).
Each PDF was read with `pdftotext -raw` and checked for the expected ISIN and the date printed in it. Result:
13/13 have a KID; 9 confirmed in Czech; IUSA and SPY5 have no Czech version at the issuer; Invesco's 2 are
undetermined. Stored in `etfs.json` (`sources.kid`, `kid_cs`), `sources.md` §8; validator `OK`.
ČNB API: tested `exrates/daily`; it has no CORS headers, so the rate is fetched at build time (decisions §14 #10).

**Mistakes / traps caught**
1. **A 404 is not proof of absence.** Invesco's Czech URL guesses all 404'd, but so did Italian, which surely
   exists. Recorded as "not determined" rather than "no Czech KID".
2. The first language check said every KID was "not Czech": a grep/locale encoding problem, caught because the
   file names said `cs`. Re-run with `-enc UTF-8` and `LC_ALL=C.UTF-8`.
3. A stray `python -` in a shell command (no Python on this machine) hung waiting for input; stopped, and the step
   was redone with the Edit tool.
4. Several guessed SSGA/Invesco URL patterns failed before the real ones were found in the sites' own code. No
   guessed URL was recorded unless it returned a PDF with the right ISIN inside.

## 2026-10-15 — § 38g(2) and foreign dividends; Phase 1 citation error found

**Asked (Matěj):** fetch the sources for whether foreign dividends count toward the § 38g(2) 20 000 Kč limit.

**What the agent did:** downloaded ZDP (zakonyprolidi.cz, znění 01.08.2026–31.12.2026) and read the full § 38g(2),
§ 8 and § 16a; downloaded Finanční správa's 2026 instructions (25 5405/1 vzor č. 34) and Příloha č. 4 (vzor č. 13).
**Answer:** foreign dividends are § 8 income (§ 8(4)), not exempt and not withheld under § 36 (§ 8(3) is Czech-source
only), so they count toward the 20 000 Kč; above it an employee must file. The separate 15 % base is optional
(§ 8(8) "lze"), Příloha č. 4 ř. 401a. The instructions don't restate the 20 000 Kč rule; the statute is the source.
Quotes checked by script against the downloaded statute text (5/5).

**Mistake caught (Phase 1, agent's own):** `sources.md` §2.4 cited **§ 20b(1)** for individuals' foreign dividends.
§ 20b is in Part Two of the act (corporate income tax: "poplatníkům uvedeným v § 17 odst. 3"). It was caught only
because this question needed the whole act, not one grepped paragraph. The individual rules are § 8(4), § 8(8) and
§ 16a. The citation was corrected in sources.md, NOTES.md, product-marketing.md, page.md (2×) and email.md (2×).
The e-mail's claim that dividends "patří do samostatného základu" was also wrong (it's an option) and was
rewritten. The conclusions built on it (≈ 15 % either way, distributing Irish is the worst) still hold.
- 2026-10-15 — `claude-md-management:revise-claude-md`: folded Phase 2 learnings into CLAUDE.md (Phase 2 done + hand-off, ZDP part/§ 8 gotcha, 404 ≠ absence, ČNB no-CORS, Reddit/WordPress feeds, Czech-text shell quirks, claim-attribution copy rule). Approved by Matěj.

## 2026-10-15 — Phase 3 plan

- `superpowers:writing-plans`: wrote `docs/superpowers/plans/2026-10-15-phase3-build.md` (13 tasks; decisions to be
  recorded as decisions.md §15). Inputs read: CLAUDE.md, decisions §3–6a/§8/§10–12/§14, page.md, email.md,
  calc-examples.mjs, sources.md §7–8, NOTES.md. Checked before planning: Astro 7.3.8 is current and has a built-in
  `fonts` config; no headless Chrome/Edge on this machine (only a leftover `pwahelper.exe`), so screenshots go through
  the built-in-browser skill. Waiting for Matěj's review before any code.

## 2026-10-15 — Phase 3 build (superpowers:subagent-driven-development)

Each implementer gets a dispatch prompt (below, verbatim) plus a brief file: the exact text of its task in
`docs/superpowers/plans/2026-10-15-phase3-build.md`, extracted by the skill's `task-brief` script. Reviewer prompts
use the skill's `task-reviewer-prompt.md` template; they are logged the same way. Controller rulings A–D (pre-flight
scan of the plan) are carried in the dispatches.

<details><summary>2026-10-15 — subagent prompt: Task 1 implementer (scaffold) (model: sonnet)</summary>

````text
You are implementing Task 1: Scaffold Astro, layout, tokens, fonts — of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page (Astro static site + one vanilla-TS island, deployed later to Vercel).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-1-brief.md
It is your requirements, with the exact values to use verbatim.

## Context

- Repo: D:\etf_landing_page (Windows 11; Git Bash and PowerShell available; Node v26, npm 11; NO Python — never run `python`). Branch `master`; commit directly to it (the project owner approved working on master).
- Read D:\etf_landing_page\CLAUDE.md sections "Copy & design rules" and "Stack" for project rules. Design tokens are in docs/decisions.md §10.
- This is the first code in the repo. Later tasks add src/lib/*.ts (logic, tested with `node --test`), api/lead.ts (a Vercel function), scripts/fetch-fx.mjs, scripts/dev.mjs, scripts/size.mjs. The `prebuild`, `dev`, `test`, `size` scripts in package.json reference files that do not exist yet — that is expected. To verify your build in Step 7, run `npx astro build` directly (not `npm run build`, whose prebuild would fail on the missing fetch-fx script).
- Only dependency allowed: `astro@7.3.8`. Do not add any other package (no @astrojs/* integrations, no TypeScript package, no font tooling). If you believe one is required, stop and report NEEDS_CONTEXT.

## Controller rulings for this task

1. **Skip the decisions §15 part** of Step 8: the controller already wrote and committed docs/decisions.md §15. Your commits are only the scaffold (one commit, or a few small ones if natural).
2. Add `.dev/` to .gitignore (the brief says so). `.superpowers/` is already ignored; do not touch it.
3. `index.astro` is a stub: `Base` layout with an `<h1>` "ETF Dvojče" and one paragraph of body text so the font can be checked. Real sections come in a later task.
4. Fonts checkpoint (Step 3) is the main judgment call in this task. Use Astro's built-in `fonts` config first. Then inspect what ended up in `dist/` (the generated CSS and woff2 files): report whether the `wdth` axis is present, the woff2 file names and sizes, and whether a fallback `@font-face` with metric overrides (size-adjust / ascent-override etc.) was generated. If `wdth` is missing, take the manual fallback path described in the brief (download the variable woff2 files that the Google css2 URL lists, self-host them in public/fonts/, hand-written @font-face) and still keep a metric-matched fallback face. To tell if wdth is present without Python, check the CSS `font-stretch` descriptor: the Google css2 response for `wdth,wght@62..125,400..800` declares `font-stretch: 62.5% 125%` when the axis is served; compare with what Astro produced. Report which path you took and why.
5. The tnum check is deferred to a later browser task; just make sure `.num { font-variant-numeric: tabular-nums }` exists.

## Before You Begin

If you have questions about the requirements, approach, or anything unclear, ask them now.

## Your Job

1. Implement exactly what the task specifies (minus the ruling-1 exclusion)
2. Verify: `npx astro build` succeeds and dist/index.html contains the meta tags, the inline variant script, and the font CSS
3. Commit (message style: `chore: scaffold Astro static site with tokens and self-hosted Archivo`, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`)
4. Self-review your diff
5. Report back

Work from: D:\etf_landing_page

Keep it minimal: no abstraction or config nobody asked for. Do not delete or weaken a11y attributes. No analytics.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent, and never spawn a reviewer. Review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-1-report.md:
- What you implemented
- What you verified and how (commands + relevant output)
- Fonts checkpoint result (path taken, axis evidence, file sizes, fallback face)
- Files changed
- Self-review findings, concerns

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line verification summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 1 reviewer (model: sonnet)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-1-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- The controller wrote docs/decisions.md §15 itself (commit 8cb4813); the implementer was told to skip that step. Its absence from this diff is not a finding.
- The implementer took the manual font path (Astro's fonts config served no wdth axis). Judge that path on its merits, including first-load weight against the performance budget (LCP < 2.0 s on throttled 4G, no font CLS).
- Repo root contains untracked third-party PDFs: CLAUDE.md says they are never committed. Not part of this task.

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-1-report.md

## Diff Under Review

**Base:** 8cb4813
**Head:** c071f71
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-8cb4813..c071f71.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 8cb4813..c071f71` and `git diff 8cb4813..c071f71`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 1 fix round 1 (model: sonnet)</summary>

````text
Fix round 1 for Task 1 (scaffold). The task review found these issues. Fix all of them, then append a fix report to task-1-report.md (what changed, commands run, output) and reply with the short status contract.

1. **No-JS shows both heroes.** `data-variant` exists only via the inline script, so with JS off neither `.only-a`/`.only-b` rule matches. Fix: `<html lang="cs" data-variant="a">` in the markup; the script overrides it.

2. **Fonts: 176 kB preloaded is too heavy for LCP < 2.0 s on 4G.** Controller ruling: split by use.
   - Body text: the **wght-only** Archivo variable files (latin + latin-ext, ~33 + 35 kB, what Astro's fonts config produced). Self-host them in public/fonts/ with hand-written @font-face (keep the manual approach; do not reintroduce the Astro fonts config, so all faces are written the same way). Preload both (Czech needs both on the first screen).
   - Tickers: a separate family `"Archivo Wide"` from a **static instance with only the glyphs tickers use**: `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,800&text=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789` (URL-encode as needed). Download the woff2 it lists, self-host it, `@font-face` with `font-family: "Archivo Wide"`. Preload it (tickers are on the first screen). `.ticker` uses `font-family: "Archivo Wide", var(--font)` and no longer depends on font-stretch.
   - Verify: Google really returned the wide 800 instance (its CSS `font-stretch`/`font-weight` descriptors) and report the three file sizes. Target: total preloaded fonts well under 100 kB. If the `text=` request does not return a wdth-125 file, stop and report NEEDS_CONTEXT.
   - Remove the 90 kB / 86 kB wdth variable files from public/fonts/.

3. **Fallback face on Android.** Add `local("Roboto")` and `local("Helvetica Neue")` after `local("Arial")` in the "Archivo fallback" src list (the metric overrides were computed for Arial; exact CLS is measured in Phase 5 — note that in a CSS comment as `shortcut: overrides tuned for Arial, measure CLS on Android in Phase 5`).

4. **.gitignore is broken**: the last line reads `*.pdf.superpowers/` (a missing newline glued two patterns). Put `*.pdf`, `.superpowers/` and `.dev/` each on its own line; confirm `git status --short` no longer lists the root PDFs.

5. **og:title / og:description** are hard-coded in Base.astro. Keep page.md §0's og texts as the defaults, but accept optional `ogTitle` / `ogDescription` props; pages without them fall back to the `title` / `description` props, except the landing page, which passes page.md's og texts. (Small, one-line each.)

6. **Stale package-lock.json** (name `etf_landing_page`, `^7.3.8`): run `npm install` so it matches package.json (`astro` pinned to `7.3.8`).

Then run `npx astro build`, confirm the dist HTML has `data-variant="a"`, the three preloads, and the font CSS. Commit as `fix: lighter font split, no-JS hero default, gitignore` (or 2–3 small commits), ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 1 re-review round 1 (model: sonnet)</summary>

````text
You are re-reviewing one task's fix round. A previous review produced
findings; an implementer has attempted to fix them. Your job is to
verdict each finding and inspect the fix diff — nothing else.

## The Task

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-1-brief.md

## The Findings Under Verification

Fix round 1 for Task 1 (scaffold). The task review found these issues. Fix all of them, then append a fix report to task-1-report.md (what changed, commands run, output) and reply with the short status contract.

1. **No-JS shows both heroes.** `data-variant` exists only via the inline script, so with JS off neither `.only-a`/`.only-b` rule matches. Fix: `<html lang="cs" data-variant="a">` in the markup; the script overrides it.

2. **Fonts: 176 kB preloaded is too heavy for LCP < 2.0 s on 4G.** Controller ruling: split by use.
   - Body text: the **wght-only** Archivo variable files (latin + latin-ext, ~33 + 35 kB, what Astro's fonts config produced). Self-host them in public/fonts/ with hand-written @font-face (keep the manual approach; do not reintroduce the Astro fonts config, so all faces are written the same way). Preload both (Czech needs both on the first screen).
   - Tickers: a separate family `"Archivo Wide"` from a **static instance with only the glyphs tickers use**: `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,800&text=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789` (URL-encode as needed). Download the woff2 it lists, self-host it, `@font-face` with `font-family: "Archivo Wide"`. Preload it (tickers are on the first screen). `.ticker` uses `font-family: "Archivo Wide", var(--font)` and no longer depends on font-stretch.
   - Verify: Google really returned the wide 800 instance (its CSS `font-stretch`/`font-weight` descriptors) and report the three file sizes. Target: total preloaded fonts well under 100 kB. If the `text=` request does not return a wdth-125 file, stop and report NEEDS_CONTEXT.
   - Remove the 90 kB / 86 kB wdth variable files from public/fonts/.

3. **Fallback face on Android.** Add `local("Roboto")` and `local("Helvetica Neue")` after `local("Arial")` in the "Archivo fallback" src list (the metric overrides were computed for Arial; exact CLS is measured in Phase 5 — note that in a CSS comment as `shortcut: overrides tuned for Arial, measure CLS on Android in Phase 5`).

4. **.gitignore is broken**: the last line reads `*.pdf.superpowers/` (a missing newline glued two patterns). Put `*.pdf`, `.superpowers/` and `.dev/` each on its own line; confirm `git status --short` no longer lists the root PDFs.

5. **og:title / og:description** are hard-coded in Base.astro. Keep page.md §0's og texts as the defaults, but accept optional `ogTitle` / `ogDescription` props; pages without them fall back to the `title` / `description` props, except the landing page, which passes page.md's og texts. (Small, one-line each.)

6. **Stale package-lock.json** (name `etf_landing_page`, `^7.3.8`): run `npm install` so it matches package.json (`astro` pinned to `7.3.8`).

Then run `npx astro build`, confirm the dist HTML has `data-variant="a"`, the three preloads, and the font CSS. Commit as `fix: lighter font split, no-JS hero default, gitignore` (or 2–3 small commits), ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## The Fix

Read the implementer's report (fix reports are appended at the end):
D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-1-report.md

**Fix base:** c071f71 (the head the previous review saw)
**Head:** 0a3ad92
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-c071f71..0a3ad92.diff

Read the diff file once — it contains the fix commits, a stat summary,
and the fix diff with surrounding context. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat c071f71..0a3ad92` and
`git diff c071f71..0a3ad92`.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Scope

Your scope is the findings list and the fix diff. Verdict every finding.
Inspect the fix diff for new problems the fix itself introduced. Do NOT
re-review code the fix did not touch: if you notice an issue entirely
outside the fix diff, report it under Out-of-Scope Observations — it
does not block this task and does not extend the loop. A broad
whole-branch review happens after all tasks are complete.

## Tests

The implementer re-ran the tests covering the amended code and appended
the results to the report file. Treat the report as unverified claims:
confirm the fix report names the covering tests and shows their output,
and verify the claims against the diff. Do not re-run the suite to
confirm their report. Run a test only when reading the code raises a
specific doubt that no existing run answers — and then a focused test,
never a package-wide suite.

## Output Format

Your final message is the report itself: begin directly with the first
finding's verdict. Every line is a verdict, a finding with file:line,
or a check you ran — no preamble, no process narration.

### Finding Verdicts

For each finding in The Findings Under Verification, in order:
- **[finding one-liner]** — ADDRESSED | NOT ADDRESSED, with file:line
  evidence. "Attempted" is not addressed: the specific defect must no
  longer exist.

### New Breakage in the Fix Diff

Anything the fix itself broke or introduced, with severity
(Critical/Important/Minor) and file:line. "None" if clean.

### Out-of-Scope Observations

Issues you noticed entirely outside the fix diff. Non-blocking; the
controller ledgers these for the final review. "None" if none.

### Verdict

**Fix round:** [All findings addressed, no new Critical/Important
breakage | Findings remain open] — list the open ones.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 3 implementer (ČNB fx fetch) (model: sonnet)</summary>

````text
You are implementing Task 3: EUR/CZK build-time fetch — part of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page that compares US ETFs with their European UCITS equivalents (Astro static site + one vanilla-TS island + one Vercel function).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-3-brief.md
It is your requirements, with the exact values to use verbatim.

## Environment

- Repo D:\etf_landing_page, Windows 11, Git Bash + PowerShell, Node v26 (runs .ts files natively via type stripping: use only erasable TS syntax — no enums, namespaces, parameter properties), npm 11. NO Python: never run `python`.
- Branch `master`; commit directly to it. Commit messages in English, conventional prefix, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Only dependency allowed: `astro@7.3.8` (installed). Never add a package; if you think one is needed, report NEEDS_CONTEXT.
- Tests: `node --test <file>` (node:test + node:assert/strict). Full suite: `npm test`.
- Project rules: D:\etf_landing_page\CLAUDE.md (read "Data rules", "Copy & design rules", and "Overrides" in the Plugins table). Never type a data number by hand: figures come from data/*.json.
- Write long Czech text with your file Write/Edit tools, not shell heredocs.

## Context and controller rulings

- Earlier tasks: Task 1 scaffolded Astro; package.json already has `"prebuild": "node scripts/fetch-fx.mjs"` and a `test` script that globs `scripts/**/*.test.mjs`. This task creates that script.
- The ČNB API (`https://api.cnb.cz/cnbapi/exrates/daily?date=YYYY-MM-DD&lang=CZ`, no key) returns `{ "rates": [ { "validFor": "2026-10-14", "order": …, "country": …, "currency": …, "amount": 1, "currencyCode": "EUR", "rate": 24.355 }, … ] }`. A weekend/holiday date returns the previous business day. It sends no CORS headers, which is why this runs at build time. Record in `source_url` the exact URL fetched.
- `data/fx.json` is committed (it is the fallback when ČNB is unreachable at build). After tests pass, run the script for real once and commit the resulting `data/fx.json` in the same commit.
- The `today` used by the CLI must be the date in Europe/Prague (`new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date())` gives YYYY-MM-DD).
- `updateFx` returns `{ kept: true }` when it keeps the old file and `{ kept: false, ...fx }` (or similar) when it writes; the tests only check `kept: true` on the fallback paths.
- Detect "run directly" with `import.meta.url === pathToFileURL(process.argv[1]).href` (Windows-safe), so the test can import the module without triggering a network call.

## Before You Begin

If anything in the requirements or approach is unclear, ask now (status NEEDS_CONTEXT) instead of guessing.

## Your Job

1. Implement exactly what the task specifies (TDD where the brief says: show the RED failure before implementing)
2. Verify it works; run the full suite once before committing
3. Commit (small commits, one logical change each)
4. Self-review your diff: completeness, minimalism (no unrequested abstraction or options), tests verify behaviour
5. Report back

Keep it minimal. Never remove or weaken: a11y attributes, consent/GDPR text, the honeypot, server-side validation, source/date labels. No analytics code.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent or a reviewer — review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics. Bad work is worse than no work.

## After Review Findings

If resumed with findings: fix them, re-run the covering tests, append a fix report (changes, command, output) to your report file, reply with the short contract.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-3-report.md: what you implemented; TDD evidence (RED: command + failing output; GREEN: command + passing output) where TDD applies; other verification with command output; files changed; self-review findings; concerns.

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 3 reviewer (model: sonnet)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-3-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- data/fx.json is generated by the script and committed on purpose as the build fallback (decisions §14 #10).

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-3-report.md

## Diff Under Review

**Base:** 29af556
**Head:** 3463e74
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-29af556..3463e74.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 29af556..3463e74` and `git diff 29af556..3463e74`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 5 implementer (fee calculator) (model: haiku)</summary>

````text
You are implementing Task 5: Fee calculator (TDD) — part of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page that compares US ETFs with their European UCITS equivalents (Astro static site + one vanilla-TS island + one Vercel function).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-5-brief.md
It is your requirements, with the exact values to use verbatim.

## Environment

- Repo D:\etf_landing_page, Windows 11, Git Bash + PowerShell, Node v26 (runs .ts files natively via type stripping: use only erasable TS syntax — no enums, namespaces, parameter properties), npm 11. NO Python: never run `python`.
- Branch `master`; commit directly to it. Commit messages in English, conventional prefix, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Only dependency allowed: `astro@7.3.8` (installed). Never add a package; if you think one is needed, report NEEDS_CONTEXT.
- Tests: `node --test <file>` (node:test + node:assert/strict). Full suite: `npm test`.
- Project rules: D:\etf_landing_page\CLAUDE.md (read "Data rules", "Copy & design rules", and "Overrides" in the Plugins table). Never type a data number by hand: figures come from data/*.json.
- Write long Czech text with your file Write/Edit tools, not shell heredocs.

## Context and controller rulings

- The brief contains the complete test file and implementation; this is mostly transcription + making the tests pass. Step 1 asks you to run `node content/calc-examples.mjs` and paste its output as a header comment in the test file: do that, it is the oracle.
- Data shapes (already in the repo): `data/brokers.json` `.brokers[]` now has `id` (`xtb`, `t212`, `fio`, `cs`) and numeric `custody_pct` (added in commit 29af556). Fio's commission is `{ tiers_eur: [...], dip_account_up_to_500_eur }`; XTB/T212/ČS have `{ pct, min_eur, condition }`. `data/bank-funds.json` `.funds[]` (ČS entry has `ongoing_pct: null` and is excluded from the bank range, as in calc-examples). `data/fx.json` has `{ rate, validFor, source_url, retrieved_at }`.
- Import JSON in TS with `import x from '../../data/brokers.json' with { type: 'json' };` (works in Node 26 and in Vite). Import local TS with the `.ts` extension.
- Controller note on floats: the test `commissionEur(cs.commission, 2000) === 7` and `commissionEur(fio, 10000) === 15` use exact equality. If floating point makes them 7.000000000000001, change the TEST to compare with a tolerance (`assert.ok(Math.abs(x - 7) < 1e-9)`), never round inside `commissionEur`. Say in the report if you had to.
- The `compare()` in the brief computes `fixedFeePct` with a `pctOnly` comparison: keep that behaviour (a pure-percentage fee like ČS above its minimum is not a "fixed fee"), but you may simplify the expression if it stays equivalent and the tests pass.
- Type annotations: the JSON imports are wider than the `Broker`/`Bank` types; cast at the test call sites (`brokersJson.brokers as Broker[]`) rather than loosening the types. Node does not type-check, so keep types honest but don't fight the compiler.
- Do not modify content/calc-examples.mjs.

## Before You Begin

If anything in the requirements or approach is unclear, ask now (status NEEDS_CONTEXT) instead of guessing.

## Your Job

1. Implement exactly what the task specifies (TDD where the brief says: show the RED failure before implementing)
2. Verify it works; run the full suite once before committing
3. Commit (small commits, one logical change each)
4. Self-review your diff: completeness, minimalism (no unrequested abstraction or options), tests verify behaviour
5. Report back

Keep it minimal. Never remove or weaken: a11y attributes, consent/GDPR text, the honeypot, server-side validation, source/date labels. No analytics code.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent or a reviewer — review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics. Bad work is worse than no work.

## After Review Findings

If resumed with findings: fix them, re-run the covering tests, append a fix report (changes, command, output) to your report file, reply with the short contract.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-5-report.md: what you implemented; TDD evidence (RED: command + failing output; GREEN: command + passing output) where TDD applies; other verification with command output; files changed; self-review findings; concerns.

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 5 reviewer (model: sonnet)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-5-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- The fee model must reproduce content/calc-examples.mjs (the approved oracle) for default inputs; decisions §15 #2–5 bind the broker modelling.

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-5-report.md

## Diff Under Review

**Base:** 3463e74
**Head:** 55bad02
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-3463e74..55bad02.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 3463e74..55bad02` and `git diff 3463e74..55bad02`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 6 implementer (allow-list, validation) (model: haiku)</summary>

````text
You are implementing Task 6: Input allow-list and e-mail validation (TDD) — part of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page that compares US ETFs with their European UCITS equivalents (Astro static site + one vanilla-TS island + one Vercel function).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-6-brief.md
It is your requirements, with the exact values to use verbatim.

## Environment

- Repo D:\etf_landing_page, Windows 11, Git Bash + PowerShell, Node v26 (runs .ts files natively via type stripping: use only erasable TS syntax — no enums, namespaces, parameter properties), npm 11. NO Python: never run `python`.
- Branch `master`; commit directly to it. Commit messages in English, conventional prefix, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Only dependency allowed: `astro@7.3.8` (installed). Never add a package; if you think one is needed, report NEEDS_CONTEXT.
- Tests: `node --test <file>` (node:test + node:assert/strict). Full suite: `npm test`.
- Project rules: D:\etf_landing_page\CLAUDE.md (read "Data rules", "Copy & design rules", and "Overrides" in the Plugins table). Never type a data number by hand: figures come from data/*.json.
- Write long Czech text with your file Write/Edit tools, not shell heredocs.

## Context and controller rulings

- This module is the trust boundary of the whole site: `/api/lead` (Task 8), `/plan` (Task 12) and the island all call it, and decisions §6a rule 1 says nothing from a request reaches the e-mail or Brevo except values that passed through it. Read docs/decisions.md §6a.
- `BrokerId` is exported from `src/lib/fees.ts` (`'unknown'|'xtb'|'t212'|'fio'|'cs'`); import the type from there (`import type { BrokerId } from './fees.ts'`) rather than redefining it. Keep the list of allowed broker values in selection.ts (a const array) since fees.ts has no runtime list.
- `knownTickers` is passed in by the caller (the US tickers in data order: VOO, SPY, IVV, VTI, QQQ, VT, SCHD). Do not import data here.
- **Controller ruling A:** `toParams` must emit keys in exactly this order: `t, m, y, r, b, d` (a later e-mail test depends on it). Add one test that pins the order, e.g. `assert.equal(toParams(s).toString(), 't=VOO%2CQQQ&m=5000&y=10&r=6&b=fio&d=acc')` — check how URLSearchParams encodes the comma and assert the actual correct string. With no tickers, `t` is still emitted as `t=` (empty) so the order stays fixed.
- Tickers param `t` is comma-separated; split on `,`, trim, uppercase.
- The brief's e-mail regex: `^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$` plus "reject any char < 0x20" and length ≤ 254, after trim + lowercase. Check that all the brief's bad and good examples behave as the tests expect; if the regex as written disagrees with a test, the test is the requirement — adjust the regex and say so in the report.
- `sanitizeUtm` returns all five keys always (missing → "").

## Before You Begin

If anything in the requirements or approach is unclear, ask now (status NEEDS_CONTEXT) instead of guessing.

## Your Job

1. Implement exactly what the task specifies (TDD where the brief says: show the RED failure before implementing)
2. Verify it works; run the full suite once before committing
3. Commit (small commits, one logical change each)
4. Self-review your diff: completeness, minimalism (no unrequested abstraction or options), tests verify behaviour
5. Report back

Keep it minimal. Never remove or weaken: a11y attributes, consent/GDPR text, the honeypot, server-side validation, source/date labels. No analytics code.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent or a reviewer — review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics. Bad work is worse than no work.

## After Review Findings

If resumed with findings: fix them, re-run the covering tests, append a fix report (changes, command, output) to your report file, reply with the short contract.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-6-report.md: what you implemented; TDD evidence (RED: command + failing output; GREEN: command + passing output) where TDD applies; other verification with command output; files changed; self-review findings; concerns.

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 6 reviewer (model: sonnet)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-6-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- decisions §6a rule 1 (allow-list, clamp, length caps) and §7 (`ad_a_*` -> a, `ad_b_*` -> b, anything else -> unknown) bind this task.
- Ruling A: toParams emits t, m, y, r, b, d in that order, pinned by a test.

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-6-report.md

## Diff Under Review

**Base:** 55bad02
**Head:** f038d44
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-55bad02..f038d44.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 55bad02..f038d44` and `git diff 55bad02..f038d44`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 7 implementer (plan model, e-mail) (model: sonnet)</summary>

````text
You are implementing Task 7: Data view model, plan model, e-mail renderer (TDD) — part of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page that compares US ETFs with their European UCITS equivalents (Astro static site + one vanilla-TS island + one Vercel function).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-7-brief.md
It is your requirements, with the exact values to use verbatim.

## Environment

- Repo D:\etf_landing_page, Windows 11, Git Bash + PowerShell, Node v26 (runs .ts files natively via type stripping: use only erasable TS syntax — no enums, namespaces, parameter properties), npm 11. NO Python: never run `python`.
- Branch `master`; commit directly to it. Commit messages in English, conventional prefix, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Only dependency allowed: `astro@7.3.8` (installed). Never add a package; if you think one is needed, report NEEDS_CONTEXT.
- Tests: `node --test <file>` (node:test + node:assert/strict). Full suite: `npm test`.
- Project rules: D:\etf_landing_page\CLAUDE.md (read "Data rules", "Copy & design rules", and "Overrides" in the Plugins table). Never type a data number by hand: figures come from data/*.json.
- Write long Czech text with your file Write/Edit tools, not shell heredocs.

## Context and controller rulings

- Already in the repo (use them, don't redefine):
  - `src/lib/fees.ts`: `compare(inp, ctx)`, `yearRows(inp, ctx, marks?)`, `roundK`, `brokerFor`, types `Inputs`, `BrokerId`, `Broker`, `Bank`. `ctx = { brokerId, terPct, eurCzk, banks, brokers }`.
  - `src/lib/selection.ts`: `parseSelection(params, knownTickers)`, `toParams(sel)` (keys in order t, m, y, r, b, d), `RANGES`, type `Selection = { tickers, monthly, years, returnPct, broker, dividends: 'acc'|'dist'|'both' }`.
  - `data/etfs.json` (`us_etfs[]` with `twins`/`similar` ISIN lists, `index_key`, `index`, `twin_note`/`similar_note`; `ucits_etfs[]` with `listings[]`, `kid_cs` (true/false/null), `sources.default.{url,as_of}`, `sources.kid.url`; `indexes` map; `snapshot.retrieved_at`), `data/bank-funds.json`, `data/brokers.json`, `data/fx.json` (`{rate, validFor, source_url, retrieved_at}`).
- **Controller ruling B:** `data.ts` exports `US_TICKERS: string[]` (us_etfs order) and `FX` (the parsed data/fx.json). Test files define their own local helpers, e.g. `const fx = FX;` and `const render = (q: string) => { const sel = parseSelection(new URLSearchParams(q), US_TICKERS); return renderEmail(buildPlan(sel, FX), sel, 'https://example.cz'); }`.
- `buildPlan(sel, fx)` signature takes `fx: { rate: number; validFor: string }`; the fee part uses `compare` / `yearRows` with `eurCzk: fx.rate`, banks from bank-funds.json, brokers from brokers.json, `brokerId: sel.broker`.
- Decisions that bind the plan model (docs/decisions.md §15): #2 ETF side uses the **max TER among all shown twins** (`terTicker` = Xetra ticker of the first fund with that TER in the displayed order); #6 twin order = accumulating first, then alphabetical by Xetra ticker; #7 picks sharing an `index_key` are grouped into one group (`picks` in the selection's order); #8 empty `tickers` → fallback picks VOO, SPY, IVV with `fallback: true`.
- Group kinds: `same` (us fund has twins), `nearest` (VTI: no twins, show the S&P 500 twins with page.md/email.md's "jiný index" label — find them via the S&P 500 US fund's `twins`, not by hard-coding ISINs), `none` (SCHD), and VT is `same` with `similar` = VWCE/VGWL (from `similar`). `other` is not reachable from a Selection (the "Jiné" chip is UI-only) — drop that kind from the type if nothing produces it. Check `twin_note` / `similar_note` in etfs.json for VTI/SCHD/VT and use the JSON to drive these, not ticker string comparisons where avoidable.
- Dividend filter `d` applies to twins (and `similar`). `nearest` twins are filtered too.
- **E-mail copy:** content/email.md is approved copy — use it verbatim (sections Top, 1–5, Footer). Note the Footer gained a new GDPR art. 21(4) paragraph on 2026-10-15 ("Co jste v nástroji vybrali a z jaké reklamy jste přišli…"): it must be in the e-mail as its own paragraph. `*Poznámka:*` lines in email.md are build notes, never e-mail text. `[DOPLNIT …]` placeholders stay visible as-is. The `{11. 10. 2026}` in the footer is the request date: use the send date (pass it in; default `new Date()` in Europe/Prague formatted `d. m. yyyy`). `{etfdvojce…}` = the site host from `siteUrl`.
- The `/plan` link: `${siteUrl}/plan?${toParams(sel)}` — the test expects `&amp;` escaping inside href. Add `utm_source=email` only if it doesn't break the test's regex (it may be appended after `d=…`; decisions §12 says magnet_opened carries utm_source=email — append it as the last param).
- Section 3 fee table: rows from `yearRows`, values `roundK`-ed and formatted with `fmtCzk`; bank column shows `min–max` range (en dash, no spaces, e.g. "883 000–950 000 Kč"); Rozdíl column = ETF − bank as a range. The broker line follows email.md (broker name, its price-list date from brokers.json `as_of`, Fio note only when Fio chosen).
- Every value inserted into HTML passes through `esc`. Inline styles only, table layout, max-width 600 px, `font-family: Arial, sans-serif` (e-mail clients don't load web fonts). Plain-text part from the same model.
- Expected values in plan tests must be read from data/etfs.json (the reviewer checks them against the JSON). The Xetra ticker comes from the listing whose exchange contains "Xetra".
- Files: create exactly `src/lib/data.ts`, `src/lib/plan.ts`, `src/lib/email.ts`, `src/lib/plan.test.ts`, `src/lib/email.test.ts` (a small `data.test.ts` for the three formatters is fine). If email.ts grows past ~250 lines, report DONE_WITH_CONCERNS rather than splitting on your own.

## Before You Begin

If anything in the requirements or approach is unclear, ask now (status NEEDS_CONTEXT) instead of guessing.

## Your Job

1. Implement exactly what the task specifies (TDD where the brief says: show the RED failure before implementing)
2. Verify it works; run the full suite once before committing
3. Commit (small commits, one logical change each)
4. Self-review your diff: completeness, minimalism (no unrequested abstraction or options), tests verify behaviour
5. Report back

Keep it minimal. Never remove or weaken: a11y attributes, consent/GDPR text, the honeypot, server-side validation, source/date labels. No analytics code.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent or a reviewer — review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics. Bad work is worse than no work.

## After Review Findings

If resumed with findings: fix them, re-run the covering tests, append a fix report (changes, command, output) to your report file, reply with the short contract.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-7-report.md: what you implemented; TDD evidence (RED: command + failing output; GREEN: command + passing output) where TDD applies; other verification with command output; files changed; self-review findings; concerns.

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 7 reviewer (model: sonnet)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-7-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- decisions §15 #2 (max TER of shown twins; ties: first in etfs.json data order, so VOO -> VUAA), #6 (acc first, then alphabetical by Xetra ticker), #7 (group picks by index), #8 (empty tickers -> VOO, SPY, IVV fallback).
- Ruling B: data.ts exports US_TICKERS and FX.
- content/email.md is approved copy and must appear verbatim (incl. the new art. 21(4) footer paragraph); `*Poznámka:*` lines are not e-mail text; `[DOPLNIT …]` stays visible. Check the HTML against email.md text.
- decisions §6a rule 1: only allow-listed values reach the e-mail; every inserted value escaped; UTM never rendered.

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-7-report.md

## Diff Under Review

**Base:** f038d44
**Head:** c68b876
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-f038d44..c68b876.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat f038d44..c68b876` and `git diff f038d44..c68b876`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 7 fix round 1 (model: sonnet)</summary>

````text
Fix round 1 for Task 7. Fix these, re-run `node --test src/lib/plan.test.ts src/lib/email.test.ts` and then `npm test`, append a fix report to task-7-report.md, reply with the short contract.

1. (Important) **email.ts footer not verbatim:** email.md says "Plán vám přišel, protože jste si ho {11. 10. 2026} vyžádali na {etfdvojce…}." — the "ho" is missing. Restore it and change the test to assert the full sentence.
2. (Important) **Unapproved copy:** remove "(nejvyšší z vašich dvojčat: …)" from the ETF line (email.ts ~220); the line must read as email.md: "ETF: TER {0,07 %} ročně, poplatek za obchod a směna měny u {brokera} ({ceník, datum})." Also remove the added "Pořadí v tabulce není doporučení." (email.ts ~241) — email.md's own text for that spot is "Toto není doporučení. Který fond koupíte a jestli vůbec, je na vás." Approved copy only.
3. (Important, controller ruling) **No-twin plans (SCHD only):** the fee side must never use a US ETF's TER. Ruling: when no twins are shown across all groups, `buildPlan` computes the fees with the S&P 500 twins (the same set the fallback plan uses: the twins of the first US fund with `index_key` 'sp500', filtered by `dividends`), so `terPct`/`terTicker` always name a UCITS fund. Add a plan test: `t=SCHD` → `fees.terTicker` is a UCITS Xetra ticker from the S&P 500 set and `terPct` equals that set's max TER read from etfs.json.
4. (Minor, do it — the numbers are the riskiest part) Add assertions in email.test.ts for the computed fee paragraphs of a `t=VOO&b=fio` render: "3,95 EUR", "3,16 %", "1,65 %", "3–5 %", "1,75–2,59 %", and the Fio-only note ("Fio kurzovou přirážku nezveřejňuje") present for `b=fio` and absent for `b=xtb`. Use the exact characters the renderer emits (nbsp before %/Kč/EUR if that's what fmt* produce) — assert against the real output, don't loosen the renderer.

Do not touch anything else. Commit as `fix: verbatim e-mail copy and UCITS-only TER for no-twin plans`.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 7 re-review round 1 (model: sonnet)</summary>

````text
You are re-reviewing one task's fix round. A previous review produced
findings; an implementer has attempted to fix them. Your job is to
verdict each finding and inspect the fix diff — nothing else.

## The Task

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-7-brief.md

## The Findings Under Verification

Fix round 1 for Task 7. Fix these, re-run `node --test src/lib/plan.test.ts src/lib/email.test.ts` and then `npm test`, append a fix report to task-7-report.md, reply with the short contract.

1. (Important) **email.ts footer not verbatim:** email.md says "Plán vám přišel, protože jste si ho {11. 10. 2026} vyžádali na {etfdvojce…}." — the "ho" is missing. Restore it and change the test to assert the full sentence.
2. (Important) **Unapproved copy:** remove "(nejvyšší z vašich dvojčat: …)" from the ETF line (email.ts ~220); the line must read as email.md: "ETF: TER {0,07 %} ročně, poplatek za obchod a směna měny u {brokera} ({ceník, datum})." Also remove the added "Pořadí v tabulce není doporučení." (email.ts ~241) — email.md's own text for that spot is "Toto není doporučení. Který fond koupíte a jestli vůbec, je na vás." Approved copy only.
3. (Important, controller ruling) **No-twin plans (SCHD only):** the fee side must never use a US ETF's TER. Ruling: when no twins are shown across all groups, `buildPlan` computes the fees with the S&P 500 twins (the same set the fallback plan uses: the twins of the first US fund with `index_key` 'sp500', filtered by `dividends`), so `terPct`/`terTicker` always name a UCITS fund. Add a plan test: `t=SCHD` → `fees.terTicker` is a UCITS Xetra ticker from the S&P 500 set and `terPct` equals that set's max TER read from etfs.json.
4. (Minor, do it — the numbers are the riskiest part) Add assertions in email.test.ts for the computed fee paragraphs of a `t=VOO&b=fio` render: "3,95 EUR", "3,16 %", "1,65 %", "3–5 %", "1,75–2,59 %", and the Fio-only note ("Fio kurzovou přirážku nezveřejňuje") present for `b=fio` and absent for `b=xtb`. Use the exact characters the renderer emits (nbsp before %/Kč/EUR if that's what fmt* produce) — assert against the real output, don't loosen the renderer.

Do not touch anything else. Commit as `fix: verbatim e-mail copy and UCITS-only TER for no-twin plans`.

## The Fix

Read the implementer's report (fix reports are appended at the end):
D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-7-report.md

**Fix base:** c68b876 (the head the previous review saw)
**Head:** aedb5a7
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-c68b876..aedb5a7.diff

Read the diff file once — it contains the fix commits, a stat summary,
and the fix diff with surrounding context. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat c68b876..aedb5a7` and
`git diff c68b876..aedb5a7`.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Scope

Your scope is the findings list and the fix diff. Verdict every finding.
Inspect the fix diff for new problems the fix itself introduced. Do NOT
re-review code the fix did not touch: if you notice an issue entirely
outside the fix diff, report it under Out-of-Scope Observations — it
does not block this task and does not extend the loop. A broad
whole-branch review happens after all tasks are complete.

## Tests

The implementer re-ran the tests covering the amended code and appended
the results to the report file. Treat the report as unverified claims:
confirm the fix report names the covering tests and shows their output,
and verify the claims against the diff. Do not re-run the suite to
confirm their report. Run a test only when reading the code raises a
specific doubt that no existing run answers — and then a focused test,
never a package-wide suite.

## Output Format

Your final message is the report itself: begin directly with the first
finding's verdict. Every line is a verdict, a finding with file:line,
or a check you ran — no preamble, no process narration.

### Finding Verdicts

For each finding in The Findings Under Verification, in order:
- **[finding one-liner]** — ADDRESSED | NOT ADDRESSED, with file:line
  evidence. "Attempted" is not addressed: the specific defect must no
  longer exist.

### New Breakage in the Fix Diff

Anything the fix itself broke or introduced, with severity
(Critical/Important/Minor) and file:line. "None" if clean.

### Out-of-Scope Observations

Issues you noticed entirely outside the fix diff. Non-blocking; the
controller ledgers these for the final review. "None" if none.

### Verdict

**Fix round:** [All findings addressed, no new Critical/Important
breakage | Findings remain open] — list the open ones.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 8 implementer (/api/lead) (model: sonnet)</summary>

````text
You are implementing Task 8: C:/Program Files/Git/api/lead + Brevo client + local API server (TDD) — part of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page that compares US ETFs with their European UCITS equivalents (Astro static site + one vanilla-TS island + one Vercel function).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-8-brief.md
It is your requirements, with the exact values to use verbatim.

## Environment

- Repo D:\etf_landing_page, Windows 11, Git Bash + PowerShell, Node v26 (runs .ts files natively via type stripping: use only erasable TS syntax — no enums, namespaces, parameter properties), npm 11. NO Python: never run `python`.
- Branch `master`; commit directly to it. Commit messages in English, conventional prefix, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Only dependency allowed: `astro@7.3.8` (installed). Never add a package; if you think one is needed, report NEEDS_CONTEXT.
- Tests: `node --test <file>` (node:test + node:assert/strict). Full suite: `npm test`.
- Project rules: D:\etf_landing_page\CLAUDE.md (read "Data rules", "Copy & design rules", and "Overrides" in the Plugins table). Never type a data number by hand: figures come from data/*.json.
- Write long Czech text with your file Write/Edit tools, not shell heredocs.

## Context and controller rulings

- This is the only endpoint that accepts internet input and sends e-mail in our name. Read docs/decisions.md §6 and §6a (rules 1–6) and §15 #10–13, #15 before writing code; they are binding.
- Already in the repo (use as-is):
  - `src/lib/selection.ts`: `parseSelection(params: URLSearchParams, knownTickers)`, `validateEmail(raw)`, `sanitizeUtm(params)`, `adVariant(utmContent)`, `toParams`. For JSON bodies, build a `URLSearchParams` from the object's string values before calling these (non-string values → ignore).
  - `src/lib/data.ts`: `US_TICKERS`, `FX`.
  - `src/lib/plan.ts`: `buildPlan(sel, fx)`.
  - `src/lib/email.ts`: `renderEmail(plan, sel, siteUrl, sentOn?) => { subject, html, text }`.
- Request parsing: accept `application/json` and `application/x-www-form-urlencoded`. Read the body as text once, reject > 10 000 bytes with 413 before parsing (use the byte length of the text, `new TextEncoder().encode(t).length`, or check `content-length` first and still check the text). Malformed JSON → 400 `{ok:false, reason:'invalid'}`. Response type: JSON when the `accept` header includes `application/json`, else 303 redirects (`/dekujeme/` success, `/chyba-formulare/` failure of any kind incl. server errors).
- Honeypot field `fld_q8` (§15 #10): non-empty → `log` once, fake success, zero Brevo calls.
- Newsletter checkbox field name `newsletter`; ticked = value `on` or `true` (string). Attributes per §15 #12: `NEWSLETTER: true`, `NEWSLETTER_CONSENT_AT: now ISO`, `CONSENT_TEXT_V: 1`; unticked → none of these keys present (never clear an earlier consent).
- Attribute names exactly as the brief lists (Brevo attributes are uppercase). `TICKERS` = comma-joined allowed tickers (empty string when none). `LAST_REQUEST_AT` = now ISO on every accepted request.
- Lists: env `BREVO_PLAN_LIST_ID` always, `BREVO_NEWSLETTER_LIST_ID` only when ticked (parse to numbers; missing/NaN → omit that list).
- Dedupe (§6a rule 3): `getContact` → if `PLAN_SENT_AT` exists and `now - PLAN_SENT_AT < 24 h` → upsert attributes, no send, 200. Sequence when sending (§15 #11): upsert (without PLAN_SENT_AT) → sendEmail → upsert `{ PLAN_SENT_AT }` only (a failure of that last call is logged and still returns 200). Failures of getContact, the first upsert, or sendEmail → 502 `{ok:false, reason:'server'}`.
- Logging: `log(message, data?)` must never include the e-mail address in clear (GDPR data minimisation in Vercel logs): log reason codes only (`honeypot`, `brevo_error`, `plan_sent_at_update_failed`) plus non-personal context.
- Brevo REST v3 (`https://api.brevo.com/v3`, header `api-key`, `content-type: application/json`, `accept: application/json`):
  - `GET /contacts/{encodeURIComponent(email)}` → 200 `{ attributes: {...} }` | 404 → null.
  - `POST /contacts` body `{ email, attributes, listIds, updateEnabled: true }` → 201/204.
  - `POST /smtp/email` body `{ sender: { name, email }, to: [{ email }], replyTo: { email }, subject, htmlContent, textContent }` → 201. (Omit `replyTo` when the env var is empty.)
  - `AbortSignal.timeout(8000)` on every call; non-2xx (except the 404 case) → throw an Error whose message has the status but not the address.
- Dry-run (§15 #15): `brevoFromEnv(env, fetch)` without `BREVO_API_KEY` returns a client whose getContact returns null, upsert logs "dry-run upsert" (attribute keys only), sendEmail writes `.dev/last-email.html` (mkdir -p `.dev`) and logs the subject. Dry-run has no memory, so dedupe is only covered by the unit tests — that is expected.
- `export async function POST(request: Request)` in api/lead.ts wires real deps: `brevoFromEnv(process.env, fetch)`, `now: () => new Date()`, `log: (m, d) => console.log(JSON.stringify({ m, ...d }))`, `siteUrl: process.env.SITE_URL ?? 'http://localhost:4321'`. This is the Vercel Node.js runtime's Web-standard handler signature; whether Vercel resolves the `.ts`-extension imports in api/ is a known Phase 5 risk — don't try to solve it now.
- `scripts/dev.mjs`: `node:http` server on 127.0.0.1:8787 that builds a `Request` from the Node request (method, headers, full body buffer), calls `POST` (only for path `/api/lead`; other paths 404), and writes status, headers and body back; then `spawn` `npx astro dev` with `{ stdio: 'inherit', shell: true }` (Windows needs `shell: true` for npx) and kills it on SIGINT/exit. The Astro config already proxies `/api` to :8787 in dev (Task 1) — confirm that in astro.config.mjs.
- After tests pass, do the manual check in the brief Step 4 (start `node scripts/dev.mjs` in the background, curl the JSON POST and a form POST, confirm `{"ok":true}`, the 303, and `.dev/last-email.html`), then stop the server. Include the curl outputs in the report.
- No rate limiting in code (decisions §15 #17 is a proposal for the platform layer). The client handles 429 later.
- Files: `api/lead.ts`, `api/lead.test.ts`, `src/lib/brevo.ts`, `scripts/dev.mjs`. Add `.dev/` is already gitignored.
- Parked from Task 7 review (pointer: ledger "Task 7: review 1"): `renderEmail` calls `new URL(siteUrl).host`, which throws on a malformed SITE_URL. In `POST`, validate SITE_URL once (try `new URL`) and fall back to `http://localhost:4321` with a logged warning, so a bad env var cannot turn every request into a 500.
- Parked from Task 5 review: `brokerFor` assumes a valid BrokerId; `parseSelection` already guarantees that — always pass the parsed selection, never raw input.

## Before You Begin

If anything in the requirements or approach is unclear, ask now (status NEEDS_CONTEXT) instead of guessing.

## Your Job

1. Implement exactly what the task specifies (TDD where the brief says: show the RED failure before implementing)
2. Verify it works; run the full suite once before committing
3. Commit (small commits, one logical change each)
4. Self-review your diff: completeness, minimalism (no unrequested abstraction or options), tests verify behaviour
5. Report back

Keep it minimal. Never remove or weaken: a11y attributes, consent/GDPR text, the honeypot, server-side validation, source/date labels. No analytics code.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent or a reviewer — review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics. Bad work is worse than no work.

## After Review Findings

If resumed with findings: fix them, re-run the covering tests, append a fix report (changes, command, output) to your report file, reply with the short contract.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-8-report.md: what you implemented; TDD evidence (RED: command + failing output; GREEN: command + passing output) where TDD applies; other verification with command output; files changed; self-review findings; concerns.

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 8 reviewer (model: opus)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-8-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- This is the only endpoint that accepts internet input and sends e-mail in our name. Read docs/decisions.md §6 and §6a (rules 1–6) and §15 #10–13, #15 before writing code; they are binding.
- Already in the repo (use as-is):
  - `src/lib/selection.ts`: `parseSelection(params: URLSearchParams, knownTickers)`, `validateEmail(raw)`, `sanitizeUtm(params)`, `adVariant(utmContent)`, `toParams`. For JSON bodies, build a `URLSearchParams` from the object's string values before calling these (non-string values → ignore).
  - `src/lib/data.ts`: `US_TICKERS`, `FX`.
  - `src/lib/plan.ts`: `buildPlan(sel, fx)`.
  - `src/lib/email.ts`: `renderEmail(plan, sel, siteUrl, sentOn?) => { subject, html, text }`.
- Request parsing: accept `application/json` and `application/x-www-form-urlencoded`. Read the body as text once, reject > 10 000 bytes with 413 before parsing (use the byte length of the text, `new TextEncoder().encode(t).length`, or check `content-length` first and still check the text). Malformed JSON → 400 `{ok:false, reason:'invalid'}`. Response type: JSON when the `accept` header includes `application/json`, else 303 redirects (`/dekujeme/` success, `/chyba-formulare/` failure of any kind incl. server errors).
- Honeypot field `fld_q8` (§15 #10): non-empty → `log` once, fake success, zero Brevo calls.
- Newsletter checkbox field name `newsletter`; ticked = value `on` or `true` (string). Attributes per §15 #12: `NEWSLETTER: true`, `NEWSLETTER_CONSENT_AT: now ISO`, `CONSENT_TEXT_V: 1`; unticked → none of these keys present (never clear an earlier consent).
- Attribute names exactly as the brief lists (Brevo attributes are uppercase). `TICKERS` = comma-joined allowed tickers (empty string when none). `LAST_REQUEST_AT` = now ISO on every accepted request.
- Lists: env `BREVO_PLAN_LIST_ID` always, `BREVO_NEWSLETTER_LIST_ID` only when ticked (parse to numbers; missing/NaN → omit that list).
- Dedupe (§6a rule 3): `getContact` → if `PLAN_SENT_AT` exists and `now - PLAN_SENT_AT < 24 h` → upsert attributes, no send, 200. Sequence when sending (§15 #11): upsert (without PLAN_SENT_AT) → sendEmail → upsert `{ PLAN_SENT_AT }` only (a failure of that last call is logged and still returns 200). Failures of getContact, the first upsert, or sendEmail → 502 `{ok:false, reason:'server'}`.
- Logging: `log(message, data?)` must never include the e-mail address in clear (GDPR data minimisation in Vercel logs): log reason codes only (`honeypot`, `brevo_error`, `plan_sent_at_update_failed`) plus non-personal context.
- Brevo REST v3 (`https://api.brevo.com/v3`, header `api-key`, `content-type: application/json`, `accept: application/json`):
  - `GET /contacts/{encodeURIComponent(email)}` → 200 `{ attributes: {...} }` | 404 → null.
  - `POST /contacts` body `{ email, attributes, listIds, updateEnabled: true }` → 201/204.
  - `POST /smtp/email` body `{ sender: { name, email }, to: [{ email }], replyTo: { email }, subject, htmlContent, textContent }` → 201. (Omit `replyTo` when the env var is empty.)
  - `AbortSignal.timeout(8000)` on every call; non-2xx (except the 404 case) → throw an Error whose message has the status but not the address.
- Dry-run (§15 #15): `brevoFromEnv(env, fetch)` without `BREVO_API_KEY` returns a client whose getContact returns null, upsert logs "dry-run upsert" (attribute keys only), sendEmail writes `.dev/last-email.html` (mkdir -p `.dev`) and logs the subject. Dry-run has no memory, so dedupe is only covered by the unit tests — that is expected.
- `export async function POST(request: Request)` in api/lead.ts wires real deps: `brevoFromEnv(process.env, fetch)`, `now: () => new Date()`, `log: (m, d) => console.log(JSON.stringify({ m, ...d }))`, `siteUrl: process.env.SITE_URL ?? 'http://localhost:4321'`. This is the Vercel Node.js runtime's Web-standard handler signature; whether Vercel resolves the `.ts`-extension imports in api/ is a known Phase 5 risk — don't try to solve it now.
- `scripts/dev.mjs`: `node:http` server on 127.0.0.1:8787 that builds a `Request` from the Node request (method, headers, full body buffer), calls `POST` (only for path `/api/lead`; other paths 404), and writes status, headers and body back; then `spawn` `npx astro dev` with `{ stdio: 'inherit', shell: true }` (Windows needs `shell: true` for npx) and kills it on SIGINT/exit. The Astro config already proxies `/api` to :8787 in dev (Task 1) — confirm that in astro.config.mjs.
- After tests pass, do the manual check in the brief Step 4 (start `node scripts/dev.mjs` in the background, curl the JSON POST and a form POST, confirm `{"ok":true}`, the 303, and `.dev/last-email.html`), then stop the server. Include the curl outputs in the report.
- No rate limiting in code (decisions §15 #17 is a proposal for the platform layer). The client handles 429 later.
- Files: `api/lead.ts`, `api/lead.test.ts`, `src/lib/brevo.ts`, `scripts/dev.mjs`. Add `.dev/` is already gitignored.
- Parked from Task 7 review (pointer: ledger "Task 7: review 1"): `renderEmail` calls `new URL(siteUrl).host`, which throws on a malformed SITE_URL. In `POST`, validate SITE_URL once (try `new URL`) and fall back to `http://localhost:4321` with a logged warning, so a bad env var cannot turn every request into a 500.
- Parked from Task 5 review: `brokerFor` assumes a valid BrokerId; `parseSelection` already guarantees that — always pass the parsed selection, never raw input.

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-8-report.md

## Diff Under Review

**Base:** 03940a0
**Head:** ae06615
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-03940a0..ae06615.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 03940a0..ae06615` and `git diff 03940a0..ae06615`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 8 fix round 1 (model: sonnet)</summary>

````text
Fix round 1 for Task 8. Fix these, re-run `node --test api/lead.test.ts` then `npm test`, append a fix report to task-8-report.md (include the raw command output), reply with the short contract.

1. (Important) **lead.ts ~216 and ~222 swallow the error cause.** Log it without personal data: `catch (err) { log('brevo_error', { error: String((err as Error)?.message ?? err).slice(0, 200) }); … }` and the same for `plan_sent_at_update_failed`. Rename the first code to something that doesn't claim Brevo when render/plan throws (e.g. `lead_failed`, with the message showing the cause), or wrap only the Brevo calls — your choice, keep it small. Add a test: a failing upsert whose Error message is `brevo 400 /contacts` → the logged data contains that message and still no e-mail address (the existing "no e-mail in logs" test must stay green).
2. (Minor, do it) Add the list-ID test: `handleLead(json({ email: 'a@b.cz', newsletter: 'on' }), deps(f), { BREVO_PLAN_LIST_ID: '3', BREVO_NEWSLETTER_LIST_ID: 'x' })` → lists `[3]`; ticked with both valid → `[3, 4]`; unticked with both valid → `[3]`.
3. (Minor, do it) One-line comment above the dedupe read: `// shortcut: read-then-write on Brevo; two submits within ms can both send. Acceptable at this volume; a shared lock would fix it.`
4. (Minor, do it) scripts/dev.mjs: bind the server to the same host the Astro proxy targets (`localhost` in astro.config.mjs), and on win32 kill the astro process tree with `taskkill /pid <pid> /T /F` (spawnSync) instead of `child.kill()`, so Ctrl+C doesn't leave `astro dev` holding :4321. Re-run the manual JSON POST through :4321 to confirm, and confirm port 4321 is free after stopping.

Nothing else. Commit as `fix: log lead failure causes, test list IDs, dev server cleanup`.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 8 re-review round 1 (model: sonnet)</summary>

````text
You are re-reviewing one task's fix round. A previous review produced
findings; an implementer has attempted to fix them. Your job is to
verdict each finding and inspect the fix diff — nothing else.

## The Task

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-8-brief.md

## The Findings Under Verification

Fix round 1 for Task 8. Fix these, re-run `node --test api/lead.test.ts` then `npm test`, append a fix report to task-8-report.md (include the raw command output), reply with the short contract.

1. (Important) **lead.ts ~216 and ~222 swallow the error cause.** Log it without personal data: `catch (err) { log('brevo_error', { error: String((err as Error)?.message ?? err).slice(0, 200) }); … }` and the same for `plan_sent_at_update_failed`. Rename the first code to something that doesn't claim Brevo when render/plan throws (e.g. `lead_failed`, with the message showing the cause), or wrap only the Brevo calls — your choice, keep it small. Add a test: a failing upsert whose Error message is `brevo 400 /contacts` → the logged data contains that message and still no e-mail address (the existing "no e-mail in logs" test must stay green).
2. (Minor, do it) Add the list-ID test: `handleLead(json({ email: 'a@b.cz', newsletter: 'on' }), deps(f), { BREVO_PLAN_LIST_ID: '3', BREVO_NEWSLETTER_LIST_ID: 'x' })` → lists `[3]`; ticked with both valid → `[3, 4]`; unticked with both valid → `[3]`.
3. (Minor, do it) One-line comment above the dedupe read: `// shortcut: read-then-write on Brevo; two submits within ms can both send. Acceptable at this volume; a shared lock would fix it.`
4. (Minor, do it) scripts/dev.mjs: bind the server to the same host the Astro proxy targets (`localhost` in astro.config.mjs), and on win32 kill the astro process tree with `taskkill /pid <pid> /T /F` (spawnSync) instead of `child.kill()`, so Ctrl+C doesn't leave `astro dev` holding :4321. Re-run the manual JSON POST through :4321 to confirm, and confirm port 4321 is free after stopping.

Nothing else. Commit as `fix: log lead failure causes, test list IDs, dev server cleanup`.

## The Fix

Read the implementer's report (fix reports are appended at the end):
D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-8-report.md

**Fix base:** ae06615 (the head the previous review saw)
**Head:** 9d731cf
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-ae06615..9d731cf.diff

Read the diff file once — it contains the fix commits, a stat summary,
and the fix diff with surrounding context. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat ae06615..9d731cf` and
`git diff ae06615..9d731cf`.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Scope

Your scope is the findings list and the fix diff. Verdict every finding.
Inspect the fix diff for new problems the fix itself introduced. Do NOT
re-review code the fix did not touch: if you notice an issue entirely
outside the fix diff, report it under Out-of-Scope Observations — it
does not block this task and does not extend the loop. A broad
whole-branch review happens after all tasks are complete.

## Tests

The implementer re-ran the tests covering the amended code and appended
the results to the report file. Treat the report as unverified claims:
confirm the fix report names the covering tests and shows their output,
and verify the claims against the diff. Do not re-run the suite to
confirm their report. Run a test only when reading the code raises a
specific doubt that no existing run answers — and then a focused test,
never a package-wide suite.

## Output Format

Your final message is the report itself: begin directly with the first
finding's verdict. Every line is a verdict, a finding with file:line,
or a check you ran — no preamble, no process narration.

### Finding Verdicts

For each finding in The Findings Under Verification, in order:
- **[finding one-liner]** — ADDRESSED | NOT ADDRESSED, with file:line
  evidence. "Attempted" is not addressed: the specific defect must no
  longer exist.

### New Breakage in the Fix Diff

Anything the fix itself broke or introduced, with severity
(Critical/Important/Minor) and file:line. "None" if clean.

### Out-of-Scope Observations

Issues you noticed entirely outside the fix diff. Non-blocking; the
controller ledgers these for the final review. "None" if none.

### Verdict

**Fix round:** [All findings addressed, no new Critical/Important
breakage | Findings remain open] — list the open ones.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 9 implementer (static page, design) (model: opus)</summary>

````text
You are implementing Task 9: Static page, sections, no-JS table, legal and static pages — part of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page that compares US ETFs with their European UCITS equivalents (Astro static site + one vanilla-TS island + one Vercel function).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-9-brief.md
It is your requirements, with the exact values to use verbatim.

## Environment

- Repo D:\etf_landing_page, Windows 11, Git Bash + PowerShell, Node v26 (runs .ts files natively via type stripping: use only erasable TS syntax — no enums, namespaces, parameter properties), npm 11. NO Python: never run `python`.
- Branch `master`; commit directly to it. Commit messages in English, conventional prefix, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Only dependency allowed: `astro@7.3.8` (installed). Never add a package; if you think one is needed, report NEEDS_CONTEXT.
- Tests: `node --test <file>` (node:test + node:assert/strict). Full suite: `npm test`.
- Project rules: D:\etf_landing_page\CLAUDE.md (read "Data rules", "Copy & design rules", and "Overrides" in the Plugins table). Never type a data number by hand: figures come from data/*.json.
- Write long Czech text with your file Write/Edit tools, not shell heredocs.

## Context and controller rulings

- **Invoke the `frontend-design:frontend-design` skill (Skill tool) before writing any markup or CSS.** Its guidance applies within the fixed visual direction of docs/decisions.md §10 (read §10 fully, incl. the "Avoided on purpose" list) and CLAUDE.md "Copy & design rules". The page must not look like default AI output.
- Copy source: content/page.md, **verbatim** (sections 0–9). `*Poznámka:*` lines are build notes, never page text. `[DOPLNIT …]` placeholders stay visible (style them as an obvious placeholder, e.g. a dotted-underlined muted span) — they are listed in the README later. `[CHYBÍ ZDROJ]` must not appear (there are none left; grep to confirm). `[Jak počítáme]`, `[Zásady ochrany osobních údajů]`, `[Zdroje dat]`, `[Najít své dvojče]`, `[změnit]` are links/buttons, not literal bracket text.
- Already built (use, don't redefine):
  - `src/layouts/Base.astro` (props `title, description, noindex?, ogTitle?, ogDescription?`), `src/styles/global.css` (tokens `--paper --ink --muted --blocked --allowed --marker --font`; `.num` tabular; `.ticker` uses the "Archivo Wide" face which only has A–Z0–9 — use `.ticker` only on uppercase tickers; `html.js .no-js{display:none}`, `html:not(.js) .needs-js{display:none}`, `[data-variant] .only-a/.only-b`; `<html data-variant="a">` default).
  - `src/lib/data.ts`: `US`, `UCITS`, `US_TICKERS`, `byIsin`, `DATA_DATE`, `FX`, `BANKS`, `BROKERS`, `fmtPct`, `fmtCzk`, `fmtDate`, `fmtNum`, `xetraTicker`, `usdLondonTicker`.
  - `src/lib/plan.ts`: `buildPlan(sel, fx)` → groups with sorted twins (decisions §15 #6) — use it for the no-JS table (`buildPlan(parseSelection(new URLSearchParams('t=VOO,SPY,IVV,QQQ'), US_TICKERS), FX)`) so the order rule lives in one place.
  - `src/lib/fees.ts`: `compare`, `roundK`; `src/lib/selection.ts`: `RANGES`.
- Every `{…}` from page.md is computed at build time from these modules: counts ({6}/{3}/{2}/{7}), TER ranges (FAQ "{0,03–0,07 %}", VOO "{0,03 %}"), dates ("stav k …", "Data k {9. 10. 2026}" = `DATA_DATE`, VGLA inception), the hero B / Step B default numbers (`compare` with RANGES defaults, brokerId 'unknown', the S&P 500 max TER) — these default numbers are also the no-JS-visible values in hero B's static markup, and Task 10 updates them live. Fixed source lines in page.md that already contain dates (§3 facts, FAQ sources, KID dates of the bank funds) are approved copy and stay as written — but the bank KID dates and broker price-list dates should be rendered from `BANKS[].kid_date` / `BROKERS[].as_of` where page.md wraps them in `{…}`.
- **Controller ruling D (section order inside the first screen):** `Hero.astro` renders headline + sub only (both 1A and 1B texts, `.only-a` / `.only-b`). `Tool.astro` follows immediately and renders the trust line right after the entry step's controls: after the Step A chips for variant a, after the Step B result line for variant b (use `.only-a` / `.only-b` on two copies of the trust line).
- **Controller ruling E (split with Task 10):** this task renders the tool's complete **static skeleton** in `Tool.astro` (class `needs-js`): Step A heading/label/helper + 8 chip `<button type="button" aria-pressed="false" data-ticker="…">` (VOO SPY IVV VTI QQQ VT SCHD + "Jiné" with `data-ticker="other"`), an empty `<div data-twins aria-live="polite">`, the "Pokračovat na poplatky" button; Step B with three `<input type="range">` (min/max/step/value from `RANGES`) each with a `<label>` and `<output>`, the return note + UBS source + past-performance line, the broker radio group (XTB · Trading 212 · Fio · Česká spořitelna · Nevím, default Nevím, values = broker ids incl. `unknown`) with its helper, an empty `<p data-broker-note>`, the result line markup with default numbers, the source line, a `<details>` "Jak počítáme" with the page.md text; Step C radio group (acc / dist / both, default both) + helper + source line; the Result block container (`data-result`, square corners, 2 px ink rule) containing an empty `data-result-body` and the inline `LeadForm location="inline"`; the sticky bar markup (`data-sticky`, `hidden`). Use stable `data-*` hooks and ids; document them in a short comment at the top of Tool.astro for Task 10. **No client script in this task** — Task 10 writes `src/scripts/tool.ts`. Variant b: Step A shown collapsed is Task 10's job; just render both steps.
- `LeadForm.astro` per the brief (props `location`, `heading`, `body`). Hidden inputs `t m y r b d` get the defaults from `RANGES` (t empty), plus `utm_source utm_medium utm_campaign utm_content utm_term` empty. Honeypot exactly as the brief shows. Status `<p role="status" aria-live="polite">`. Checkbox label "Chci občas dostat novinky o ETF (nepovinné)". Microcopy line with the privacy link. Tap targets ≥ 44 px. Visible focus styles.
- Final form (page.md §7) uses LeadForm `location="footer"`; works without JS as a plain POST (`action="/api/lead"`, `method="post"`); the API answers 303 → `/dekujeme/` or `/chyba-formulare/` (built in Task 8).
- Section 4 image: `<img src="/plan-preview.png" width="…" height="…" loading="lazy" alt="…">` — the file doesn't exist yet (Task 13). Pick width/height 600×800 placeholder dimensions and say so in a comment; alt text describes the e-mail.
- "Zdroje dat" link: GitHub `https://github.com/bourama1/etf_landing_page/blob/master/data/sources.md` (the repo is the project's public home; keep it a single constant).
- **Privacy page** `/ochrana-osobnich-udaju/`: write it from data/sources.md §9 (legal bases: plan e-mail art. 6(1)(b); selections + UTM + ad variant art. 6(1)(f) — name the legitimate interest; newsletter consent art. 6(1)(a) + § 7(2) zákona 480/2004 Sb.), art. 13 contents (controller `[DOPLNIT: jméno, IČO, sídlo, e-mail]`, purposes, bases, recipients/processors: Brevo (e-mail delivery and contact storage) and Vercel (hosting, server logs) with `[DOPLNIT: ověřit místo zpracování a předávání mimo EU]`, retention as proposed in §9.2 point 5 but marked `[DOPLNIT: potvrdit lhůty]`, rights incl. access/rectification/erasure/restriction/portability/objection (art. 21 — the objection to the (f) processing explicitly and separately), withdrawal of consent, complaint to ÚOOÚ (uoou.gov.cz), no automated decision-making or profiling, providing the e-mail is voluntary but needed to send the plan). No analytics paragraph yet (Phase 4 adds it). Czech, vykání, plain language, short paragraphs. Cite articles. `noindex` is not needed for this page.
- `/dekujeme/` and `/chyba-formulare/`: `noindex`; copy from page.md §8 (heading without the address: "Hotovo. Plán je na cestě." + the spam hint + a link back to the home page) and the Invalid e-mail state text + the footer form again.
- Accessibility: one `<h1>` (the hero headline; with two variants, both are `<h1>` but only one is displayed — acceptable since the other is display:none; or use one h1 with two spans, your choice), logical heading order, AA contrast (check `--muted` on `--paper` and `--paper` on `--blocked`/`--allowed` if used as backgrounds), labels on every input, `lang="cs"`.
- Responsive: single column, 16 px gutter on mobile, ~36rem centred on desktop. First screen (390×844, ~700 px usable in the Instagram in-app browser): headline ≤ 3 lines, sub ≤ 2 lines, then the interactive element, then the trust line. Keep the hero compact — no illustration.
- Verification (brief Step 4): `npx astro build` (not `npm run build`; it works too, prebuild just refreshes data/fx.json — if fx.json changes, don't commit that change); grep `dist/index.html` for leftover `{` placeholders, `[CHYBÍ`, `undefined`, `NaN`. Check JS-off behaviour by reading the built HTML (the tool is `needs-js`, the table `no-js`). Report the size of dist/index.html (raw and gzip).
- Commit in 3–4 logical commits as the brief suggests.

## Before You Begin

If anything in the requirements or approach is unclear, ask now (status NEEDS_CONTEXT) instead of guessing.

## Your Job

1. Implement exactly what the task specifies (TDD where the brief says: show the RED failure before implementing)
2. Verify it works; run the full suite once before committing
3. Commit (small commits, one logical change each)
4. Self-review your diff: completeness, minimalism (no unrequested abstraction or options), tests verify behaviour
5. Report back

Keep it minimal. Never remove or weaken: a11y attributes, consent/GDPR text, the honeypot, server-side validation, source/date labels. No analytics code.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent or a reviewer — review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics. Bad work is worse than no work.

## After Review Findings

If resumed with findings: fix them, re-run the covering tests, append a fix report (changes, command, output) to your report file, reply with the short contract.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-9-report.md: what you implemented; TDD evidence (RED: command + failing output; GREEN: command + passing output) where TDD applies; other verification with command output; files changed; self-review findings; concerns.

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 9 reviewer (model: opus)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-9-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- **Invoke the `frontend-design:frontend-design` skill (Skill tool) before writing any markup or CSS.** Its guidance applies within the fixed visual direction of docs/decisions.md §10 (read §10 fully, incl. the "Avoided on purpose" list) and CLAUDE.md "Copy & design rules". The page must not look like default AI output.
- Copy source: content/page.md, **verbatim** (sections 0–9). `*Poznámka:*` lines are build notes, never page text. `[DOPLNIT …]` placeholders stay visible (style them as an obvious placeholder, e.g. a dotted-underlined muted span) — they are listed in the README later. `[CHYBÍ ZDROJ]` must not appear (there are none left; grep to confirm). `[Jak počítáme]`, `[Zásady ochrany osobních údajů]`, `[Zdroje dat]`, `[Najít své dvojče]`, `[změnit]` are links/buttons, not literal bracket text.
- Already built (use, don't redefine):
  - `src/layouts/Base.astro` (props `title, description, noindex?, ogTitle?, ogDescription?`), `src/styles/global.css` (tokens `--paper --ink --muted --blocked --allowed --marker --font`; `.num` tabular; `.ticker` uses the "Archivo Wide" face which only has A–Z0–9 — use `.ticker` only on uppercase tickers; `html.js .no-js{display:none}`, `html:not(.js) .needs-js{display:none}`, `[data-variant] .only-a/.only-b`; `<html data-variant="a">` default).
  - `src/lib/data.ts`: `US`, `UCITS`, `US_TICKERS`, `byIsin`, `DATA_DATE`, `FX`, `BANKS`, `BROKERS`, `fmtPct`, `fmtCzk`, `fmtDate`, `fmtNum`, `xetraTicker`, `usdLondonTicker`.
  - `src/lib/plan.ts`: `buildPlan(sel, fx)` → groups with sorted twins (decisions §15 #6) — use it for the no-JS table (`buildPlan(parseSelection(new URLSearchParams('t=VOO,SPY,IVV,QQQ'), US_TICKERS), FX)`) so the order rule lives in one place.
  - `src/lib/fees.ts`: `compare`, `roundK`; `src/lib/selection.ts`: `RANGES`.
- Every `{…}` from page.md is computed at build time from these modules: counts ({6}/{3}/{2}/{7}), TER ranges (FAQ "{0,03–0,07 %}", VOO "{0,03 %}"), dates ("stav k …", "Data k {9. 10. 2026}" = `DATA_DATE`, VGLA inception), the hero B / Step B default numbers (`compare` with RANGES defaults, brokerId 'unknown', the S&P 500 max TER) — these default numbers are also the no-JS-visible values in hero B's static markup, and Task 10 updates them live. Fixed source lines in page.md that already contain dates (§3 facts, FAQ sources, KID dates of the bank funds) are approved copy and stay as written — but the bank KID dates and broker price-list dates should be rendered from `BANKS[].kid_date` / `BROKERS[].as_of` where page.md wraps them in `{…}`.
- **Controller ruling D (section order inside the first screen):** `Hero.astro` renders headline + sub only (both 1A and 1B texts, `.only-a` / `.only-b`). `Tool.astro` follows immediately and renders the trust line right after the entry step's controls: after the Step A chips for variant a, after the Step B result line for variant b (use `.only-a` / `.only-b` on two copies of the trust line).
- **Controller ruling E (split with Task 10):** this task renders the tool's complete **static skeleton** in `Tool.astro` (class `needs-js`): Step A heading/label/helper + 8 chip `<button type="button" aria-pressed="false" data-ticker="…">` (VOO SPY IVV VTI QQQ VT SCHD + "Jiné" with `data-ticker="other"`), an empty `<div data-twins aria-live="polite">`, the "Pokračovat na poplatky" button; Step B with three `<input type="range">` (min/max/step/value from `RANGES`) each with a `<label>` and `<output>`, the return note + UBS source + past-performance line, the broker radio group (XTB · Trading 212 · Fio · Česká spořitelna · Nevím, default Nevím, values = broker ids incl. `unknown`) with its helper, an empty `<p data-broker-note>`, the result line markup with default numbers, the source line, a `<details>` "Jak počítáme" with the page.md text; Step C radio group (acc / dist / both, default both) + helper + source line; the Result block container (`data-result`, square corners, 2 px ink rule) containing an empty `data-result-body` and the inline `LeadForm location="inline"`; the sticky bar markup (`data-sticky`, `hidden`). Use stable `data-*` hooks and ids; document them in a short comment at the top of Tool.astro for Task 10. **No client script in this task** — Task 10 writes `src/scripts/tool.ts`. Variant b: Step A shown collapsed is Task 10's job; just render both steps.
- `LeadForm.astro` per the brief (props `location`, `heading`, `body`). Hidden inputs `t m y r b d` get the defaults from `RANGES` (t empty), plus `utm_source utm_medium utm_campaign utm_content utm_term` empty. Honeypot exactly as the brief shows. Status `<p role="status" aria-live="polite">`. Checkbox label "Chci občas dostat novinky o ETF (nepovinné)". Microcopy line with the privacy link. Tap targets ≥ 44 px. Visible focus styles.
- Final form (page.md §7) uses LeadForm `location="footer"`; works without JS as a plain POST (`action="/api/lead"`, `method="post"`); the API answers 303 → `/dekujeme/` or `/chyba-formulare/` (built in Task 8).
- Section 4 image: `<img src="/plan-preview.png" width="…" height="…" loading="lazy" alt="…">` — the file doesn't exist yet (Task 13). Pick width/height 600×800 placeholder dimensions and say so in a comment; alt text describes the e-mail.
- "Zdroje dat" link: GitHub `https://github.com/bourama1/etf_landing_page/blob/master/data/sources.md` (the repo is the project's public home; keep it a single constant).
- **Privacy page** `/ochrana-osobnich-udaju/`: write it from data/sources.md §9 (legal bases: plan e-mail art. 6(1)(b); selections + UTM + ad variant art. 6(1)(f) — name the legitimate interest; newsletter consent art. 6(1)(a) + § 7(2) zákona 480/2004 Sb.), art. 13 contents (controller `[DOPLNIT: jméno, IČO, sídlo, e-mail]`, purposes, bases, recipients/processors: Brevo (e-mail delivery and contact storage) and Vercel (hosting, server logs) with `[DOPLNIT: ověřit místo zpracování a předávání mimo EU]`, retention as proposed in §9.2 point 5 but marked `[DOPLNIT: potvrdit lhůty]`, rights incl. access/rectification/erasure/restriction/portability/objection (art. 21 — the objection to the (f) processing explicitly and separately), withdrawal of consent, complaint to ÚOOÚ (uoou.gov.cz), no automated decision-making or profiling, providing the e-mail is voluntary but needed to send the plan). No analytics paragraph yet (Phase 4 adds it). Czech, vykání, plain language, short paragraphs. Cite articles. `noindex` is not needed for this page.
- `/dekujeme/` and `/chyba-formulare/`: `noindex`; copy from page.md §8 (heading without the address: "Hotovo. Plán je na cestě." + the spam hint + a link back to the home page) and the Invalid e-mail state text + the footer form again.
- Accessibility: one `<h1>` (the hero headline; with two variants, both are `<h1>` but only one is displayed — acceptable since the other is display:none; or use one h1 with two spans, your choice), logical heading order, AA contrast (check `--muted` on `--paper` and `--paper` on `--blocked`/`--allowed` if used as backgrounds), labels on every input, `lang="cs"`.
- Responsive: single column, 16 px gutter on mobile, ~36rem centred on desktop. First screen (390×844, ~700 px usable in the Instagram in-app browser): headline ≤ 3 lines, sub ≤ 2 lines, then the interactive element, then the trust line. Keep the hero compact — no illustration.
- Verification (brief Step 4): `npx astro build` (not `npm run build`; it works too, prebuild just refreshes data/fx.json — if fx.json changes, don't commit that change); grep `dist/index.html` for leftover `{` placeholders, `[CHYBÍ`, `undefined`, `NaN`. Check JS-off behaviour by reading the built HTML (the tool is `needs-js`, the table `no-js`). Report the size of dist/index.html (raw and gzip).
- Commit in 3–4 logical commits as the brief suggests.

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-9-report.md

## Diff Under Review

**Base:** 9d731cf
**Head:** 846d762
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-9d731cf..846d762.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 9d731cf..846d762` and `git diff 9d731cf..846d762`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 9 fix round 1 (model: opus)</summary>

````text
Fix round 1 for Task 9. Fix these, re-run the covering tests (`node --test api/lead.test.ts src/lib/data.test.ts src/lib/email.test.ts`), then `npm test` and `npx astro build` (grep dist again for `{`, `[CHYB`, `undefined`, `NaN`), append a fix report to task-9-report.md with the raw output, reply with the short contract.

1. (Important) **No-JS failures all say "e-mail looks wrong".** Add a static page `src/pages/chyba-odeslani.astro` (`noindex`) with page.md's Server-error copy ("Plán se nepodařilo odeslat. Zkuste to prosím za chvíli znovu.") and the footer form again, laid out like `/chyba-formulare/`. In `api/lead.ts`, 303-redirect `empty`/`invalid` to `/chyba-formulare/` and every other failure (server, 413, malformed body) to `/chyba-odeslani/`. Update/add the tests in api/lead.test.ts (`down` → `/chyba-odeslani/`, invalid e-mail → `/chyba-formulare/`). Page title: "Plán se nepodařilo odeslat | ETF Dvojče".
2. (Controller ruling) **TER always with two decimals**, as page.md writes it ("0,30 %", "0,07 %", "0,03 %"): add `fmtTer` in src/lib/data.ts (`minimumFractionDigits: 2, maximumFractionDigits: 4`, nbsp + %), test it (`0.3 → "0,30 %"`, `0.07 → "0,07 %"`, `0.0945 → "0,0945 %"`), and use it for every TER on the page (no-JS table, FAQ range "0,03–0,07 %", VOO "0,03 %", default result source line) and in src/lib/email.ts wherever a TER is rendered. Other percentages keep `fmtPct`.
3. (Minor, do it) **Bank ranges over one fund list:** the entry-fee range in Tool.astro must use the same `ongoing_pct != null` funds as the calculator (`kidBanks`), not all of BANKS.
4. (Minor, do it) **Broker label maps:** fall back to `b.name` when an id is missing from `brokerShort` (or the other map), so a new broker can never render "undefined".
5. (Minor, do it) data.ts `fmtDate =(iso` formatting slip; keep the formatter exports grouped together.
6. (Minor, do it) The privacy page's objection box must not reuse the tool's `.result` class: give it its own small class (e.g. `.box`) in global.css.

Leave for Task 10 (do not do now): aria-live on the result body, opening "Jak počítáme" on link click. Leave for Task 13: /plan-preview.png.
Commit as `fix: server-error page for no-JS form, two-decimal TER, consistent bank ranges` (or 2 commits: API+page, formatting/minors).
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 9 re-review round 1 (model: sonnet)</summary>

````text
You are re-reviewing one task's fix round. A previous review produced
findings; an implementer has attempted to fix them. Your job is to
verdict each finding and inspect the fix diff — nothing else.

## The Task

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-9-brief.md

## The Findings Under Verification

Fix round 1 for Task 9. Fix these, re-run the covering tests (`node --test api/lead.test.ts src/lib/data.test.ts src/lib/email.test.ts`), then `npm test` and `npx astro build` (grep dist again for `{`, `[CHYB`, `undefined`, `NaN`), append a fix report to task-9-report.md with the raw output, reply with the short contract.

1. (Important) **No-JS failures all say "e-mail looks wrong".** Add a static page `src/pages/chyba-odeslani.astro` (`noindex`) with page.md's Server-error copy ("Plán se nepodařilo odeslat. Zkuste to prosím za chvíli znovu.") and the footer form again, laid out like `/chyba-formulare/`. In `api/lead.ts`, 303-redirect `empty`/`invalid` to `/chyba-formulare/` and every other failure (server, 413, malformed body) to `/chyba-odeslani/`. Update/add the tests in api/lead.test.ts (`down` → `/chyba-odeslani/`, invalid e-mail → `/chyba-formulare/`). Page title: "Plán se nepodařilo odeslat | ETF Dvojče".
2. (Controller ruling) **TER always with two decimals**, as page.md writes it ("0,30 %", "0,07 %", "0,03 %"): add `fmtTer` in src/lib/data.ts (`minimumFractionDigits: 2, maximumFractionDigits: 4`, nbsp + %), test it (`0.3 → "0,30 %"`, `0.07 → "0,07 %"`, `0.0945 → "0,0945 %"`), and use it for every TER on the page (no-JS table, FAQ range "0,03–0,07 %", VOO "0,03 %", default result source line) and in src/lib/email.ts wherever a TER is rendered. Other percentages keep `fmtPct`.
3. (Minor, do it) **Bank ranges over one fund list:** the entry-fee range in Tool.astro must use the same `ongoing_pct != null` funds as the calculator (`kidBanks`), not all of BANKS.
4. (Minor, do it) **Broker label maps:** fall back to `b.name` when an id is missing from `brokerShort` (or the other map), so a new broker can never render "undefined".
5. (Minor, do it) data.ts `fmtDate =(iso` formatting slip; keep the formatter exports grouped together.
6. (Minor, do it) The privacy page's objection box must not reuse the tool's `.result` class: give it its own small class (e.g. `.box`) in global.css.

Leave for Task 10 (do not do now): aria-live on the result body, opening "Jak počítáme" on link click. Leave for Task 13: /plan-preview.png.
Commit as `fix: server-error page for no-JS form, two-decimal TER, consistent bank ranges` (or 2 commits: API+page, formatting/minors).

## The Fix

Read the implementer's report (fix reports are appended at the end):
D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-9-report.md

**Fix base:** 846d762 (the head the previous review saw)
**Head:** 2fbd870
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-846d762..2fbd870.diff

Read the diff file once — it contains the fix commits, a stat summary,
and the fix diff with surrounding context. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 846d762..2fbd870` and
`git diff 846d762..2fbd870`.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Scope

Your scope is the findings list and the fix diff. Verdict every finding.
Inspect the fix diff for new problems the fix itself introduced. Do NOT
re-review code the fix did not touch: if you notice an issue entirely
outside the fix diff, report it under Out-of-Scope Observations — it
does not block this task and does not extend the loop. A broad
whole-branch review happens after all tasks are complete.

## Tests

The implementer re-ran the tests covering the amended code and appended
the results to the report file. Treat the report as unverified claims:
confirm the fix report names the covering tests and shows their output,
and verify the claims against the diff. Do not re-run the suite to
confirm their report. Run a test only when reading the code raises a
specific doubt that no existing run answers — and then a focused test,
never a package-wide suite.

## Output Format

Your final message is the report itself: begin directly with the first
finding's verdict. Every line is a verdict, a finding with file:line,
or a check you ran — no preamble, no process narration.

### Finding Verdicts

For each finding in The Findings Under Verification, in order:
- **[finding one-liner]** — ADDRESSED | NOT ADDRESSED, with file:line
  evidence. "Attempted" is not addressed: the specific defect must no
  longer exist.

### New Breakage in the Fix Diff

Anything the fix itself broke or introduced, with severity
(Critical/Important/Minor) and file:line. "None" if clean.

### Out-of-Scope Observations

Issues you noticed entirely outside the fix diff. Non-blocking; the
controller ledgers these for the final review. "None" if none.

### Verdict

**Fix round:** [All findings addressed, no new Critical/Important
breakage | Findings remain open] — list the open ones.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 10 implementer (tool island) (model: opus)</summary>

````text
You are implementing Task 10: Tool island — steps A/B/C, result, animation, ad entry — part of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page that compares US ETFs with their European UCITS equivalents (Astro static site + one vanilla-TS island + one Vercel function).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-10-brief.md
It is your requirements, with the exact values to use verbatim.

## Environment

- Repo D:\etf_landing_page, Windows 11, Git Bash + PowerShell, Node v26 (runs .ts files natively via type stripping: use only erasable TS syntax — no enums, namespaces, parameter properties), npm 11. NO Python: never run `python`.
- Branch `master`; commit directly to it. Commit messages in English, conventional prefix, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Only dependency allowed: `astro@7.3.8` (installed). Never add a package; if you think one is needed, report NEEDS_CONTEXT.
- Tests: `node --test <file>` (node:test + node:assert/strict). Full suite: `npm test`.
- Project rules: D:\etf_landing_page\CLAUDE.md (read "Data rules", "Copy & design rules", and "Overrides" in the Plugins table). Never type a data number by hand: figures come from data/*.json.
- Write long Czech text with your file Write/Edit tools, not shell heredocs.

## Context and controller rulings

- **Controller ruling E:** `src/components/Tool.astro` already renders the complete static skeleton (controls, labels, default numbers, empty `data-twins` / `data-result-body` / `data-broker-note` containers, the inline LeadForm, the hidden sticky bar). Its top-of-file comment documents the `data-*` hooks — read it first and use those hooks. This task adds behaviour (`src/scripts/tool.ts`, imported by a `<script>` in Tool.astro) and only the minimal markup/CSS changes the behaviour needs (e.g. animation classes). Do not restyle the page.
- **Controller ruling C:** there is **no** `<script type="application/json" id="tool-data">` element. The island imports `src/lib/plan.ts`, `fees.ts`, `selection.ts`, `data.ts` directly; Vite bundles the data JSON (~6.4 kB gz). Ignore the brief's tool-data instruction.
- Logic to reuse (never reimplement): `buildPlan(sel, FX)` (groups, twins in display order, special cases via `kind` = `same`/`nearest`/`none`, `similar`, `fees.terPct/terTicker`), `compare(inp, ctx)` (live fee numbers; `fixedFeePct` for the fixed-fee note), `roundK`, formatters `fmtCzk`, `fmtCzkRange` (if present), `fmtTer` (TER, 2 decimals — added in Task 9's fix), `fmtPct`, `fmtDate`, `xetraTicker`; `RANGES`, `toParams`, `parseSelection`.
- Copy: page.md §2 (Step A after-tap texts, the per-group headers with counts, VTI/SCHD/Jiné texts, KID label only where `kidCs` is true with a link to the KID url, ticker note "Na každé burze má fond jiný ticker…", "Pořadí není doporučení."; Step B broker notes incl. the default "Nevím" note "počítáme s nejvyšší zveřejněnou přirážkou za směnu, {0,5 %}"; the fixed-fee note with the ČNB rate label "Přepočet kurzem ČNB k {validFor}, broker může použít jiný."; the Result block texts; the sticky bar "~~{VOO}~~ → {3} dvojčata · [Poslat plán e-mailem]"). Verbatim. Build every text node with `createElement` + `textContent` (no innerHTML).
- Deferred from the Task 9 review (do them here): (a) put `aria-live="polite"` on the result body (or move focus to the result heading when it first appears) — the global constraint requires a live result; (b) the "Jak počítáme" link (`href="#jak-pocitame"`) must open its `<details>` when clicked.
- Hidden form fields: keep `t m y r b d` of **every** `.lead-form` in sync with the current selection (use `toParams` values) on every change. Leave `utm_*` to Task 11.
- Event: dispatch `window.dispatchEvent(new CustomEvent('tool:result', { detail: sel }))` whenever the result is (re)rendered with at least one pick; Task 11 listens to it (sticky bar visibility, final-form heading).
- Ad entry (decisions §4, page.md §2 note): `document.documentElement.dataset.variant === 'b'` → VOO preselected, Step A collapsed to "Vybráno: VOO · změnit" (a button that re-expands Step A), Step B open and focused-visible in the first screen; otherwise Step A open. The variant was set by the head script before paint, so read it from `dataset`, not the URL.
- "Jiné" chip: shows the page.md "Jiné" text only; it is not a ticker and never goes into `t`.
- Slider updates: update `<output>` and the result numbers on `input` throttled with `requestAnimationFrame`; the `aria-live` region updates on `change` only (avoid screen-reader spam while dragging).
- Animation (decisions §10 + brief Step 6): strike-through draws on the US ticker then the twin rows slide/fade in (staggered, max 6), only on user-triggered chip activation, never on load for the preselected VOO. `@media (prefers-reduced-motion: reduce)` → no animation. CSS-only transitions/keyframes triggered by a class.
- Budget: the island + bundled data must stay well under 60 kB gz. After building, report the gzip size of every JS file referenced by dist/index.html.
- Manual verification (no browser on this machine): `npx astro build`, then confirm by reading dist that the script tag is emitted, and run a quick DOM-free sanity check of the pure functions you call if you added any helper with logic. If you add a non-trivial pure helper (e.g. text-building for a group), add a small node test for it. Report clearly what you could not verify without a browser — the controller will do the visual check.

## Before You Begin

If anything in the requirements or approach is unclear, ask now (status NEEDS_CONTEXT) instead of guessing.

## Your Job

1. Implement exactly what the task specifies (TDD where the brief says: show the RED failure before implementing)
2. Verify it works; run the full suite once before committing
3. Commit (small commits, one logical change each)
4. Self-review your diff: completeness, minimalism (no unrequested abstraction or options), tests verify behaviour
5. Report back

Keep it minimal. Never remove or weaken: a11y attributes, consent/GDPR text, the honeypot, server-side validation, source/date labels. No analytics code.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent or a reviewer — review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics. Bad work is worse than no work.

## After Review Findings

If resumed with findings: fix them, re-run the covering tests, append a fix report (changes, command, output) to your report file, reply with the short contract.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-10-report.md: what you implemented; TDD evidence (RED: command + failing output; GREEN: command + passing output) where TDD applies; other verification with command output; files changed; self-review findings; concerns.

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 10 reviewer (model: opus)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-10-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- **Controller ruling E:** `src/components/Tool.astro` already renders the complete static skeleton (controls, labels, default numbers, empty `data-twins` / `data-result-body` / `data-broker-note` containers, the inline LeadForm, the hidden sticky bar). Its top-of-file comment documents the `data-*` hooks — read it first and use those hooks. This task adds behaviour (`src/scripts/tool.ts`, imported by a `<script>` in Tool.astro) and only the minimal markup/CSS changes the behaviour needs (e.g. animation classes). Do not restyle the page.
- **Controller ruling C:** there is **no** `<script type="application/json" id="tool-data">` element. The island imports `src/lib/plan.ts`, `fees.ts`, `selection.ts`, `data.ts` directly; Vite bundles the data JSON (~6.4 kB gz). Ignore the brief's tool-data instruction.
- Logic to reuse (never reimplement): `buildPlan(sel, FX)` (groups, twins in display order, special cases via `kind` = `same`/`nearest`/`none`, `similar`, `fees.terPct/terTicker`), `compare(inp, ctx)` (live fee numbers; `fixedFeePct` for the fixed-fee note), `roundK`, formatters `fmtCzk`, `fmtCzkRange` (if present), `fmtTer` (TER, 2 decimals — added in Task 9's fix), `fmtPct`, `fmtDate`, `xetraTicker`; `RANGES`, `toParams`, `parseSelection`.
- Copy: page.md §2 (Step A after-tap texts, the per-group headers with counts, VTI/SCHD/Jiné texts, KID label only where `kidCs` is true with a link to the KID url, ticker note "Na každé burze má fond jiný ticker…", "Pořadí není doporučení."; Step B broker notes incl. the default "Nevím" note "počítáme s nejvyšší zveřejněnou přirážkou za směnu, {0,5 %}"; the fixed-fee note with the ČNB rate label "Přepočet kurzem ČNB k {validFor}, broker může použít jiný."; the Result block texts; the sticky bar "~~{VOO}~~ → {3} dvojčata · [Poslat plán e-mailem]"). Verbatim. Build every text node with `createElement` + `textContent` (no innerHTML).
- Deferred from the Task 9 review (do them here): (a) put `aria-live="polite"` on the result body (or move focus to the result heading when it first appears) — the global constraint requires a live result; (b) the "Jak počítáme" link (`href="#jak-pocitame"`) must open its `<details>` when clicked.
- Hidden form fields: keep `t m y r b d` of **every** `.lead-form` in sync with the current selection (use `toParams` values) on every change. Leave `utm_*` to Task 11.
- Event: dispatch `window.dispatchEvent(new CustomEvent('tool:result', { detail: sel }))` whenever the result is (re)rendered with at least one pick; Task 11 listens to it (sticky bar visibility, final-form heading).
- Ad entry (decisions §4, page.md §2 note): `document.documentElement.dataset.variant === 'b'` → VOO preselected, Step A collapsed to "Vybráno: VOO · změnit" (a button that re-expands Step A), Step B open and focused-visible in the first screen; otherwise Step A open. The variant was set by the head script before paint, so read it from `dataset`, not the URL.
- "Jiné" chip: shows the page.md "Jiné" text only; it is not a ticker and never goes into `t`.
- Slider updates: update `<output>` and the result numbers on `input` throttled with `requestAnimationFrame`; the `aria-live` region updates on `change` only (avoid screen-reader spam while dragging).
- Animation (decisions §10 + brief Step 6): strike-through draws on the US ticker then the twin rows slide/fade in (staggered, max 6), only on user-triggered chip activation, never on load for the preselected VOO. `@media (prefers-reduced-motion: reduce)` → no animation. CSS-only transitions/keyframes triggered by a class.
- Budget: the island + bundled data must stay well under 60 kB gz. After building, report the gzip size of every JS file referenced by dist/index.html.
- Manual verification (no browser on this machine): `npx astro build`, then confirm by reading dist that the script tag is emitted, and run a quick DOM-free sanity check of the pure functions you call if you added any helper with logic. If you add a non-trivial pure helper (e.g. text-building for a group), add a small node test for it. Report clearly what you could not verify without a browser — the controller will do the visual check.
- The " · " separators in twin rows come from page.md (approved copy), which outranks the decisions §10 style note on middot meta strings.
- No browser exists on this machine; visual/interaction checks happen at the controller checkpoint. Review the code paths for them instead.

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-10-report.md

## Diff Under Review

**Base:** 2fbd870
**Head:** 5fd779c
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-2fbd870..5fd779c.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 2fbd870..5fd779c` and `git diff 2fbd870..5fd779c`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 11 implementer (forms, thank-you) (model: sonnet)</summary>

````text
You are implementing Task 11: Forms, sticky bar, thank-you state — part of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page that compares US ETFs with their European UCITS equivalents (Astro static site + one vanilla-TS island + one Vercel function).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-11-brief.md
It is your requirements, with the exact values to use verbatim.

## Environment

- Repo D:\etf_landing_page, Windows 11, Git Bash + PowerShell, Node v26 (runs .ts files natively via type stripping: use only erasable TS syntax — no enums, namespaces, parameter properties), npm 11. NO Python: never run `python`.
- Branch `master`; commit directly to it. Commit messages in English, conventional prefix, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Only dependency allowed: `astro@7.3.8` (installed). Never add a package; if you think one is needed, report NEEDS_CONTEXT.
- Tests: `node --test <file>` (node:test + node:assert/strict). Full suite: `npm test`.
- Project rules: D:\etf_landing_page\CLAUDE.md (read "Data rules", "Copy & design rules", and "Overrides" in the Plugins table). Never type a data number by hand: figures come from data/*.json.
- Write long Czech text with your file Write/Edit tools, not shell heredocs.

## Context and controller rulings

- Already built: `src/components/LeadForm.astro` (`form.lead-form[data-location]` with id `lead-<location>`, fields `email`, `newsletter`, honeypot `fld_q8`, hidden `t m y r b d` (kept in sync by tool.ts) and `utm_source … utm_term` (empty — **this task fills them from `location.search`**), status `<p role="status" aria-live="polite">`); `src/components/Tool.astro` + `src/scripts/tool.ts` (read tool.ts first: it dispatches `window` `tool:result` with `detail: Selection` on **every** render incl. each slider frame and on load for ad B — your listener must be idempotent and cheap; it renders the sticky bar summary into `[data-sticky-summary]`; check what it already does with `[data-sticky]` and don't duplicate it); `/api/lead` returns JSON `{ok:true}` / `{ok:false, reason:'empty'|'invalid'|'server'}` with 200/400/413/502 when `accept: application/json`; a platform rate limit may return 429 with any body.
- Shared logic to reuse: `validateEmail` (selection.ts) for the client check, `buildPlan` + formatters (`fmtTer`, `fmtDate`, `xetraTicker`…) for the thank-you table. Read the Selection for the thank-you table from the submitted form's hidden fields via `parseSelection(new URLSearchParams(new FormData(form)), US_TICKERS)` so it always matches what the server got.
- Copy (verbatim): page.md §2 "States" (Sending/Empty/Invalid/Server error/Rate limit), §8 thank-you (heading "Hotovo. Plán je na cestě na {vas@email.cz}." with the address via textContent, body, "Překlep v adrese? [Zadat znovu]", "Celá tabulka pro váš výběr, i s ISIN.", the table columns, "Daňový checklist a postup nákupu najdete v e-mailu.", share line "Znáte někoho, kdo taky chtěl VOO? [Poslat odkaz]"), §7 final-form switch ("Poslat plán e-mailem" / "Pošleme vám plán pro {VOO, QQQ}."). Fallback form with no picks: the thank-you table shows the fallback plan (VOO, SPY, IVV), consistent with what the e-mail sends.
- "Odkaz zkopírován" (copy confirmation) is not in page.md: it is a controller-approved microcopy addition for the clipboard fallback; keep it exactly that.
- Share link: `location.origin + location.pathname + '?utm_source=share'` — no personal data, no selection params.
- Forms on the page: `#lead-inline` (inside the result block), `#lead-footer` (final form). The sticky bar is not a form (it scrolls to `#lead-inline` and focuses its e-mail field; it never opens a modal).
- Success state replaces the **submitted** form's block only; hide the sticky bar after any success. "Zadat znovu" restores that form (keep the typed address in the field) and moves focus to the e-mail input.
- Errors: set `aria-invalid="true"` + `aria-describedby` → the status `<p>` on the e-mail input for Empty/Invalid; clear on the next input. Button disabled + "Posíláme…" while sending; re-enabled on every failure. Timeout 10 s via `AbortSignal.timeout(10000)` → Server error copy.
- Analytics are Phase 4: no tracking calls; just keep handlers in one place so Phase 4 can hook in.
- Keep `forms.ts` small; reuse helpers from tool.ts only if tool.ts exports them already — do not refactor tool.ts. If a tiny DOM helper (`h()`) is needed in both, duplicating 5 lines is fine; note it in the report.
- Budget: after `astro build`, report the gzip size of every JS file referenced by dist/index.html (total must stay well under 60 kB).
- Manual verification without a browser: run `node scripts/dev.mjs` in the background, and use curl against :4321 to confirm the page and `/api/lead` still respond; read the built JS to confirm the fetch headers. Stop the server afterwards (confirm ports 4321/8787 free). Report what could not be verified without a browser.
- Deferred minor from Task 10 that touches your listener: `tool:result` fires every rAF frame — do not attach listeners or re-create DOM per event.

## Before You Begin

If anything in the requirements or approach is unclear, ask now (status NEEDS_CONTEXT) instead of guessing.

## Your Job

1. Implement exactly what the task specifies (TDD where the brief says: show the RED failure before implementing)
2. Verify it works; run the full suite once before committing
3. Commit (small commits, one logical change each)
4. Self-review your diff: completeness, minimalism (no unrequested abstraction or options), tests verify behaviour
5. Report back

Keep it minimal. Never remove or weaken: a11y attributes, consent/GDPR text, the honeypot, server-side validation, source/date labels. No analytics code.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent or a reviewer — review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics. Bad work is worse than no work.

## After Review Findings

If resumed with findings: fix them, re-run the covering tests, append a fix report (changes, command, output) to your report file, reply with the short contract.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-11-report.md: what you implemented; TDD evidence (RED: command + failing output; GREEN: command + passing output) where TDD applies; other verification with command output; files changed; self-review findings; concerns.

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 11 reviewer (model: sonnet)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-11-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- Already built: `src/components/LeadForm.astro` (`form.lead-form[data-location]` with id `lead-<location>`, fields `email`, `newsletter`, honeypot `fld_q8`, hidden `t m y r b d` (kept in sync by tool.ts) and `utm_source … utm_term` (empty — **this task fills them from `location.search`**), status `<p role="status" aria-live="polite">`); `src/components/Tool.astro` + `src/scripts/tool.ts` (read tool.ts first: it dispatches `window` `tool:result` with `detail: Selection` on **every** render incl. each slider frame and on load for ad B — your listener must be idempotent and cheap; it renders the sticky bar summary into `[data-sticky-summary]`; check what it already does with `[data-sticky]` and don't duplicate it); `/api/lead` returns JSON `{ok:true}` / `{ok:false, reason:'empty'|'invalid'|'server'}` with 200/400/413/502 when `accept: application/json`; a platform rate limit may return 429 with any body.
- Shared logic to reuse: `validateEmail` (selection.ts) for the client check, `buildPlan` + formatters (`fmtTer`, `fmtDate`, `xetraTicker`…) for the thank-you table. Read the Selection for the thank-you table from the submitted form's hidden fields via `parseSelection(new URLSearchParams(new FormData(form)), US_TICKERS)` so it always matches what the server got.
- Copy (verbatim): page.md §2 "States" (Sending/Empty/Invalid/Server error/Rate limit), §8 thank-you (heading "Hotovo. Plán je na cestě na {vas@email.cz}." with the address via textContent, body, "Překlep v adrese? [Zadat znovu]", "Celá tabulka pro váš výběr, i s ISIN.", the table columns, "Daňový checklist a postup nákupu najdete v e-mailu.", share line "Znáte někoho, kdo taky chtěl VOO? [Poslat odkaz]"), §7 final-form switch ("Poslat plán e-mailem" / "Pošleme vám plán pro {VOO, QQQ}."). Fallback form with no picks: the thank-you table shows the fallback plan (VOO, SPY, IVV), consistent with what the e-mail sends.
- "Odkaz zkopírován" (copy confirmation) is not in page.md: it is a controller-approved microcopy addition for the clipboard fallback; keep it exactly that.
- Share link: `location.origin + location.pathname + '?utm_source=share'` — no personal data, no selection params.
- Forms on the page: `#lead-inline` (inside the result block), `#lead-footer` (final form). The sticky bar is not a form (it scrolls to `#lead-inline` and focuses its e-mail field; it never opens a modal).
- Success state replaces the **submitted** form's block only; hide the sticky bar after any success. "Zadat znovu" restores that form (keep the typed address in the field) and moves focus to the e-mail input.
- Errors: set `aria-invalid="true"` + `aria-describedby` → the status `<p>` on the e-mail input for Empty/Invalid; clear on the next input. Button disabled + "Posíláme…" while sending; re-enabled on every failure. Timeout 10 s via `AbortSignal.timeout(10000)` → Server error copy.
- Analytics are Phase 4: no tracking calls; just keep handlers in one place so Phase 4 can hook in.
- Keep `forms.ts` small; reuse helpers from tool.ts only if tool.ts exports them already — do not refactor tool.ts. If a tiny DOM helper (`h()`) is needed in both, duplicating 5 lines is fine; note it in the report.
- Budget: after `astro build`, report the gzip size of every JS file referenced by dist/index.html (total must stay well under 60 kB).
- Manual verification without a browser: run `node scripts/dev.mjs` in the background, and use curl against :4321 to confirm the page and `/api/lead` still respond; read the built JS to confirm the fetch headers. Stop the server afterwards (confirm ports 4321/8787 free). Report what could not be verified without a browser.
- Deferred minor from Task 10 that touches your listener: `tool:result` fires every rAF frame — do not attach listeners or re-create DOM per event.

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-11-report.md

## Diff Under Review

**Base:** 5fd779c
**Head:** da7e7e0
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-5fd779c..da7e7e0.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 5fd779c..da7e7e0` and `git diff 5fd779c..da7e7e0`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 11 fix round 1 (model: sonnet)</summary>

````text
Fix round 1 for Task 11. Fix these, rebuild (`npx astro build`), run `npm test`, append a fix report to task-11-report.md, reply with the short contract.

1. (Important) **"Zadat znovu" restores a dead form:** after success the button stays disabled with "Posíláme…" and the status still says "Posíláme…". When restoring, re-enable the button, restore its label, and clear the status; focus the e-mail input (address kept).
2. (Minor, do it) `shareNote` live region: insert it empty together with the thank-you block (before any copy action), then set its text on copy, so "Odkaz zkopírován" is announced.
3. (Minor, do it) Replace `footH.nextElementSibling` with explicit `data-` hooks on the final form's heading and body in the markup (FinalForm/LeadForm, whichever renders them), and revert the footer heading/body to the page.md §7 default texts when the selection has no picks again.
4. (Check) Diff the thank-you texts and table column headers in forms.ts against content/page.md §8 character by character and fix any deviation; say in the report that you did.

Nothing else. Commit as `fix: usable form after "Zadat znovu", announced share note, explicit final-form hooks`.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 11 re-review round 1 (model: haiku)</summary>

````text
You are re-reviewing one task's fix round. A previous review produced
findings; an implementer has attempted to fix them. Your job is to
verdict each finding and inspect the fix diff — nothing else.

## The Task

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-11-brief.md

## The Findings Under Verification

Fix round 1 for Task 11. Fix these, rebuild (`npx astro build`), run `npm test`, append a fix report to task-11-report.md, reply with the short contract.

1. (Important) **"Zadat znovu" restores a dead form:** after success the button stays disabled with "Posíláme…" and the status still says "Posíláme…". When restoring, re-enable the button, restore its label, and clear the status; focus the e-mail input (address kept).
2. (Minor, do it) `shareNote` live region: insert it empty together with the thank-you block (before any copy action), then set its text on copy, so "Odkaz zkopírován" is announced.
3. (Minor, do it) Replace `footH.nextElementSibling` with explicit `data-` hooks on the final form's heading and body in the markup (FinalForm/LeadForm, whichever renders them), and revert the footer heading/body to the page.md §7 default texts when the selection has no picks again.
4. (Check) Diff the thank-you texts and table column headers in forms.ts against content/page.md §8 character by character and fix any deviation; say in the report that you did.

Nothing else. Commit as `fix: usable form after "Zadat znovu", announced share note, explicit final-form hooks`.

## The Fix

Read the implementer's report (fix reports are appended at the end):
D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-11-report.md

**Fix base:** da7e7e0 (the head the previous review saw)
**Head:** d97292f
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-da7e7e0..d97292f.diff

Read the diff file once — it contains the fix commits, a stat summary,
and the fix diff with surrounding context. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat da7e7e0..d97292f` and
`git diff da7e7e0..d97292f`.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Scope

Your scope is the findings list and the fix diff. Verdict every finding.
Inspect the fix diff for new problems the fix itself introduced. Do NOT
re-review code the fix did not touch: if you notice an issue entirely
outside the fix diff, report it under Out-of-Scope Observations — it
does not block this task and does not extend the loop. A broad
whole-branch review happens after all tasks are complete.

## Tests

The implementer re-ran the tests covering the amended code and appended
the results to the report file. Treat the report as unverified claims:
confirm the fix report names the covering tests and shows their output,
and verify the claims against the diff. Do not re-run the suite to
confirm their report. Run a test only when reading the code raises a
specific doubt that no existing run answers — and then a focused test,
never a package-wide suite.

## Output Format

Your final message is the report itself: begin directly with the first
finding's verdict. Every line is a verdict, a finding with file:line,
or a check you ran — no preamble, no process narration.

### Finding Verdicts

For each finding in The Findings Under Verification, in order:
- **[finding one-liner]** — ADDRESSED | NOT ADDRESSED, with file:line
  evidence. "Attempted" is not addressed: the specific defect must no
  longer exist.

### New Breakage in the Fix Diff

Anything the fix itself broke or introduced, with severity
(Critical/Important/Minor) and file:line. "None" if clean.

### Out-of-Scope Observations

Issues you noticed entirely outside the fix diff. Non-blocking; the
controller ledgers these for the final review. "None" if none.

### Verdict

**Fix round:** [All findings addressed, no new Critical/Important
breakage | Findings remain open] — list the open ones.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 12 implementer (/plan page) (model: sonnet)</summary>

````text
You are implementing Task 12: C:/Program Files/Git/plan page — part of Phase 3 (Build) of "ETF Dvojče", a Czech mobile-first lead-magnet landing page that compares US ETFs with their European UCITS equivalents (Astro static site + one vanilla-TS island + one Vercel function).

## Task Description

Read your task brief first: D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-12-brief.md
It is your requirements, with the exact values to use verbatim.

## Environment

- Repo D:\etf_landing_page, Windows 11, Git Bash + PowerShell, Node v26 (runs .ts files natively via type stripping: use only erasable TS syntax — no enums, namespaces, parameter properties), npm 11. NO Python: never run `python`.
- Branch `master`; commit directly to it. Commit messages in English, conventional prefix, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Only dependency allowed: `astro@7.3.8` (installed). Never add a package; if you think one is needed, report NEEDS_CONTEXT.
- Tests: `node --test <file>` (node:test + node:assert/strict). Full suite: `npm test`.
- Project rules: D:\etf_landing_page\CLAUDE.md (read "Data rules", "Copy & design rules", and "Overrides" in the Plugins table). Never type a data number by hand: figures come from data/*.json.
- Write long Czech text with your file Write/Edit tools, not shell heredocs.

## Context and controller rulings

- `/plan` is the "Otevřít plán online" target of the plan e-mail (decisions §6 point 3). The link is `${siteUrl}/plan?t=…&m=…&y=…&r=…&b=…&d=…&utm_source=email` built by src/lib/email.ts from `toParams`. The page renders the same plan as the e-mail from those URL params, with **no database lookup** and **no innerHTML anywhere** (`createElement` + `textContent` / `append(string)` only; the reviewer greps the file and the built JS).
- Reuse: `parseSelection(new URLSearchParams(location.search), US_TICKERS)` (allow-list + clamps, decisions §6a rule 1), `buildPlan(sel, FX)`, formatters in `src/lib/data.ts` (`fmtTer`, `fmtCzk`, `fmtCzkRange`, `fmtDate`, …), `roundK`. The e-mail renderer `src/lib/email.ts` already builds a `Block[]` model (headings, paragraphs, tables) that feeds both its HTML and text parts — read it: if it exposes (or can expose with a one-line `export`) a function that returns that block list for `(plan, sel, siteUrl, sentOn)`, render those blocks into DOM nodes on /plan so the page and the e-mail cannot drift. That export is the only change allowed in email.ts; its tests must stay green. If the block model is not reusable without restructuring, stop and report NEEDS_CONTEXT instead of duplicating the e-mail copy.
- Page-only adjustments: no "Dobrý den" greeting, no "Otevřít plán online" link and no e-mail footer sentence "Plán vám přišel, protože…" / the art. 21(4) paragraph (those are e-mail-only); keep the disclaimers, sources and "Toto není doporučení". If the block model can't distinguish these, filter by a simple block marker you add in email.ts (minimal) — say what you did.
- Layout: `Base.astro` with `noindex`, title "Váš ETF plán | ETF Dvojče", the existing global.css (tables, `.num`, `.ticker` only for uppercase tickers), header link back to `/`, the `Footer` component. A `<noscript>`/`no-js` message for visitors without JS: "Plán se zobrazí jen se zapnutým JavaScriptem. Celý ho máte i v e-mailu." plus a link to the home page (controller-approved microcopy, not in page.md).
- Analytics (`magnet_opened`) is Phase 4 — no tracking now.
- Verification: `npx astro build`; grep `dist/plan/index.html` and the JS it loads for `innerHTML` (must be absent); a node test is only needed if you add a helper with logic. Without a browser, run a small node script that imports your block→DOM-free part (if any) or `buildPlan` with `t=<img src=x onerror=alert(1)>,VOO&m=9e9` and show the selection is `['VOO']` / 30000 (brief's manual check, done at the logic level). Report the JS gzip size added to /plan.

## Before You Begin

If anything in the requirements or approach is unclear, ask now (status NEEDS_CONTEXT) instead of guessing.

## Your Job

1. Implement exactly what the task specifies (TDD where the brief says: show the RED failure before implementing)
2. Verify it works; run the full suite once before committing
3. Commit (small commits, one logical change each)
4. Self-review your diff: completeness, minimalism (no unrequested abstraction or options), tests verify behaviour
5. Report back

Keep it minimal. Never remove or weaken: a11y attributes, consent/GDPR text, the honeypot, server-side validation, source/date labels. No analytics code.

## You Do Not Dispatch Subagents

Do all of this task's work yourself. Never spawn a subagent or a reviewer — review is the controller's job.

## When You're in Over Your Head

It is always OK to stop and report BLOCKED or NEEDS_CONTEXT with specifics. Bad work is worse than no work.

## After Review Findings

If resumed with findings: fix them, re-run the covering tests, append a fix report (changes, command, output) to your report file, reply with the short contract.

## Report Format

Write your full report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-12-report.md: what you implemented; TDD evidence (RED: command + failing output; GREEN: command + passing output) where TDD applies; other verification with command output; files changed; self-review findings; concerns.

Then reply with ONLY (under 15 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (short SHA + subject), one-line test summary, concerns, the report file path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 12 reviewer (model: sonnet)</summary>

````text
You are reviewing one task's implementation: first whether it matches its
requirements, then whether it is well-built. This is a task-scoped gate,
not a merge review — a broad whole-branch review happens separately after
all tasks are complete.

## What Was Requested

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-12-brief.md

Global constraints from the spec/design that bind this task:
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

Controller rulings that bind this task:
- `/plan` is the "Otevřít plán online" target of the plan e-mail (decisions §6 point 3). The link is `${siteUrl}/plan?t=…&m=…&y=…&r=…&b=…&d=…&utm_source=email` built by src/lib/email.ts from `toParams`. The page renders the same plan as the e-mail from those URL params, with **no database lookup** and **no innerHTML anywhere** (`createElement` + `textContent` / `append(string)` only; the reviewer greps the file and the built JS).
- Reuse: `parseSelection(new URLSearchParams(location.search), US_TICKERS)` (allow-list + clamps, decisions §6a rule 1), `buildPlan(sel, FX)`, formatters in `src/lib/data.ts` (`fmtTer`, `fmtCzk`, `fmtCzkRange`, `fmtDate`, …), `roundK`. The e-mail renderer `src/lib/email.ts` already builds a `Block[]` model (headings, paragraphs, tables) that feeds both its HTML and text parts — read it: if it exposes (or can expose with a one-line `export`) a function that returns that block list for `(plan, sel, siteUrl, sentOn)`, render those blocks into DOM nodes on /plan so the page and the e-mail cannot drift. That export is the only change allowed in email.ts; its tests must stay green. If the block model is not reusable without restructuring, stop and report NEEDS_CONTEXT instead of duplicating the e-mail copy.
- Page-only adjustments: no "Dobrý den" greeting, no "Otevřít plán online" link and no e-mail footer sentence "Plán vám přišel, protože…" / the art. 21(4) paragraph (those are e-mail-only); keep the disclaimers, sources and "Toto není doporučení". If the block model can't distinguish these, filter by a simple block marker you add in email.ts (minimal) — say what you did.
- Layout: `Base.astro` with `noindex`, title "Váš ETF plán | ETF Dvojče", the existing global.css (tables, `.num`, `.ticker` only for uppercase tickers), header link back to `/`, the `Footer` component. A `<noscript>`/`no-js` message for visitors without JS: "Plán se zobrazí jen se zapnutým JavaScriptem. Celý ho máte i v e-mailu." plus a link to the home page (controller-approved microcopy, not in page.md).
- Analytics (`magnet_opened`) is Phase 4 — no tracking now.
- Verification: `npx astro build`; grep `dist/plan/index.html` and the JS it loads for `innerHTML` (must be absent); a node test is only needed if you add a helper with logic. Without a browser, run a small node script that imports your block→DOM-free part (if any) or `buildPlan` with `t=<img src=x onerror=alert(1)>,VOO&m=9e9` and show the selection is `['VOO']` / 30000 (brief's manual check, done at the logic level). Report the JS gzip size added to /plan.

## What the Implementer Claims They Built

Read the implementer's report: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-12-report.md

## Diff Under Review

**Base:** d97292f
**Head:** c638fdc
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-d97292f..c638fdc.diff

Read the diff file once — it contains the commit list, a stat summary,
and the full diff with surrounding context, and it is your view of the
change. The diff's context lines ARE the changed files: do not Read a
changed file separately unless a hunk you must judge is cut off
mid-function — and say so in your report. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat d97292f..c638fdc` and `git diff d97292f..c638fdc`.
Do not crawl the broader codebase. Inspect code outside the diff only
to evaluate a concrete risk you can name — one focused check per named
risk, and name both the risk and what you checked in your report.
Cross-cutting changes are legitimate named risks: if the diff changes
lock ordering, a function or API contract, or shared mutable state,
checking the call sites is the right method.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Do Not Trust the Report

Treat the implementer's report as unverified claims about the code. It
may be incomplete, inaccurate, or optimistic. Verify the claims against
the diff. Design rationales in the report are claims too: "left it per
YAGNI," "kept it simple deliberately," or any other justification is the
implementer grading their own work. Judge the code on its merits — a
stated rationale never downgrades a finding's severity.

## Tests

The implementer already ran the tests and reported results with TDD
evidence for exactly this code. Do not re-run the suite to confirm their
report. Run a test only when reading the code raises a specific doubt
that no existing run answers — and then a focused test, never a
package-wide suite, race detector run, or repeated/high-count loop. If
heavy validation seems warranted, recommend it in your report instead of
running it. If you cannot run commands in this environment, name the
test you would run.

Warnings or other noise in the implementer's reported test output are
findings — test output should be pristine.

Evidence you cannot see is not evidence that doesn't exist. If the
report or its test evidence looks truncated, or you cannot locate the
results it claims, re-read the file at its stated path — and if it is
genuinely missing or garbled, report that as a gap for the controller.
Re-running the suite to regenerate what you failed to read is not
verification; illegibility of the evidence is not invalidation of it.

## Part 1: Spec Compliance

Compare the diff against What Was Requested:

- **Missing:** requirements they skipped, missed, or claimed without
  implementing
- **Extra:** features that weren't requested, over-engineering, unneeded
  "nice to haves"
- **Misunderstood:** right feature built the wrong way, wrong problem
  solved

If the brief lists several files each with its own change (a batched
dispatch), check the diff against that list file by file: every listed
file must have its corresponding hunk. A listed file the diff never
touches is a Missing finding, no matter how clean the rest of the
batch looks.

If a requirement cannot be verified from this diff alone (it lives in
unchanged code or spans tasks), report it as a ⚠️ item instead of
broadening your search.

## Part 2: Code Quality

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY without premature abstraction?
- Edge cases handled?

**Tests:**
- Do the new and changed tests verify real behavior, not mocks?
- Are the task's edge cases covered?

**Structure:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this change create new files that are already large, or
  significantly grow existing files? (Don't flag pre-existing file
  sizes — focus on what this change contributed.)

Your report should point at evidence: file:line references for every
finding and for any check you would otherwise answer with a bare
"yes." A tight report that cites lines gives the controller everything
it needs.

Your final message is the report itself: begin directly with the
spec-compliance verdict. Every line is a verdict, a finding with
file:line, or a check you ran — no preamble, no process narration,
no closing summary.

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Important means this task cannot be trusted until it is fixed: incorrect
or fragile behavior, a missed requirement, or maintainability damage you
would block a merge over — verbatim duplication of a logic block,
swallowed errors, tests that assert nothing. "Coverage could be broader"
and polish suggestions are Minor.
If the plan or brief explicitly mandates something this rubric calls a
defect (a test that asserts nothing, verbatim duplication of a logic
block), that IS a finding — report it as Important, labeled
plan-mandated. The plan's authorship does not grade its own work; the
human decides.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

## Output Format

### Spec Compliance

- ✅ Spec compliant | ❌ Issues found: [what's missing/extra/misunderstood,
  with file:line references]
- ⚠️ Cannot verify from diff: [requirements you could not verify from the
  diff alone, and what the controller should check — report alongside the
  ✅/❌ verdict for everything you could verify]

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)

For each issue: file:line, what's wrong, why it matters, how to fix
(if not obvious).

### Assessment

**Task quality:** [Approved | Needs fixes]

**Reasoning:** [1-2 sentence technical assessment]
````

</details>

<details><summary>2026-10-15 — subagent prompt: Final whole-branch reviewer (model: opus)</summary>

````text
You are a Senior Code Reviewer with expertise in software architecture,
design patterns, and best practices. Your job is to review completed work
against its plan or requirements and identify issues before they cascade.

## What Was Implemented

Phase 3 (Build) of ETF Dvojče: Astro static landing page + vanilla-TS tool island, tested fee calculator (src/lib/fees.ts), input allow-list (selection.ts), plan model + e-mail renderer (plan.ts, email.ts), /api/lead Vercel function with Brevo client and dry-run (api/lead.ts, src/lib/brevo.ts), /plan page, privacy/thank-you/error pages, no-JS fallback, ČNB FX build fetch, JS size script. 13 tasks, each reviewed; see the ledger for deferred minors and rulings.

The whole branch diff with context is in one file: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-e5b81c4..5fc1352.diff (read it instead of re-running git diff; package-lock.json and woff2 binaries can be skipped).

Ledger with every deferred minor and every ruling (triage which must be fixed before the Phase 3 checkpoint): D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/progress.md

## Requirements / Plan

Plan: D:/etf_landing_page/docs/superpowers/plans/2026-10-15-phase3-build.md (Global Constraints + Review Focus sections are binding). Spec: docs/decisions.md (§3–6a, §8, §10–12, §14, §15), content/page.md and content/email.md (approved copy, verbatim), content/calc-examples.mjs (fee oracle), data/sources.md §7–9, CLAUDE.md. Not in scope: analytics (Phase 4), deploy/accounts/Lighthouse/real-browser checks (Phase 5; no browser exists on this machine). Concentrate on: correctness of the fee maths and the plan model against data, the /api/lead trust boundary (decisions §6a), escaping/no-innerHTML on /plan and in the e-mail, copy fidelity to page.md/email.md, a11y basics, cross-task integration (tool.ts ↔ forms.ts ↔ LeadForm hidden fields ↔ api).

## Git Range to Review

**Base:** e5b81c4
**Head:** 5fc1352

```bash
git diff --stat e5b81c4..5fc1352
git diff e5b81c4..5fc1352
```

## The spec is a vision document

The spec says what the software must do. It does not enumerate every
input, environment, or condition the software will meet. For behavior
the spec is silent on, judge by what a reasonable person using this
software would expect: a reasonable person's expectation is a
requirement, and a spec's silence is not permission. Grade such
findings by their effect on that person, not by whether the spec
mentions the trigger.

## Declined to judge

Before your verdict, list every behavior you considered and set aside
as outside the plan or spec, one line each, with the reason. The
executor rules on each line; nothing you set aside is dropped
silently. An empty list means you set nothing aside.

## Read-Only Review

Your review is read-only on this checkout. Do not mutate the working tree, the index, HEAD, or branch state in any way. Use tools like `git show`, `git diff`, and `git log` to inspect history. If you need a working copy of a different revision, check it out into a separate temporary directory (e.g. `git worktree add /tmp/review-5fc1352 5fc1352`) — never move HEAD on this checkout.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## What to Check

**Plan alignment:**
- Does the implementation match the plan / requirements?
- Are deviations justified improvements, or problematic departures?
- Is all planned functionality present?

**Code quality:**
- Clean separation of concerns?
- Proper error handling?
- Type safety where applicable?
- DRY without premature abstraction?
- Edge cases handled?

**Architecture:**
- Sound design decisions?
- Reasonable scalability and performance?
- Security concerns?
- Integrates cleanly with surrounding code?

**Testing:**
- Tests verify real behavior, not mocks?
- Edge cases covered?
- Integration tests where they matter?
- All tests passing?

**Production readiness:**
- Migration strategy if schema changed?
- Backward compatibility considered?
- Documentation complete?
- No obvious bugs?

## Calibration

Categorize issues by actual severity. Not everything is Critical.
Acknowledge what was done well before listing issues — accurate praise
helps the implementer trust the rest of the feedback.

If you find significant deviations from the plan, flag them specifically
so the implementer can confirm whether the deviation was intentional.
If you find issues with the plan itself rather than the implementation,
say so.

## Output Format

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
[Bugs, security issues, data loss risks, broken functionality]

#### Important (Should Fix)
[Architecture problems, missing features, poor error handling, test gaps]

#### Minor (Nice to Have)
[Code style, optimization opportunities, documentation polish]

For each issue:
- File:line reference
- What's wrong
- Why it matters
- How to fix (if not obvious)

### Recommendations
[Improvements for code quality, architecture, or process]

### Assessment

**Ready to merge?** [Yes | No | With fixes]

**Reasoning:** [1-2 sentence technical assessment]

## Critical Rules

**DO:**
- Categorize by actual severity
- Be specific (file:line, not vague)
- Explain WHY each issue matters
- Acknowledge strengths
- Give a clear verdict

**DON'T:**
- Say "looks good" without checking
- Mark nitpicks as Critical
- Give feedback on code you didn't actually read
- Be vague ("improve error handling")
- Avoid giving a clear verdict
```

**Placeholders:**
- `Phase 3 (Build) of ETF Dvojče: Astro static landing page + vanilla-TS tool island, tested fee calculator (src/lib/fees.ts), input allow-list (selection.ts), plan model + e-mail renderer (plan.ts, email.ts), /api/lead Vercel function with Brevo client and dry-run (api/lead.ts, src/lib/brevo.ts), /plan page, privacy/thank-you/error pages, no-JS fallback, ČNB FX build fetch, JS size script. 13 tasks, each reviewed; see the ledger for deferred minors and rulings.

The whole branch diff with context is in one file: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-e5b81c4..5fc1352.diff (read it instead of re-running git diff; package-lock.json and woff2 binaries can be skipped).

Ledger with every deferred minor and every ruling (triage which must be fixed before the Phase 3 checkpoint): D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/progress.md` — brief summary of what was built
- `Plan: D:/etf_landing_page/docs/superpowers/plans/2026-10-15-phase3-build.md (Global Constraints + Review Focus sections are binding). Spec: docs/decisions.md (§3–6a, §8, §10–12, §14, §15), content/page.md and content/email.md (approved copy, verbatim), content/calc-examples.mjs (fee oracle), data/sources.md §7–9, CLAUDE.md. Not in scope: analytics (Phase 4), deploy/accounts/Lighthouse/real-browser checks (Phase 5; no browser exists on this machine). Concentrate on: correctness of the fee maths and the plan model against data, the /api/lead trust boundary (decisions §6a), escaping/no-innerHTML on /plan and in the e-mail, copy fidelity to page.md/email.md, a11y basics, cross-task integration (tool.ts ↔ forms.ts ↔ LeadForm hidden fields ↔ api).` — what it should do (plan file path, task text, or requirements)
- `e5b81c4` — starting commit
- `5fc1352` — ending commit

**Reviewer returns:** Strengths, Issues (Critical / Important / Minor), Recommendations, Assessment

## Example Output

```
### Strengths
- Clean database schema with proper migrations (db.ts:15-42)
- Comprehensive test coverage (18 tests, all edge cases)
- Good error handling with fallbacks (summarizer.ts:85-92)

### Issues

#### Important
1. **Missing help text in CLI wrapper**
   - File: index-conversations:1-31
   - Issue: No --help flag, users won't discover --concurrency
   - Fix: Add --help case with usage examples

2. **Date validation missing**
   - File: search.ts:25-27
   - Issue: Invalid dates silently return no results
   - Fix: Validate ISO format, throw error with example

#### Minor
1. **Progress indicators**
   - File: indexer.ts:130
   - Issue: No "X of Y" counter for long operations
   - Impact: Users don't know how long to wait

### Recommendations
- Add progress reporting for user experience
- Consider config file for excluded projects (portability)

### Assessment

**Ready to merge: With fixes**

**Reasoning:** Core implementation is solid with good architecture and tests. Important issues (help text, date validation) are easily fixed and don't affect core functionality.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Final review fix wave (model: sonnet)</summary>

````text
You are fixing the findings of the final whole-branch review of Phase 3 (Build) of "ETF Dvojče" (Czech landing page; Astro static + vanilla TS + one Vercel function). Repo D:\etf_landing_page, Windows, Git Bash/PowerShell, Node 26 (runs .ts natively; erasable TS syntax only), npm 11, NO Python. Branch master, commit directly. Only dependency: astro. Read D:\etf_landing_page\CLAUDE.md first. Copy rule: content/page.md and content/email.md are approved copy, verbatim. Never add analytics. Never remove a11y attributes, consent text, honeypot, server validation, source/date labels. Do not dispatch subagents.

Fix all of these, with a test where the item says so (TDD: show the failing test first). Run `npm test` at the end, and `npx astro build` (if `data/fx.json` changes as a side effect, `git checkout data/fx.json` — don't commit it). Small commits, English messages ending with `Co-Authored-By:` your model line.

1. **Unsubscribe placeholder (controller ruling):** email.ts renders the literal "[Odhlásit se]". The mechanism depends on the Brevo account (Phase 5). Render it as a marked placeholder in both HTML and text parts: `[DOPLNIT: odkaz pro odhlášení]`, styled like the other `[DOPLNIT …]` placeholders in the e-mail, so it lands on the README must-fill list. Test: the output contains `[DOPLNIT: odkaz pro odhlášení]` and not `[Odhlásit se]`.
2. **Broker names in the genitive case in the e-mail** (email.ts ~73, ~76): "nakupujete u {brokera}" and the ETF line must read e.g. "u České spořitelny", "u Fio", "u XTB", "u Trading 212"; "Nevím" keeps email.md's `„nevím"` wording for the first line (read email.md §3: "nakupujete u {brokera / „nevím"}"). Add a genitive map in src/lib/data.ts next to the existing short-name map (`{ xtb: 'XTB', t212: 'Trading 212', fio: 'Fio', cs: 'České spořitelny' }`, fallback `b.name`). Also make the ETF line verbatim with email.md: "ETF: TER {…} ročně, poplatek za obchod a směna měny u {brokera} ({ceník, datum})." — no colon after "směna měny". Tests for ČS and Fio renders.
3. **forms.ts throws on /chyba-formulare/ and /chyba-odeslani/** (no `#lead-inline`, `[data-result]`, `[data-sticky]` there): guard the inline/sticky/tool:result wiring so only the parts whose elements exist are set up; submit handling for every `.lead-form` must still attach.
4. **"Poslat plán" CTA in "Co vám přijde e-mailem"** (PlanContents.astro, `data-cta="plan"`): page.md §4 says it scrolls to the inline form if the result is shown, otherwise to Step A (`#nastroj`). Add that click handler in forms.ts (where the sticky bar's scroll-to-form already lives); keep the plain `href` as the no-JS fallback. Focus the e-mail field when going to the form.
5. **One ad-variant rule:** decisions §7 says `ad_a_*` → a, `ad_b_*` → b. Make `adVariant` in selection.ts strict (`/^ad_([ab])_/`) and add tests that bare `ad_a` / `ad_b` → `unknown`; the Base.astro head script already requires the `ad_b_` prefix — confirm they now agree.
6. **UTM sanitising order** (selection.ts `sanitizeUtm`): strip control chars, then trim, then slice(0, 100). Test: 150 leading spaces + "instagram" → "instagram".
7. **`SITE_URL` trailing slash:** normalise once in `POST()` in api/lead.ts (strip trailing `/` after the existing URL validation). Test via `handleLead` or a small exported helper.
8. **Dry-run on Vercel:** in src/lib/brevo.ts dry-run, skip writing `.dev/last-email.html` when `process.env.VERCEL` is set (log only), so a preview without `BREVO_API_KEY` doesn't 502 on a read-only filesystem. Also add a comment line to .env.example: `# SITE_URL without a trailing slash` is no longer needed after item 7 — instead note there that a preview deploy without BREVO_API_KEY runs in dry-run and sends nothing.

Not in scope (do not touch): README, analytics, the twin-list live region, `/plan-preview.png`, rate limiting.

Write your report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\final-fix-report.md (per item: change, test, command + output). Reply with ONLY: Status, commits (short SHA + subject), one-line test summary, concerns, report path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Final fix-wave re-review (model: sonnet)</summary>

````text
You are re-reviewing one task's fix round. A previous review produced
findings; an implementer has attempted to fix them. Your job is to
verdict each finding and inspect the fix diff — nothing else.

## The Task

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/final-fix.md

## The Findings Under Verification

The 8 numbered items in D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/final-fix.md (the brief is the findings list).

## The Fix

Read the implementer's report (fix reports are appended at the end):
D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/final-fix-report.md

**Fix base:** 5fc1352 (the head the previous review saw)
**Head:** c7d990d
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-5fc1352..c7d990d.diff

Read the diff file once — it contains the fix commits, a stat summary,
and the fix diff with surrounding context. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 5fc1352..c7d990d` and
`git diff 5fc1352..c7d990d`.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Scope

Your scope is the findings list and the fix diff. Verdict every finding.
Inspect the fix diff for new problems the fix itself introduced. Do NOT
re-review code the fix did not touch: if you notice an issue entirely
outside the fix diff, report it under Out-of-Scope Observations — it
does not block this task and does not extend the loop. A broad
whole-branch review happens after all tasks are complete.

## Tests

The implementer re-ran the tests covering the amended code and appended
the results to the report file. Treat the report as unverified claims:
confirm the fix report names the covering tests and shows their output,
and verify the claims against the diff. Do not re-run the suite to
confirm their report. Run a test only when reading the code raises a
specific doubt that no existing run answers — and then a focused test,
never a package-wide suite.

## Output Format

Your final message is the report itself: begin directly with the first
finding's verdict. Every line is a verdict, a finding with file:line,
or a check you ran — no preamble, no process narration.

### Finding Verdicts

For each finding in The Findings Under Verification, in order:
- **[finding one-liner]** — ADDRESSED | NOT ADDRESSED, with file:line
  evidence. "Attempted" is not addressed: the specific defect must no
  longer exist.

### New Breakage in the Fix Diff

Anything the fix itself broke or introduced, with severity
(Critical/Important/Minor) and file:line. "None" if clean.

### Out-of-Scope Observations

Issues you noticed entirely outside the fix diff. Non-blocking; the
controller ledgers these for the final review. "None" if none.

### Verdict

**Fix round:** [All findings addressed, no new Critical/Important
breakage | Findings remain open] — list the open ones.
````

</details>

## 2026-10-15 — Phase 3 build: result, checks, mistakes caught

**How it ran:** `superpowers:subagent-driven-development`. 10 implementer dispatches (Tasks 1, 3, 5–12; models: Haiku for
fully specified code, Sonnet for prose-specified logic, Opus for the page design and the tool island), each followed
by a task reviewer (Sonnet; Opus for `/api/lead`, the page and the island), fix rounds where needed, then one Opus
whole-branch review, one fix wave and a scoped re-review. Tasks 2 (GDPR research → `data/sources.md` §9) and 4
(broker fields) were done by the lead agent. Every prompt is logged verbatim above. The lead agent also checked each
review's "cannot verify" items itself and ran the final end-to-end check (dev server, JSON and no-JS POST, e-mail text).

**Verified by the lead agent:** `npm test` 61/61 · `node data/validate.mjs` OK · `astro build` 6 pages, no `{…}`,
`undefined`, `NaN` or `innerHTML` in any page or JS · first-load JS 13.8 kB gz (budget 60) · default fees reproduce
`content/calc-examples.mjs` (22 000 Kč vs 272 000–339 000 Kč) · local POST → `{"ok":true}` and a rendered e-mail.
**Not verified:** anything in a real browser (no Chrome/Edge on this machine, the built-in browser can't open
localhost): layout, first-screen fit, animation, focus, screen readers, CLS.

**Mistakes and defects caught (by whom)**
1. Lead agent's own: appending `.superpowers/` to `.gitignore` without a newline glued it to `*.pdf`, un-ignoring the
   third-party PDFs (Task 1 reviewer).
2. Lead agent's own: the Task 7 dispatch said "first in displayed order" for the TER tie-break, contradicting
   decisions §15 #2; the implementer followed the spec and flagged it.
3. Lead agent's own: the first `size.mjs` missed the shared chunk imported by both page scripts (8 kB of 13.7 kB);
   fixed to follow static imports before reporting the number.
4. Fonts: the width axis came only with 176 kB of variable fonts; split into wght-only body files + a 4 kB
   "Archivo Wide" A–Z0–9 instance (72 kB total).
5. Without JS both heroes showed (no default `data-variant`).
6. E-mail copy drift: a dropped word ("ho"), an invented parenthetical, an added sentence (Task 7 reviewer);
   a literal "[Odhlásit se]" with no link and broker names in the wrong case ("u Česká spořitelna") (final review).
7. A SCHD-only plan priced the ETF side with SCHD's own US TER (lead agent) → always a UCITS fund now.
8. `/api/lead` swallowed error causes, so every 502 would have looked the same on launch day (Opus reviewer).
9. No-JS server errors landed on the "your e-mail looks wrong" page → new `/chyba-odeslani/`.
10. TER rendered "0,3 %" instead of page.md's "0,30 %".
11. "Zadat znovu" restored a form whose button stayed disabled ("Posíláme…").
12. `forms.ts` would throw on the error pages; client and server disagreed on bare `ad_b` (attribution skew).
13. Subagents signed commits with their own model name instead of the dispatch's trailer; kept as more accurate.

<details><summary>2026-10-15 — subagent prompt: Task 13 first-screen fix (after Playwright screenshots) (model: opus)</summary>

````text
You are fixing the first-screen layout of "ETF Dvojče" (Czech landing page; Astro static + vanilla-TS island). Repo D:\etf_landing_page, Windows, Git Bash/PowerShell, Node 26 (runs .ts natively), NO Python. Branch master, commit directly, English commit messages ending with a `Co-Authored-By:` line for your model. Read CLAUDE.md ("Copy & design rules"), docs/decisions.md §3, §4, §10, and content/page.md §1B and §2 first. Copy in page.md is approved and verbatim. Do not dispatch subagents. Never remove a11y attributes, consent text, honeypot, source/date labels. No analytics.

A real-browser check now exists: `npx astro build` then `node scripts/screenshots.mjs` (Playwright + Chromium installed). It writes docs/screenshots/hero-{a,b}-390x{844,700}.png and prints what is above the fold. Look at the PNGs with your Read tool.

Current state (measured): hero A is fine. **Hero B fails**: at 390×844 the fee result line ends at y≈1110 and the trust line at ≈1173; the sticky bar shows on load and covers the bottom; its button wraps as "Poslat plán e- / mailem".

Requirements:
1. **Hero B must match page.md §1B**, which the build deviates from: after the two sliders (Měsíčně spořím, Jak dlouho) comes a **compact return line** "Výnos trhu {5 %} ročně · *předpoklad, ne předpověď* · [změnit]"; the `[změnit]` button reveals the return slider and the UBS comparison note (page.md §2 Step B text, incl. "Minulá výkonnost není zárukou budoucích výnosů.") — `aria-expanded` + `aria-controls`; the compact line keeps showing the current value. Directly after it: the result line ("Kvůli poplatkům budete mít méně o: …" with the marker) and its source line + [Jak počítáme], then the trust line for variant b, then "Kde nakupujete?" and the rest of Step B. Use this same order for variant a too (one layout, less code); the result updates live when the broker changes, so broker-below-result is fine.
2. **Collapsed Step A in variant b** ("Vybráno: VOO · změnit") must take as little height as possible while keeping the "1. Které ETF jste chtěli koupit?" heading for structure (e.g. smaller margins; heading and the Vybráno button may share less vertical space). Don't hide the heading from assistive tech.
3. **Target:** at 390×700 (Instagram in-app browser) hero B shows the h1, the sub, both sliders, the compact return line and the **whole result line**; ideally the trust line too. Hero A must stay as it is now (headline, sub, chips, trust line in the first screen at 390×700).
4. **Only if 3 is still not met after 1–2:** shorten hero B's sub-line (Matěj's instruction: "if hero B doesn't fit, shorten its sub-line first"). Propose the shortest natural Czech variant that keeps the meaning, apply it, and update content/page.md §1B with the new sub and a one-line *Poznámka* ("zkráceno ve fázi 3, aby se výsledek vešel na první obrazovku"). Do not shorten the headline (it must match the ad word for word).
5. **Sticky bar** must never cover the first screen on load: show it only after the visitor's first interaction with the tool (chip tap, slider/radio change, or the [změnit] button) — decisions §3 says it appears after the result, and on an ad-B landing the result is already there, so interaction is the trigger. Its button text must not hyphenate or wrap mid-word (`white-space: nowrap`, adjust widths so the summary and the button fit at 390 px; the summary may wrap).
6. Fix the selector in scripts/screenshots.mjs step 1 so `firstControl` reports the first *visible* control (`#in-m` for variant b, a chip for a) and report the result line for b. Keep the rest of the script.

Verify: `npm test` (all green), `npx astro build`, `node scripts/screenshots.mjs` → paste its printed fold report; view the four hero PNGs and describe what is in each first screen. Note: `npm run build`'s prebuild may rewrite data/fx.json; if it changes, `git checkout data/fx.json`. Commit the code; also commit the regenerated docs/screenshots/*.png and public/plan-preview.png in a separate commit `docs: first-screen screenshots and plan e-mail preview`.

Write a report to D:\etf_landing_page\.superpowers\sdd\2026-10-15-phase3-build\task-13-fix-report.md. Reply with ONLY: Status, commits, the fold report lines, whether the sub-line was shortened (and to what), concerns, report path.
````

</details>

<details><summary>2026-10-15 — subagent prompt: Task 13 first-screen fix re-review (model: sonnet)</summary>

````text
You are re-reviewing one task's fix round. A previous review produced
findings; an implementer has attempted to fix them. Your job is to
verdict each finding and inspect the fix diff — nothing else.

## The Task

Read the task brief: D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-13-fix.md

## The Findings Under Verification

Requirements 1–6 in D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-13-fix.md (hero B per page.md §1B, slim collapsed Step A, 390x700 target, sub-line only if needed, sticky bar after first interaction + no wrap, screenshot selector). Also judge the extra fix: restored spaces Astro dropped before inline elements (7 places) — check none of the touched copy deviates from page.md.

## The Fix

Read the implementer's report (fix reports are appended at the end):
D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/task-13-fix-report.md

**Fix base:** 08eb906 (the head the previous review saw)
**Head:** 7a4b5ad
**Diff file:** D:/etf_landing_page/.superpowers/sdd/2026-10-15-phase3-build/review-08eb906..7a4b5ad.diff

Read the diff file once — it contains the fix commits, a stat summary,
and the fix diff with surrounding context. Do not re-run git commands.
If the diff file is missing, fetch the diff yourself:
`git diff --stat 08eb906..7a4b5ad` and
`git diff 08eb906..7a4b5ad`.

Your review is read-only on this checkout. Do not mutate the working
tree, the index, HEAD, or branch state in any way.

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part
of the diff, and never spawn another reviewer for a second opinion.
This process already provides every review seat the work gets; a
reviewer you spawn duplicates one of them at full cost, and its
verdict counts for nothing. If the diff feels too large for one
pass, review it in passes yourself and say so in your report.

## Scope

Your scope is the findings list and the fix diff. Verdict every finding.
Inspect the fix diff for new problems the fix itself introduced. Do NOT
re-review code the fix did not touch: if you notice an issue entirely
outside the fix diff, report it under Out-of-Scope Observations — it
does not block this task and does not extend the loop. A broad
whole-branch review happens after all tasks are complete.

## Tests

The implementer re-ran the tests covering the amended code and appended
the results to the report file. Treat the report as unverified claims:
confirm the fix report names the covering tests and shows their output,
and verify the claims against the diff. Do not re-run the suite to
confirm their report. Run a test only when reading the code raises a
specific doubt that no existing run answers — and then a focused test,
never a package-wide suite.

## Output Format

Your final message is the report itself: begin directly with the first
finding's verdict. Every line is a verdict, a finding with file:line,
or a check you ran — no preamble, no process narration.

### Finding Verdicts

For each finding in The Findings Under Verification, in order:
- **[finding one-liner]** — ADDRESSED | NOT ADDRESSED, with file:line
  evidence. "Attempted" is not addressed: the specific defect must no
  longer exist.

### New Breakage in the Fix Diff

Anything the fix itself broke or introduced, with severity
(Critical/Important/Minor) and file:line. "None" if clean.

### Out-of-Scope Observations

Issues you noticed entirely outside the fix diff. Non-blocking; the
controller ledgers these for the final review. "None" if none.

### Verdict

**Fix round:** [All findings addressed, no new Critical/Important
breakage | Findings remain open] — list the open ones.
````

</details>

## 2026-10-15 — Phase 3 visual QA (Playwright, approved by Matěj)

Matěj approved `playwright` as a dev dependency. `scripts/screenshots.mjs` serves `dist/`, screenshots both heroes at
390×844 and 390×700 (`docs/screenshots/`), scans every page for console errors, failed requests and horizontal
overflow, measures tabular figures, and renders `public/plan-preview.png` from the real e-mail renderer.

**What the first run showed (lead agent, by looking at the PNGs):** hero A fit; **hero B did not**: the fee result
line ended at y≈1110 px. Cause: the build had not implemented page.md §1B's compact return line ("Výnos trhu 5 % ročně
· předpoklad, ne předpověď · [změnit]"), so the full return slider and the UBS note pushed the result down; the sticky
bar also appeared on load over the first screen and its button wrapped "e-/mailem". No unit test or code review had
caught any of this; only the browser did.
**Fix (Opus implementer, Sonnet re-review):** §1B layout implemented for both variants, collapsed Step A slimmed,
sticky bar only after the first interaction. The sub-line did not need shortening. The implementer also found that
Astro drops the space between a line-ending word and a following inline element ("2026.Jak počítáme") in 7 places.
**Result (re-run by the lead agent):** hero B at 390×700 shows headline, sub, both sliders, return line and the full
result line (trust line just below the fold); hero A unchanged; tnum widths equal; no console errors; 61/61 tests;
first-load JS 13.9 kB gz.

---

## 2026-10-15 — Phase 4 tracking: provider check and plan (Claude Code, Opus 5.5)

**Asked (Matěj):** start Phase 4: event plan with `analytics`, verify Umami Cloud with sources before anything else,
plan with `superpowers:writing-plans`, stop before code.

**Skills loaded:** `superpowers:writing-plans`, `marketing-skills:analytics` (its GA4/GTM and consent-mode parts don't
apply; used only for the event-table format and the "no PII in properties" rule). No subagents.

**Provider verification:** raw HTML/JS read with curl + text extraction (pricing, Cloud FAQ, docs, signup app string
table, DPA, subprocessors, terms) and the tracker script measured with gzip. Table with quotes and URLs in
`docs/superpowers/plans/2026-10-15-phase4-tracking.md`.

**Caught during the check**
1. Umami bills **every event-data property as one event**, which the pricing page alone doesn't show (Cloud FAQ does).
   A custom `page_view` with 5 UTMs + variant would have cost 8 events per visit; the plan uses the automatic
   pageview (URL already holds the UTMs) and `data-tag` for `ad_variant` instead.
2. The docs only say servers are "in the US and EU". A web search returned third-party claims both ways; the
   region choice was confirmed from the signup app's own strings ("Select your data region", "Once selected this
   cannot be changed"), not from those claims.
3. `umami.is/umami-dpa.pdf` (a search result) is a 404 HTML page; the current DPA is the `/dpa` web page.
4. Open legal question flagged, not decided: EDPB Guidelines 2/2023 may treat a cookieless script's device reads as
   "gaining access" under ePrivacy art. 5(3) (CZ: § 89(3) zákona 127/2005 Sb.). Plan Task 6 researches it and stops
   for Matěj if consent turns out to be needed.

---

## 2026-10-15 — Phase 4 tracking: implementation (Claude Code, Opus 5.5, inline)

**How it ran:** Matěj chose inline execution (`superpowers:executing-plans`): the lead agent implemented all 7 tasks
itself under `superpowers:test-driven-development`, with a ledger in `.superpowers/sdd/2026-10-15-phase4-tracking/`.
Skills loaded: `executing-plans`, `test-driven-development`, `marketing-skills:ab-testing` (its sample-size table and
ICE scoring were not used; see below). One fresh reviewer at the end (prompt logged below).

**Verified by the lead agent:** `npm test` 74/74 · `node scripts/funnel-check.mjs` "All expectations met"
(`docs/funnel-check.log`) · first-load JS 14.5 kB gz with a website ID set, + 2.3 kB external Umami script
(budget 60) · `node scripts/screenshots.mjs`: no console errors or overflow, hero screenshots byte-identical ·
`node scripts/sample-size.mjs` self-check passes.

**Mistakes and defects caught**
1. **Consent (the big one).** The Phase 0 premise "cookieless → no consent banner" did not survive the legal
   research: EDPB Guidelines 2/2023 ¶33 puts a JS tracker that makes the browser send data under ePrivacy art. 5(3)
   (§ 89(3) ZEK), and ÚOOÚ reportedly applies that to cookieless hash-based tools (eLegal, 2025; secondary source,
   flagged as such). Stopped as planned; Matěj chose a consent bar. Conversion denominator moved from Umami
   pageviews to Meta link clicks as a consequence.
2. **Bug found only by the browser:** `interaction_complete` lagged one interaction behind (reported the second
   result, VOO,QQQ instead of VOO), because `tool.ts` fires `tool:result` inside its own listeners before the funnel
   listener marked the visit as touched. Fixed by recording the touch in the capture phase. Unit tests could not
   have caught it.
3. **Plan defect:** `form_error 'empty'` could never fire: the e-mail input is `required`, so the browser blocks the
   submit before our handler runs. Added an `invalid` listener.
4. **Plan defect:** the plan read step props from the form's hidden fields, which `tool.ts` updates in a listener
   whose order relative to ours isn't guaranteed. Read the tool's inputs instead.
5. **Lead agent's own:** expected `step_complete` B = the final slider value (8 000), but the plan's own rule is
   "first change" (3 500). The expectation was wrong, not the code.
6. **Lead agent's own:** ran `npx astro check` without `@astrojs/check` installed; it hung on an install prompt and
   had to be killed. Also a heredoc ate the backslashes in a regex (CLAUDE.md warns about this).
7. **Skill table vs. formula:** the `ab-testing` skill's quick reference says ~7k per variant for 5 % at +20 %; the
   two-proportion formula gives 8 158 (checked by hand in `scripts/sample-size.mjs`). The skill table is unsourced
   and was not used.
8. The A/B draft first claimed the Meta A/B split feature as a fact and implied all arms exist; corrected to "verify
   before launch" and "only test 1's arms are built".

**Not verified:** anything on a deployed URL or in a real Umami account (needs Matěj's OK for the account and the
deploy), a real phone, whether Umami's funnel report can filter by tag.

### Phase 4 final review (fresh reviewer, Opus) and fix pass

**Prompt (verbatim):**

<details><summary>2026-10-15 — subagent prompt: Phase 4 whole-branch review (model: opus)</summary>

````text
You are a Senior Code Reviewer with expertise in software architecture, design patterns, and best practices. Your job is to review completed work against its plan or requirements and identify issues before they cascade.

## What Was Implemented

Phase 4 (funnel tracking) of "ETF Dvojče", a Czech mobile landing page (Astro static + vanilla-TS island, Vercel function /api/lead → Brevo). Repo D:\etf_landing_page, Windows, Node 26 runs .ts natively, NO Python. Built: a `track()` wrapper + Umami Cloud loader (src/lib/track.ts), pure helpers (src/lib/funnel.ts), DOM wiring (src/scripts/funnel.ts), consent bar (src/scripts/analytics.ts, loaded from src/layouts/Base.astro), server-confirmed events in src/scripts/forms.ts and src/scripts/plan-page.ts, a Playwright end-to-end check against the real Umami tracker with its network sends intercepted (scripts/funnel-check.mjs → docs/funnel-check.log), a privacy-page section (src/pages/ochrana-osobnich-udaju.astro), legal research (data/sources.md §10), README drafts (docs/readme-drafts/), A/B sample sizes (scripts/sample-size.mjs), decisions (docs/decisions.md §12, §16).

Mid-run change approved by the product owner (Matěj): legal research showed cookieless analytics still needs consent in CZ (§ 89(3) zákona 127/2005 Sb., EDPB 2/2023 ¶33), so a consent bar was added: shown at the top after the first scroll/tap/key, Umami script only downloaded after "Souhlasím", earlier events queued in memory and flushed after the pageview, dropped on "Nesouhlasím"; choice in localStorage; footer "Nastavení měření" reopens it.

## Requirements / Plan

Read: docs/superpowers/plans/2026-10-15-phase4-tracking.md (the plan; its event table is the contract), docs/decisions.md §11, §12, §16, CLAUDE.md sections "Tracking", "Legal basics", "Copy & design rules", "Stack". The executor's rulings are the `Ruling:` lines in .superpowers/sdd/2026-10-15-phase4-tracking/progress.md — weigh them.

Plan's Review Focus (check each deliberately):
1. Ad B landing with no touch must not produce interaction_start / step_complete / interaction_complete (the result is pre-rendered).
2. Slider drag fires tool:result every animation frame; interaction_complete and step_complete B must still fire once.
3. Events before the Umami script has loaded (and now: before consent) must be queued, not lost — and must not be sent at all without consent.
4. An e-mail-like string in a prop must never be sent.
5. Tall sections (the tool on a 390 px phone) must still produce section_view.

Also check: no e-mail or free text can reach Umami by any path (props, URL, title — note the thank-you heading contains the e-mail; check whether Umami's payload includes document.title or anything else that could carry it); consent is honoured on every page and every path (incl. withdrawal, a stored "yes" on later visits, private mode where localStorage throws); the honeypot, a11y attributes, consent text and source/date labels are untouched; JS budget < 60 kB gz; Czech copy on the bar/privacy page is natural and doesn't overclaim (e.g. "anonymous"); README drafts don't state anything unverified as fact.

## Git Range to Review

**Base:** 96265f0
**Head:** cc5e7c0

A prepared package: .superpowers/sdd/2026-10-15-phase4-tracking/review-96265f0..cc5e7c0.diff (17 commits). Or:
git diff --stat 96265f0..cc5e7c0
git diff 96265f0..cc5e7c0

You may run `npm test` and `node scripts/funnel-check.mjs` (it builds into .dev/dist-funnel, fetches the real tracker from cloud.umami.is, intercepts its sends; takes ~1–2 min). Do not run `npm run build` (its prebuild rewrites data/fx.json); `npx astro build --outDir <tmp>` is fine.

## The spec is a vision document

The spec says what the software must do. It does not enumerate every input, environment, or condition the software will meet. For behavior the spec is silent on, judge by what a reasonable person using this software would expect: a reasonable person's expectation is a requirement, and a spec's silence is not permission. Grade such findings by their effect on that person, not by whether the spec mentions the trigger.

## Declined to judge

Before your verdict, list every behavior you considered and set aside as outside the plan or spec, one line each, with the reason. The executor rules on each line; nothing you set aside is dropped silently. An empty list means you set nothing aside.

## Read-Only Review

Your review is read-only on this checkout. Do not mutate the working tree, the index, HEAD, or branch state in any way. Use tools like `git show`, `git diff`, and `git log` to inspect history. If you need a working copy of a different revision, check it out into a separate temporary directory — never move HEAD on this checkout. (Running funnel-check.mjs writes docs/funnel-check.log and .dev/; if you run it, restore the log with `git checkout docs/funnel-check.log`.)

## You Do Not Dispatch Subagents

Do all of this review yourself. Never spawn a subagent to review part of the diff, and never spawn another reviewer for a second opinion. If the diff feels too large for one pass, review it in passes yourself and say so in your report.

## What to Check

Plan alignment (match, justified deviations, missing pieces); code quality (separation, error handling, types, DRY without premature abstraction, edge cases); architecture (soundness, performance, security, integration with surrounding code); testing (real behavior not mocks, edge cases, integration where it matters, all passing); production readiness (docs complete, no obvious bugs).

## Calibration

Categorize issues by actual severity. Not everything is Critical. Acknowledge what was done well before listing issues. Flag significant deviations from the plan specifically. If you find issues with the plan itself rather than the implementation, say so.

## Output Format

### Strengths
### Issues
#### Critical (Must Fix)
#### Important (Should Fix)
#### Minor (Nice to Have)
For each issue: File:line, what's wrong, why it matters, how to fix (if not obvious).
### Declined to judge
### Recommendations
### Assessment
**Ready to merge?** [Yes | No | With fixes]
**Reasoning:** [1-2 sentences]

Rules: be specific (file:line), explain why, give a clear verdict, don't review code you didn't read.
````

</details>

**Verdict:** "With fixes". 0 critical, 2 important, 7 minor. The reviewer read the live tracker script and confirmed
no e-mail can reach Umami (title never changes, thank-you heading is DOM only) and that consent gating holds.

**Fixed (each with a test that failed first):**
1. `form_start` reached Umami before `form_view` on the sticky / "Poslat plán" path (the link focuses the field
   before the scroll ends), so the ordered funnel lost exactly the main mobile path. The lead agent's own Playwright
   log showed it and its expectations didn't check order. Order asserts added to funnel-check (RED), `form_view`
   sent first from the focus handler (GREEN).
2. The full URL went to Umami: Meta's `fbclid` (which Umami stores as an ad click ID) and `/plan`'s selection params;
   the privacy page also omitted region/city and the monthly session hash (checked in Umami's docs and source code:
   `SALT_ROTATION || 'month'`). `keepUtm()` (unit test RED→GREEN) runs in `data-before-send`; funnel-check now sends
   an `fbclid` and asserts it never leaves (RED→GREEN); privacy page and `data/sources.md` §10 updated.

**Deferred minors** (in the ledger, for Matěj): re-consent after a withdrawal before the script loaded; unbounded
queue when an ad blocker blocks the script; the 112 px bar covers the form heading after the sticky-CTA scroll; the
bar is last in keyboard order; "data uložená v EU" holds only if EU is picked at signup; §10 heading still says
"decision open".

## 2026-10-15 — Phase 4 deploy and live verification (Matěj approved Umami + Vercel)

**Who did what:** Matěj created the Umami Cloud account (EU region) and the Vercel project (GitHub import), set
`PUBLIC_UMAMI_WEBSITE_ID` + `SITE_URL` for Production, and logged the Vercel CLI in. The lead agent pushed `master`,
linked the CLI, read the runtime logs, fixed the function and ran the live check.

**Caught on the live URL**
1. `/api/lead` returned 500. Runtime log: `ERR_MODULE_NOT_FOUND: Cannot find module '/var/task/src/lib/data.ts'
   imported from /var/task/api/lead.js`. Vercel compiles the entry file but keeps `.ts` specifiers and doesn't ship
   the imported sources. Fix: `vercel.json` `includeFiles` for `src/lib/**/*.ts` and `data/*.json`; Node 24 runs the
   `.ts` files natively. After the fix: invalid e-mail → 400, valid → `{"ok":true}` (dry-run, no Brevo key yet).
   This was flagged as an unverified risk before the deploy; local dev never exercised Vercel's bundling.
2. The first build had no Umami loader: it ran before the Website ID was saved (the ID is inlined at build time).
   The push for fix 1 rebuilt it.
3. **Lead agent's own:** the first live funnel check "passed" while Umami stored nothing. Umami answers bots
   (headless Chromium's `HeadlessChrome` user agent) with `200 {"beep":"boop"}`, and the check only required a 2xx.
   Found by comparing response bodies for a headless vs. a phone user agent. The live mode now uses a phone UA and
   fails on `beep`; re-run: 53 sends stored, all expectations met (`docs/funnel-check-live.log`).
4. The Vercel CLI's `link` appended `.env*` to `.gitignore`, which would have ignored the committed `.env.example`;
   reverted (the existing `.env.*` + `!.env.example` rules already cover `.env.local`).

**Test data in Umami:** the live runs used the real campaign UTMs (`etf_dvojce_2026q4`). Reset the website's data in
Umami before launch, or filter the report to dates after launch.

---

## 2026-10-15 — Phase 5 QA: provider check and plan (Claude Code, Opus 5.5)

**Asked (Matěj):** start Phase 5. Verify Brevo (limits, sender authentication, EU data, DPA) and the Vercel Hobby
firewall before anything else; plan with `superpowers:writing-plans`; stop before code.

**Skills loaded:** `superpowers:writing-plans`. No subagents.

**Verification:** web search only to find pages; values read from the raw pages (curl + text extraction; Brevo help
articles through the Zendesk JSON API, Vercel docs as `.md`, GitHub docs article API). Table with quotes and URLs in
`docs/superpowers/plans/2026-10-15-phase5-qa.md`, Task 0.

**Caught during the check**
1. Search summaries contradicted each other on Brevo's Free plan (contacts "unlimited" vs. 100 000; API "not on
   free" vs. included) and on Vercel Hobby rate-limit rules ("up to 3" vs. 1). Brevo's own help article (100 000
   contacts, API included) and Vercel's limits table (1 rate-limit rule, 3 custom rules in total) settled it.
2. Not in any earlier decision: **a free mailbox can't be an authenticated Brevo sender**, and Brevo rewrites it to
   `…@<id>.t-sender-sib.com`. We have no domain, so this is a launch blocker and a decision for Matěj.
3. Brevo's Free plan has an **account approval step** before sending, with no stated duration: a schedule risk for the
   16 Oct deadline.
4. Vercel Hobby's maximum rate-limit window is 10 min, so decisions §6a's "per hour" can't be configured as written;
   the client's 429 message ("za hodinu") must change with it.
5. Plan Review Focus: a Brevo *date* attribute would truncate `PLAN_SENT_AT` to the day and break the 24 h dedupe.
   That is a guess about Brevo's behaviour, so it gets a schema test and a live check rather than a claim.

---

## 2026-10-15 — Phase 5 QA: execution (Claude Code, Opus 5.5, inline)

**How it ran:** Matěj approved the plan and all its decisions (sender option A, he creates the Brevo account, Deploy
Hook OK) and the inline method. Skills loaded: `superpowers:executing-plans`, `superpowers:test-driven-development`,
`superpowers:systematic-debugging` (layout shifts), `marketing-skills:cro` (deployed page, findings only),
`ponytail:ponytail-review` (whole repo), `superpowers:verification-before-completion`. No subagents. Ledger in
`.superpowers/sdd/2026-10-15-phase5-qa/progress.md`.

**Done and verified (fresh run before reporting):** `npm test` 82/82 · `npm run build` exit 0 · funnel check local
and live "All expectations met" · `scripts/qa-live.mjs` 8 pages, JS on and off, "All checks passed" · Lighthouse
mobile 3 runs/page: perf/a11y/best-practices 100 on all four pages, LCP 1.2–1.4 s, CLS 0 (`docs/qa/lighthouse.md`) ·
`scripts/check-links.mjs` 110 URLs, 0 broken except the private-repo link · live `/api/lead` region `fra1::fra1`.

**Waiting for Matěj (no account or dashboard access for the agent):** Vercel WAF rule (burst test still 12× 400),
Deploy Hook + `VERCEL_DEPLOY_HOOK` secret, Brevo account/key/attributes/lists and the real-inbox test, making the
GitHub repo public.

**Defects found and fixed (each verified; logic with a test that failed first)**
1. **Font fallback 33 % too large** (deferred shortcut from Phase 3): every page reflowed when Archivo arrived,
   CLS 0.12–0.22 on throttled 4G. Measured Archivo against Arial and Roboto on the site's own text in Chromium:
   `size-adjust` 98 % / 99.7 %, not 130.8 %. Added a Roboto face for Android.
2. **Ad B, CLS 0.138:** Step A was collapsed by a deferred module after the first paint. Now CSS keyed on the
   `html.js[data-variant="b"]` the head script sets before paint.
3. **`/plan`, CLS 0.429:** the plan renders from the URL after load and pushed the footer off screen. The container
   now holds one screen.
4. **`td-has-header`:** plan tables (page and e-mail) had row labels in `<td>` under an empty corner header; now
   `<th scope="row">` (e-mail test RED→GREEN).
5. **`/favicon.ico` 404** on every page (console error in Lighthouse): SVG favicon.
6. **`/api/lead` ran in Washington (iad1)**, Vercel's default: leads crossed the US to reach Brevo in the EU. `regions: ["fra1"]`.
7. **Production dry-run** (`/ponytail-review` #1): without a Brevo key the live function faked success. Now 502 in
   Production (test RED→GREEN; live: valid e-mail 502, honeypot 200).
8. Phase 4 minors: re-consent after withdrawal, unbounded queue on a blocked script (3 tests RED→GREEN); consent bar
   first in tab order and never over the form heading (funnel-check asserts RED→GREEN); sources §10 heading.
9. FAQ / "Jak počítáme" rows had no open/close cue (`display:flex` removed the marker): "+"/"−" (CRO).

**Mistakes caught (agent's own)**
1. `qa-live.mjs` first ignored layout shifts flagged `hadRecentInput` and reported CLS 0 everywhere while Lighthouse
   showed 0.138 and 0.429. Emulated Chrome flags early shifts that way with no input at all; the filter hid both real
   bugs and the font shift. Now every shift counts.
2. The first Lighthouse batch silently produced nothing: no system Chrome, and `--quiet >/dev/null` swallowed the
   error. Re-run with Playwright's Chromium via `CHROME_PATH`, errors visible.
3. Two heredoc/escape slips (CLAUDE.md warns): `<\/table>` lost its backslash in a test, and a CSS `"\2212"` became a
   control character. Both caught by the test run and by a screenshot.
4. The first link check flagged Invesco PDFs and a template URL as broken: Invesco refuses Node's fetch (curl gets
   200), and `YYYY-MM-DD` is a placeholder in `data/sources.md`. Checker fixed; manual curl results in `docs/qa/links.log`.
5. The plan's first draft ran the live funnel check against real Brevo: it would have e-mailed `test@example.com`.
   Caught before the key exists; live mode now fills the honeypot (verified in Vercel logs: 3× honeypot, 0 sends).

**Verification facts that changed the plan:** Brevo blocks API calls from unknown IPs automatically after 30 days
without a new IP (help 5740111683858): added to the launch checklist. Vercel default region iad1 (docs): fixed.

**Not fixed, on purpose:** `/plan` `noindex` (Lighthouse SEO 60) is deliberate; `/chyba-formulare` CLS 0.029 (under
0.1); ad A showing the bank-fund result under the chips before a pick (approved structure; A/B idea);
`scripts/screenshots.mjs` duplicates qa-live's page scan (`/ponytail-review` #3, nice-to-have).

**Update (Matěj, 2026-10-15):** the Vercel Deploy Hook could not be created on this project ("not in free Vercel").
Vercel's docs say Hobby allows 5 hooks per project (docs/deploy-hooks, Limits), so the cause is unconfirmed; recorded
as such. The workflow's `schedule` is commented out so it doesn't fail every weekday without the secret, and the
daily rebuild is a pre-launch item in `docs/readme-drafts/launch-checklist.md`. Until then each deploy fetches the
ČNB rate and the page shows its date.

**Update (Matěj, 2026-10-15): firewall rule and public repo done.** Verified live: 12 POSTs to `/api/lead` from one
IP → 10× 400 (invalid e-mail) then 429; in the browser the JS form shows "Příliš mnoho pokusů z jednoho místa.
Zkuste to prosím za 10 minut." (`form_error reason=rate`). The no-JS form gets Vercel's own English "Too Many
Requests" page: Hobby's rule can only answer 429/deny/challenge, accepted. Repo public: `data/sources.md` 200; link
check 0 broken (`docs/qa/links.log`).

**Update (2026-10-15): Brevo live, first real submit failed.** Matěj's first test showed "Plán se nepodařilo
odeslat". Vercel log: `Brevo GET contacts failed: 401`, status only, so a wrong key and Brevo's IP blocking looked
the same. Diagnosis (`systematic-debugging`): Brevo's error code and message now go into the log, addresses masked
(test RED→GREEN, 83/83); the reproduced call said `401 unauthorized: Key not found`, so not an IP block. The local
`.env.local` key had the right shape (`xkeysib-` prefix, 89 chars) and worked from the agent's machine; the value in
Vercel did not. With Matěj's OK the agent removed `BREVO_API_KEY` (Production) and piped the value from `.env.local`
into `vercel env add --sensitive` (the key never printed), then redeployed. Check with `diag@etfdvojce.invalid`
(undeliverable on purpose): 200, contact on list 4 "Plán", `PLAN_SENT_AT` stored with full time (text attribute,
Review Focus 1 confirmed), contact deleted afterwards. Brevo account read-only check before that: Free plan,
300/day, 17 attributes with the planned types, lists Plán (4) and Novinky (5).
