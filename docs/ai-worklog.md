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
