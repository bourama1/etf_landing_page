# Sources for regulatory, tax and fee claims

Verification list from `docs/decisions.md` §13. Every claim has a source URL, retrieval date and, where the source
gives one, the date the source itself carries. Quotes are verbatim; long quotes are trimmed with "…".
Status: **verified** = primary or reputable source checked directly · **secondary** = only a non-primary source ·
**unverified** = could not be confirmed, must not go on the page.

All retrieved 2026-10-09 unless stated otherwise. Fund figures (TER, AUM, ISIN…) live in `etfs.json`, not here.

---

## 1. PRIIPs / KID: can a Czech retail investor buy a US-domiciled ETF?

### 1.1 Regulation text: **verified**

Regulation (EU) No 1286/2014 (PRIIPs).
Official: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014R1286. EUR-Lex returned a bot challenge
(HTTP 202, empty body) to every automated fetch, so the wording was read from the LawPlayer mirror
https://lawplayer.com/eu/act/32014R1286 (which states that the official text prevails).

- Art. 4(6): "'retail investor' means: (a) a retail client as defined in point (11) of Article 4(1) of Directive
  2014/65/EU …"
- Art. 5(1): "Before a PRIIP is made available to retail investors, the PRIIP manufacturer shall draw up for that
  product a key information document …"
- Art. 13(1): "A person advising on, or selling, a PRIIP shall provide retail investors with the key information
  document in good time …"

### 1.2 ČNB position: **verified**: execution-only access is outside Art. 13(1)

ČNB, *Otázky a odpovědi k nařízení o sdělení klíčových informací (PRIIPs)*, RS2018-12, dated 22. 10. 2018.
https://www.cnb.cz/cs/dohled-financni-trh/legislativni-zakladna/stanoviska-k-regulaci-financniho-trhu/RS2018-12/

- B.2 (question): a bank or securities dealer that "klientům pouze zprostředkovává přístup na zahraniční burzu,
  resp. pouze obstarává nákup investičních nástrojů na pokyn zákazníka (tzv. „execution-only") … přičemž tyto
  nástroje sám aktivně nenabízí".
- B.2 (answer): "Pokud tedy obchodník s cennými papíry provádí pouze execution-only služby v návaznosti na podnět
  investora, resp. pouze „zprostředkovává" přístup na zahraniční burzu, aniž by dané produkty sám nabízel, a
  současně ohledně produktů neposkytuje žádnou poradenskou činnost, nelze jej považovat za subjekt povinnosti
  podle čl. 13 odst. 1 nařízení PRIIPs."
- E.1: "Nabízení produktů spadajících do působnosti nařízení PRIIPs bez odpovídajícího KID je porušením
  nařízení PRIIPs."

**Meaning for the page:** buying a US ETF is not illegal for a Czech retail investor. A Czech broker *may* offer
execution-only access. Most brokers choose not to (1.3). So "u většiny brokerů vám ho neprodají" is accurate, and
"z Česka ho nekoupíte" is wrong.

### 1.3 Broker help pages

| Broker | Source | Quote | Status |
|---|---|---|---|
| **Fio banka** (CZ) | https://www.fio.cz/akcie-investice/etf (page undated, © 2026) | "U nás můžete obchodovat i s americkými ETF." · "Fio banka svým klientům ani dalším osobám nenabízí žádné ETF … svým klientům pouze umožňuje přístup na vybrané trhy" | **verified**: Fio retail clients can trade US ETFs, as execution-only access (matches ČNB B.2) |
| Fio (ČNB quote) | Fio article quoted by Finhacker: https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-2-cast/ | "Česká národní banka … vydala pro obchodníky relativně vstřícné stanovisko a investorům klasické obchodování amerických ETF nadále umožňuje." | **secondary**: the original Fio article was not found; ČNB RS2018-12 B.2 is the primary basis |
| **XTB** | https://www.xtb.com/int/help-center/stocks-and-etfs/adding-a-new-instrument-to-the-offer (updated 2026-02-03) | "We are unable to offer ETFs from the United States (due to the lack of KIDs documentation)." | **verified** |
| **LYNX** (operates in CZ as lynxbroker.cz) | https://www.lynxbroker.com/service/products-and-regulations/regulations/key-information-document/ (undated) | "Retail clients cannot purchase ETFs from countries where the issuer does not publish a KID in accordance with EU regulation." · "Retail clients may still hold or sell existing positions, but new purchases are restricted." · Professional clients excepted. | **verified** |
| Interactive Brokers | https://ibkb.interactivebrokers.com/node/2993 | Not readable: WebFetch got 403 and curl got a JS shell. The search-engine summary says EEA retail clients are blocked, with these workarounds: the issuer's EU fund, CFDs, or professional status. | **secondary**, not cited on the page |

---

## 2. Dividend withholding: US ETF vs. Irish-domiciled UCITS ETF (Czech tax resident)

### 2.1 US → Czech resident: **verified**: 15 %

US–Czech income tax treaty, Art. 10, effective 1 Jan 1993. https://www.irs.gov/pub/irs-trty/czech.pdf
- Art. 10(2)(b): "15 percent of the gross amount of the dividends in all other cases."
- Art. 10(3): "Subparagraph a) of paragraph 2 shall not apply in the case of dividends paid by a United States
  Regulated Investment Company … Subparagraph b) of paragraph 2 shall apply in the case of dividends paid by a
  Regulated Investment Company."
  US ETFs are RICs, so the cap is **15 %**. *(Secondary only, [dostupnyadvokat.cz](https://dostupnyadvokat.cz/en/blog/dividend-taxation):
  the broker applies the treaty rate once the client has signed a W-8BEN, and without it the US withholds 30 %. Not
  for the page unless sourced from irs.gov.)*

### 2.2 US → Irish fund: **verified**: 15 % at fund level

US–Ireland income tax treaty, Art. 10(2)(b), effective 1 Jan 1998. https://www.irs.gov/pub/irs-trty/ireland.pdf
- "15 percent of the gross amount of the dividends in all other cases."
- This applies when the Irish fund qualifies for treaty benefits (Art. 23 Limitation on Benefits). Issuers' tax
  disclosures assume it does. That assumption was not checked fund by fund.

### 2.3 Irish fund → Czech resident: **verified**: no Irish withholding on ETF units

Irish Revenue, Tax and Duty Manual Part 27-01A-02 *Investment Undertakings*, last updated January 2026.
https://www.revenue.ie/en/tax-professionals/tdm/income-tax-capital-gains-tax-corporation-tax/part-27/27-01a-02.pdf
- §4.2.3: "any transaction in relation to, or in respect of, units which are held in a recognised clearing system
  does not require the deduction of exit tax. This would be the case for an ETF where the units/shares in the
  underlying fund are bought and sold between investors on the stock market and are cleared through a recognised
  clearing system."

### 2.4 Czech taxation of foreign dividends: **verified**

Zákon č. 586/1992 Sb., o daních z příjmů, version 157 (01.08.2026 – 31.12.2026). https://www.zakonyprolidi.cz/cs/1992-586
- § 20b(1): "Do samostatného základu daně se zahrnují veškeré příjmy z podílů na zisku … a to ve výši včetně daně
  sražené v zahraničí, plynoucí poplatníkům … ze zdrojů v zahraničí".
- § 16a(1): "Sazba daně pro samostatný základ daně činí 15 %."
- § 38f(1)–(2): double taxation is relieved under the treaty; the credit method reduces Czech tax by tax paid abroad.
- § 38g(2): an employee with a signed prohlášení need not file a return if "nemá jiné příjmy podle § 7 až 10 vyšší
  než 20 000 Kč" (exempt income excluded).

### 2.5 What this adds up to (my analysis, built only on 2.1–2.4)

For the **US-dividend part** of an S&P 500 fund, a Czech resident with a W-8BEN ends up at about **15 % either way**:

| Fund | US tax | Irish tax | Czech tax | Total on the US dividend | Annual paperwork |
|---|---|---|---|---|---|
| US ETF (VOO) | 15 % withheld | – | 15 % minus 15 % credit = 0 | ≈ 15 % | foreign dividends go in the return (if they exceed the § 38g(2) limit) |
| Irish **accumulating** (CSPX, VUAA) | 15 % inside the fund | none | none until sale; the gain is exempt after 3 years (§ 4/1/u) | ≈ 15 % | none while holding |
| Irish **distributing** (VUSA) | 15 % inside the fund | none | 15 % on the payout, nothing to credit | ≈ 15 % + 15 % of the remainder | payouts go in the return |

**Conclusion: the "Irish ETFs halve your dividend tax" argument common on English-language forums does NOT hold for
a Czech resident with a W-8BEN.** It is true for residents of countries without a US treaty. For CZ the honest
tax arguments for UCITS are: (a) accumulating share classes exist, so there are no payouts to declare; (b) US
estate-tax exposure is avoided (§3). An Irish *distributing* fund is the least tax-efficient of the three for a Czech
resident. ⚠ This weakens Phase 0 "leg 2" (decisions.md §0) and has been raised with Matěj.

---

## 3. US estate tax for non-US holders: **verified**

- IRS, *Some nonresidents with U.S. assets must file estate tax returns*, page updated 27-Jun-2026.
  https://www.irs.gov/individuals/international-taxpayers/some-nonresidents-with-us-assets-must-file-estate-tax-returns
  — the executor must file Form 706-NA "if the fair market value at death of the decedent's U.S.-situated assets
  exceeds $60,000"; US-situated assets include "Stock of corporations organized in or under U.S. law".
- IRS, *Instructions for Form 706-NA* (Rev. September 2025). https://www.irs.gov/pub/irs-pdf/i706na.pdf
  - "stock of corporations organized in or under U.S. law is property located in the United States, and all other
    corporate stock is property located outside the United States."
  - The RIC look-through (part of RIC shares treated as non-US) applied only "For an NRNC decedent who died after
    2004 and before 2012" (§ 2105(d)). It does not apply today.
  - "In general, the maximum unified credit is $13,000."
- IRS, *Estate & gift tax treaties (international)*, updated 08-Sep-2026.
  https://www.irs.gov/businesses/small-businesses-self-employed/estate-gift-tax-treaties-international
  — 15 treaty countries. **The Czech Republic is not one of them.** (Ireland is.)

**Meaning for the page:** shares of a US-domiciled ETF can count as US-situated assets of a Czech holder. Above
$60 000 the estate must file a US return and may owe US estate tax. Shares of an Irish ETF are "other corporate stock"
and fall outside this. ⚠ Nuance: some US ETFs are trusts, not corporations (SPY is a unit investment trust). The IRS
text speaks of "stock of corporations". The page should say "může podléhat", not "podléhá". See NOTES.md.

---

## 4. Czech tax on selling securities (2026 rules): **verified**

Zákon č. 586/1992 Sb., version 157 (01.08.2026 – 31.12.2026). https://www.zakonyprolidi.cz/cs/1992-586
- **Annual value test, § 4 odst. 1 písm. t):** "příjmy z úplatného převodu cenných papírů, pokud jejich úhrn u
  poplatníka nepřesáhne ve zdaňovacím období částku 100000 Kč". This is the gross sale proceeds, not the gain.
- **Time test, § 4 odst. 1 písm. u):** "příjem z úplatného převodu cenného papíru, přesáhne-li doba mezi nabytím
  a úplatným převodem tohoto cenného papíru při jeho úplatném převodu dobu 3 let". Excludes securities held in
  business assets (obchodní majetek).
- **Cap:** § 4 odst. 3 now applies the 40 000 000 Kč cap **only to cryptoassets** (písm. zk). There is no cap for
  securities.

Finanční správa, *Daňové novinky pro rok 2026*, 5. 1. 2026.
https://financnisprava.gov.cz/cs/financni-sprava/media-a-verejnost/tiskove-zpravy-gfr/tiskove-zpravy-2026/danove-novinky-pro-rok-2026
- "Od 1. ledna 2026 se ruší limit 40 milionů korun pro osvobození příjmů fyzických osob z prodeje cenných papírů …
  pokud byl splněn tzv. časový test" · "Vedle toho je zachován také tzv. hodnotový test pro osvobození stanovený na
  100 tisíc korun." · "U kryptoaktiv se limit 40 milionů korun nemění."

Statute and Finanční správa agree. The cap removed in 2026 had applied only in 2025 (secondary:
[TPA](https://www.tpa-group.cz/news/zruseni-limitu-pro-osvobozeni-prijmu-z-prodeje-obchodnich-podilu-a-cennych-papiru/)).

---

## 5. Czech bank equity funds: entry fee and ongoing costs (ad B): **entry fees verified for 3 of 3 big banks, ongoing costs for 2**

Read straight from the PRIIPs KIDs (sdělení klíčových informací). Machine-readable copy: `bank-funds.json`.

| Fund (manager, bank) | ISIN | KID date | Entry (max) | Ongoing costs p.a. | Transaction costs p.a. | Exit | Source |
|---|---|---|---|---|---|---|---|
| ČSOB Akciový (ČSOB Asset Management, ČSOB) | 770000001170 | 1. června 2026 | **3,00 %** ("Max. 3,00% z částky, kterou zaplatíte při vstupu") | **2,59 %** ("Jedná se o odhad, protože za uplynulý rok zatím nejsou k dispozici žádné skutečné údaje.") | 0,39 % | 0 | https://multimediafiles.kbcgroup.eu/ng/feed/am/funds/KID/KID_770000001170_CS.PDF |
| KB Portfolio – Akciových indexů – Exclusive (Amundi Czech Republic IS, KB) | CZ0008478492 | 24/04/2026 | **5,00 %** ("distribuční náklady ve výši 5,00 % investované částky. Jedná se o maximální částku") | **1,75 %** ("založena na skutečných nákladech za minulý rok") | 0,09 % | 0 (but "osoba, která vám produkt prodává, jej může účtovat") | https://www.amundi-kb.cz/storage/app/media/KIID/KIID_CZ0008478492.pdf |
| Česká spořitelna – akciové fondy skupiny Erste (price-list category) | — | price list effective 01. 02. 2026 | **3,00 %** ("Cena za obstarání nákupu podílových listů fondů skupiny Erste … Akciové fondy 3,00 %"); third-party equity funds 4,00 % | **not in price list** (needs a fund KID) | — | "stanovena vždy statutem" | *Ceník investování a investování PLUS*, https://www.csas.cz/banka/content/inet/internet/cs/RR_SK.INV..xml,pdf_IE |

The ČSOB KID also states the total effect: "Dopad ročních nákladů … 3,4% každý rok" over the 8-year recommended holding
period. Despite its name, the KB fund is **not** an index fund. Its KID says it invests in a "diverzifikovaného
portfolia investičních fondů" (Amundi group funds only), "Fond nesleduje žádný specifický index", and it is actively
managed. Its aim is to beat "indexů zaměřených na globální akciové trhy". The page must not call it an index fund.

**Page/ad wording rule:** entry fees are maxima, so write "vstupní poplatek až 3–5 %", never "3–5 %". Ongoing
costs are "1,75–2,59 % ročně", with fund names and KID dates in the source line. Per decisions.md §4, no bank name
goes in the headline.

## 6. Default return assumption for the calculator: **verified source, value needs Matěj's decision**

UBS *Global Investment Returns Yearbook 2026, public summary edition* (Dimson, Marsh, Staunton; DMS Database 2026),
published 2026-03-03. https://www.ubs.com/content/dam/assets/wm/static/cio/documents/giry2026-summary-public.pdf
- Figure 12, USA 1900–2025: nominal "Equities 9.8% per year … Inflation 2.9% per year"; real "Equities 6.6% per year
  Bonds 1.6% per year Bills 0.5% per year".
- Section 4: "the annualized return from investing in EM over the period was 6.9% compared with 8.5% from DM"
  (1900–2025).

Candidates (decision in NOTES.md, open question 3):
- **5 % p.a. (proposed default):** deliberately below every long-run figure above, labelled "předpoklad, ne
  předpověď", adjustable 0–10 %. The page would cite the UBS numbers as context, not as a forecast.
- 6,6 % (US real, 1900–2025) or 8,5 % (DM nominal, USD): sourced, but they come from the best-performing market or
  currency and would read as a promise.

The fee comparison (bank fund vs ETF) is what ad B sells. Its CZK gap grows with the return assumption, so a lower
default understates our own argument. That is the honest direction to err in.

---

## 7. Broker costs for the ETF side of the fee comparison: **verified for 4 brokers** (retrieved 2026-10-10)

Scenario: buying a EUR-listed UCITS ETF on Xetra from a CZK account. Machine-readable copy: `brokers.json`.
Listed for cost realism in the calculator, not as a recommendation (decisions.md §2: no ranking, no affiliate links).

| Broker | Commission | Currency conversion | Custody | Source |
|---|---|---|---|---|
| **XTB** | "0%, minimálně 0 EUR" until 100 000 EUR monthly turnover, then "0.2%, minimálně 10 EUR" | **0,5 %**: "Všechny měnové konverze související s obchodováním … podléhají 0,5% přirážce" | 0,02 % p.a. only above 250 000 EUR | *Tabulka poplatků a provizí XTB ze dne 29. dubna 2026*, https://www.xtb.com/cz/soubory/tabulka-poplatku-a-provizi.pdf |
| **Trading 212** | "Trading commission: Free" | **0,15 %**: "spot rate + 0.15% FX fee" when the instrument's currency differs from the account's | "Custody Fee: Free" | Help centre (pages undated): [fees](https://helpcentre.trading212.com/hc/en-us/articles/11471996799517-What-are-the-fees-in-the-Invest-ISAs-and-SIPP), [FX fee](https://helpcentre.trading212.com/hc/en-us/articles/360018909758-What-is-the-FX-fee-Invest-Stocks-ISA) |
| **Fio e-Broker** | Xetra: **3,95 EUR** per trade up to 1 400 EUR; 4,95 EUR up to 3 000 EUR; above that 0,15 %, min. 6,95 EUR. On a DIP account, 1,98 EUR up to 500 EUR | **not published**: "Měnová konverze probíhá vždy za devizové kurzy, které naleznete přímo v aplikaci e-Broker." | "IN uložené na sběrném účtu pro obchodování na DB XETRA zdarma" | *Ceník základních služeb*, effective 1. 7. 2026, https://www.fio.cz/docs/cz/C_zaklad.pdf · https://www.fio.cz/akcie-investice/dalsi-sluzby-fio/devizove-konverze |

| **Česká spořitelna** | Xetra/Tradegate: **0,35 %, minimálně 4 EUR**; regular fractional orders via internet banking 0,35 % without minimum | not stated in the price list | **0,08 % ročně** ("Zahraniční kotované akcie … 0,08 % ročně"; ETFs are priced "stejné ceny … ETF") | *Ceník investování a investování PLUS*, effective 01. 02. 2026, https://www.csas.cz/banka/content/inet/internet/cs/RR_SK.INV..xml,pdf_IE |

**Worked example** (computed with `brokers.json`): a monthly purchase of 125 EUR at Fio costs 3,95 EUR, i.e.
**3,16 %** of the purchase (1,58 % on a DIP account), before currency conversion. At small monthly amounts a fixed
fee can cost more than a bank fund's entry fee. The calculator must show this honestly and not assume 0 %.

**Not covered:** DEGIRO. No official Czech fee schedule could be fetched, and secondary sources disagree on Core
Selection limits and the connectivity fee. Also not covered: Interactive Brokers and Revolut. Spreads on the
exchange itself (bid/ask) are not included for any broker.

**Not used:** a Fio table on the devizové konverze page shows EUR at 23,65157 / 25,08943 CZK. The page labels the
table "aktuální devizové kurzy ČNB", but ČNB publishes a single rate, so it is unclear which rate this is. It is not
cited as Fio's conversion spread.
