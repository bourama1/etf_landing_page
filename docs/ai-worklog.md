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
