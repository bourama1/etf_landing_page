# Data notes: conflicts, gaps, open questions, refresh

Snapshot retrieved 2026-10-09. Files: `etfs.json` (fund data), `bank-funds.json` (bank KIDs), `sources.md`
(regulatory/tax/fee claims), `validate.mjs` (checks `etfs.json`).

## Open questions for Matěj (findings that touch Phase 0 decisions)

1. ~~The UCITS tax argument is weaker than decisions.md §0 assumed~~ **Resolved 2026-10-10:** Matěj approved
   the reframing to "acc + estate tax, not lower withholding" (decisions.md §0 leg 2, §2 v2).
2. **Fio is now confirmed from first-party sources** (sources.md §1.2–1.3): Fio's own page says "U nás můžete
   obchodovat i s americkými ETF", and ČNB RS2018-12 B.2 says execution-only access is outside PRIIPs Art. 13(1).
   The "u většiny brokerů" wording in decisions.md §0 still holds. The FAQ item "Fio mi VOO koupit dovolí — co teď?"
   now needs a real answer, and point 1 makes that answer about acc vs dist and estate tax, not withholding.
3. **Return default:** proposed 5 % p.a. (sources.md §6). Needs a yes/no.
4. **VTI and SCHD have no same-index UCITS twin.** Options: (a) show "nemá evropské dvojče" honestly and stop
   there; (b) show the S&P 500 twins as the "nearest available" with a clear label (different index: large caps
   only, while VTI's index covers "approximately 100% of investable companies in the U.S. equity market", per the
   Vanguard factsheet); (c) drop VTI/SCHD from the chips. I'd pick (a) for SCHD and (b)
   for VTI, but it is your call.
5. **QQQ is listed on Nasdaq, not NYSE** (SEC N-CSRS: "QQQ | The Nasdaq Stock Market LLC"). The brief says
   "ETF obchodované na NYSE". Keep QQQ? If kept, the page should say "americká
   ETF", not "ETF z NYSE". VOO, SPY, IVV, VTI, VT and SCHD are on NYSE Arca.

## Source disagreements

| Item | Source A | Source B | Used | Why |
|---|---|---|---|---|
| QQQ expense ratio | Invesco QQQ page: "total expense ratio is 0.18%" | SEC N-CSRS (6 months to 2026-03-31): "0.19%" annualised cost; an Invesco transcript says 0.20 % | **0.18 %** | Issuer's current stated ratio; 0.19 % is the realised cost over a past period |
| Vanguard UCITS assets | vanguard.co.uk/.ch pages (undated), e.g. VUSA fund $88.97B, VGLA $2.57B | Factsheets as at 2026-08-31, e.g. VUSA fund $89,226M, VGLA $660M | **factsheets** | Dated. VGLA launched 2026-08-18 and is growing fast, so its assets go stale quickly |
| VTI name/index | Vanguard factsheet 2026-06-30: "CRSP US Total Market Index" | Vanguard VTI page title (2026-10-09): "Vanguard Morningstar Total Stock Market ETF"; Morningstar release 2026-04-29: renamed "Morningstar US Total Market Index" | **new names** | The rename took effect 2026-07-29 (Vanguard release). Same index, new name |
| Fio and US ETFs | Finzi.cz: EU brokers don't sell US ETFs to retail | Fio's own page + ČNB RS2018-12 | **Fio + ČNB** | Primary sources |
| Estate tax on RIC shares | Search-engine summary: "RIC look-through under §2104(b)" applies | IRS 706-NA instructions (Rev. Sept 2025): look-through only for deaths 2005–2011 | **IRS** | The search summary was outdated (see ai-worklog) |

## Not verified / gaps (must not go on the page as fact)

- **Česká spořitelna:** the price list (supplied by Matěj, byte-identical to the live csas.cz URL on 2026-10-10)
  gives the equity-fund entry fee (3,00 %), ETF trading (0,35 %, min. 4 EUR on Xetra) and custody (0,08 % p.a.). It
  does **not** give the funds' ongoing costs, so the page's ongoing-cost range (1,75–2,59 %) still rests on ČSOB + KB.
  **Conflict:** newstream.cz reports a ČS price change from 18. 5. 2026 (removing the 90 Kč minimum on one-off share/ETF
  purchases), but the live price list is still the 01. 02. 2026 edition. The live document is used.
- **QQQ CUSIP/ISIN:** Invesco shows `46090E103` only as an unlabelled `fid=` link parameter. Left `null`.
- **Invesco UCITS non-Xetra tickers/currencies:** Invesco's listing tables load via JS. Only the Xetra symbols
  (Deutsche Börse pages) and the SIX Bloomberg tickers (factsheets) are recorded; the SIX trading currency is `null`.
- **US 30 % default withholding without W-8BEN:** secondary source only (dostupnyadvokat.cz).
- **Irish fund treaty eligibility (US–IE LOB, Art. 23):** assumed, as issuers do. Not checked per fund.
- **Estate-tax situs for trust-form ETFs (SPY is a unit investment trust):** the IRS text covers "stock of
  corporations". Page wording must be "může podléhat", not "podléhá".
- **IBKR help page:** not readable (403 / JS shell). Not cited.
- **Accumulating funds and Czech tax:** the claim "no Czech tax while holding an accumulating fund" rests on the
  absence of any provision taxing undistributed fund income (§ 8 and § 20b tax distributions, § 10 / § 4 tax sales).
  That is my reading of the statute, not a quoted rule. Wording on the page: "u akumulačního fondu nedostáváte
  dividendy, takže je nedaníte každý rok". Consider confirming with a tax adviser before launch.

- **Fio currency conversion cost:** not published outside the e-Broker app (sources.md §7). The calculator must
  show Fio's commission without FX, labelled as such, or leave Fio out.
- **DEGIRO, Interactive Brokers, Revolut fees:** not researched/verified (sources.md §7).

## Data choices

- **US ISINs** (VOO, IVV, VTI, VT, SCHD) are derived from issuer-published CUSIPs (`node data/validate.mjs --isin
  <cusip>`). The derivation reproduces SPY's issuer-published ISIN, and VTI/SCHD match cbonds.com. SPY's ISIN is
  issuer-published.
- **Assets:** `share_class_assets_musd` is the listed share class (for Vanguard US: "ETF total net assets").
  `fund_assets_musd` is all share classes. Where only one figure exists it goes in `fund_assets_musd`.
- **Euronext Amsterdam** is inferred for Vanguard factsheet rows labelled "NYSE Euronext" from their `.AS` RIC
  codes.
- **Twin lists for VOO/SPY/IVV** contain all six S&P 500 UCITS funds, same-issuer first. Order is not a ranking.

## Refresh

1. Re-download each `sources.default.url` in `etfs.json`. Issuer factsheets are monthly (Vanguard UCITS, iShares,
   SPDR, Invesco) or quarterly (Vanguard US, Schwab).
2. Text extraction: `pdftotext -raw file.pdf` (in Git Bash). **Do not trust `-layout` for tables**: on SPDR and
   Vanguard factsheets it shifts exchange names one row against tickers.
3. Update the values, `as_of` and `retrieved_at`. Run `node data/validate.mjs`. It must print `OK`.
4. Re-check the bank KIDs (`bank-funds.json`, KID dates) and the tax pages in `sources.md` §2–4. Czech tax rules
   change most years.
5. Update the "stav k …" date on the page.
