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
