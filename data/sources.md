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
- § 8(1)(a): příjmy z kapitálového majetku jsou "podíly na zisku obchodní korporace nebo podílového fondu, je-li
  v něm podíl představován cenným papírem".
- § 8(3): the § 36 withholding applies only to such income "plynoucí ze zdrojů na území České republiky".
- § 8(4): "Plynou-li příjmy uvedené v odstavci 1 písm. a) až d) a i) ze zdrojů v zahraničí, jsou nesnížené o výdaje
  základem daně (dílčím základem daně)."
- § 8(8): "Příjem podle odstavce 4 … plynoucí ze zdrojů v zahraničí lze zahrnout do samostatného základu daně
  zdaňovaného sazbou daně podle § 16a. Zahrne-li se takový příjem do tohoto základu daně, zahrnou se do tohoto
  základu daně veškeré příjmy podle věty první."
- § 16a(1): "Sazba daně pro samostatný základ daně činí 15 %."
- § 38f(1)–(2): double taxation is relieved under the treaty; the credit method reduces Czech tax by tax paid abroad.
- § 38g(2), full condition: an employee with a signed prohlášení need not file if, "vyjma příjmů od daně osvobozených
  a příjmů, z nichž je vybírána daň srážkou sazbou daně podle § 36, nemá jiné příjmy podle § 7 až 10 vyšší než
  20 000 Kč".

**Correction 2026-10-15:** this section first cited § 20b(1). § 20b is in Part Two (corporate income tax, "poplatníkům
uvedeným v § 17 odst. 3") and does not apply to individuals. The individual rules are § 8(4), § 8(8) and § 16a above.

**Filing duty (resolves the § 38g(2) question):** foreign dividends are § 8 income (§ 8(4)), are not exempt, and are
not withheld under § 36 (§ 8(3) covers Czech-source income only). So they **count toward the 20 000 Kč limit**: an
employee whose foreign dividends plus other § 7–10 income exceed 20 000 Kč a year must file a return.

Finanční správa, *Pokyny k vyplnění přiznání k dani z příjmů fyzických osob za zdaňovací období 2026*, 25 5405/1
vzor č. 34, https://financnisprava.gov.cz/assets/tiskopisy/5405-1_34.pdf: ř. 38 takes § 8 income "ze zdrojů na
území České republiky i … ze zdrojů v zahraničí", which "nejsou zdaněny zvláštní sazbou daně podle § 36 zákona nebo
v režimu § 16a zákona". *Příloha č. 4* (25 5405/P4 vzor č. 13, …/5405-P4_13.pdf), ř. 401a: "Příjmy podle § 8
odst. 1 písm. a) až f) a i) zákona plynoucí ze zdrojů v zahraničí" (the optional 15 % separate base). The
instructions do not restate the 20 000 Kč condition, so that rests on § 38g(2) itself.

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

**Distribution inducements at ČS** (*Základní informace o poskytování investičních služeb Českou spořitelnou*,
undated, https://www.csas.cz/banka/content/inet/internet/cs/zakladni_informace_o_poskytovani_is.pdf, byte-identical to the copy Matěj downloaded): "Pobídky od správců fondů kolektivního investování
mají zpravidla podobu poplatku z objemu obhospodařovaného majetku ve fondu (jako naše odměna za distribuci těchto
produktů)": Fondy EAM ČR a REICO, akciové fondy **0 až 1,65 %**; Fondy EAM, akciové fondy 0 až 1,17 %; fondy
třetích stran 0 až 1,25 %. This is part of what the fund charges each year, paid on to the distributing bank. It
is **not** the fund's total ongoing cost, and no TER may be derived from it. Usable in the plan e-mail as context ("z
ročního poplatku fondu může banka dostávat provizi až …"), with the source.

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

**Machine fields (Phase 3):** `brokers.json` adds `id` and numeric `custody_pct` read from the Custody column above (XTB 0: the 0,02 % applies only above 250 000 EUR, beyond the calculator range; T212 0; Fio 0; ČS 0,08).

**Worked example** (computed with `brokers.json`): a monthly purchase of 125 EUR at Fio costs 3,95 EUR, i.e.
**3,16 %** of the purchase (1,58 % on a DIP account), before currency conversion. At small monthly amounts a fixed
fee can cost more than a bank fund's entry fee. The calculator must show this honestly and not assume 0 %.

**Not covered:** DEGIRO. No official Czech fee schedule could be fetched, and secondary sources disagree on Core
Selection limits and the connectivity fee. Also not covered: Interactive Brokers and Revolut. Spreads on the
exchange itself (bid/ask) are not included for any broker.

**EUR/CZK rate for fixed EUR fees:** ČNB API, https://api.cnb.cz/cnbapi/exrates/daily?date=YYYY-MM-DD&lang=CZ
(docs: https://api.cnb.cz/cnbapi/swagger-ui.html). Checked 2026-10-15: EUR `rate` 24.355 `validFor` 2026-10-14; a
weekend date returns the previous business day (2026-10-11 → 2026-10-09, 24.365). Fetched at build time, refreshed
daily (decisions.md §14 #10). This is the ČNB fixing, not any broker's conversion rate.

**Not used:** a Fio table on the devizové konverze page shows EUR at 23,65157 / 25,08943 CZK. The page labels the
table "aktuální devizové kurzy ČNB", but ČNB publishes a single rate, so it is unclear which rate this is. It is not
cited as Fio's conversion spread.

## 8. PRIIPs KIDs of the UCITS twins: **verified, 13 of 13 have a KID** (retrieved 2026-10-15)

Each KID was downloaded from the issuer, read with `pdftotext -raw`, and checked for the expected ISIN and the date
printed inside. Machine-readable: `etfs.json` → `sources.kid` (URL, date) and `kid_cs`.

| Twin | ISIN | KID in Czech | Date in the KID | How the Czech version was checked |
|---|---|---|---|---|
| SXR8 | IE00B5BMR087 | **yes** | 3. 9. 2026 | linked from BlackRock's Czech product page; file `…-cs.pdf` |
| SXRV | IE00B53SZB19 | **yes** | 3. 9. 2026 | same BlackRock pattern, `…-cs.pdf` |
| IUSA | IE0031442068 | **not found** | 3. 9. 2026 (EN) | `-en.pdf` and `-de.pdf` exist at the same slug, `-cs.pdf` does not |
| SPYL | IE000XZSV718 | **yes** | 19. 2. 2026 | SSGA `kids?…&country=cz` returns `kid-cz-cs-spyl-gy.pdf` |
| SPY5 | IE00B6YX5C33 | **not found** | 19. 2. 2026 (EN) | the same SSGA request with `country=cz` returns 404; `country=ie` works |
| EQQB | IE00BFZXGZ54 | **not determined** | 26. 6. 2026 (EN) | Invesco's URL pattern 404s for Czech, but also for Italian, so a 404 proves nothing |
| EQQQ | IE0032077012 | **not determined** | 26. 6. 2026 (EN) | as EQQB |
| VUAA | IE00BFMXXD54 | **yes** | 24. 3. 2026 | `fund-docs.vanguard.com/<isin>_priipskid_cz.pdf` |
| VUSA | IE00B3XXRP09 | **yes** | 24. 3. 2026 | same |
| VGLA | IE000VAHT5T0 | **yes** | 20. 8. 2026 | same |
| VGLD | IE000CVUM3N6 | **yes** | 20. 8. 2026 | same |
| VWCE | IE00BK5BQT80 | **yes** | 28. 7. 2026 | same |
| VGWL | IE00B3RBWM25 | **yes** | 28. 7. 2026 | same |

**Meaning for the page:** "má KID" is true for every twin. "KID v češtině" may be shown only where `kid_cs` is true.
"Not found" means the issuer's own Czech route doesn't return one; it is not proof that none exists anywhere.

## 9. GDPR and Czech law: legal basis for the plan e-mail and the newsletter: **verified (statute text), reading recorded** (retrieved 2026-10-15)

Not legal advice. Statute quotes are verbatim; the conclusions are my reading and are marked as such. A lawyer
should confirm them before launch (listed in the README).

### 9.1 Sources

| Source | Quote (verbatim, trimmed) |
|---|---|
| GDPR (EU) 2016/679 art. 6(1)(a), (b), (f). Official: https://eur-lex.europa.eu/eli/reg/2016/679/oj (EUR-Lex blocks automated fetches; text read from the mirror https://gdpr-info.eu/art-6-gdpr/) | (b) "processing is necessary for the performance of a contract to which the data subject is party or in order to take steps at the request of the data subject prior to entering into a contract"; (f) "necessary for the purposes of the legitimate interests pursued by the controller … except where such interests are overridden by the interests or fundamental rights and freedoms of the data subject" |
| GDPR art. 7(1)–(4) (mirror https://gdpr-info.eu/art-7-gdpr/) | (1) "the controller shall be able to demonstrate that the data subject has consented"; (2) "clearly distinguishable from the other matters"; (3) "right to withdraw his or her consent at any time … as easy to withdraw as to give consent"; (4) "whether … the provision of a service, is conditional on consent to the processing of personal data that is not necessary for the performance of that contract" |
| GDPR art. 13(1)–(2) (mirror https://gdpr-info.eu/art-13-gdpr/) | controller identity and contact, purposes and legal basis, the legitimate interests where (f) is used, recipients, retention period, rights (access, erasure, objection…), right to withdraw consent, right to lodge a complaint |
| GDPR art. 21(1), (4) (mirror https://gdpr-info.eu/art-21-gdpr/) | (1) right to object to processing based on (e) or (f); (4) "At the latest at the time of the first communication with the data subject, the right … shall be explicitly brought to the attention of the data subject and shall be presented clearly and separately from any other information." |
| EDPB Guidelines 2/2019 on art. 6(1)(b), version 2.0, 8 October 2019, https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines-art_6-1-b-adopted_after_public_consultation_en.pdf | para. 2: "If the specific processing is part and parcel of delivery of the requested service, it is in the interests of both parties to process that data"; para. 25: "Article 6(1)(b) will not cover processing which is useful but not objectively necessary for performing the contractual service …, even if it is necessary for the controller's other business purposes." |
| Zákon č. 480/2004 Sb., o některých službách informační společnosti, znění k 23. 3. 2023 (verze 12), https://www.zakonyprolidi.cz/cs/2004-480 | § 2 písm. f): obchodní sdělení = "všechny formy sdělení, včetně reklamy a vybízení k návštěvě internetových stránek, určeného k přímé či nepřímé podpoře zboží či služeb nebo image podniku osoby, která je podnikatelem"; § 7 odst. 2: "Podrobnosti elektronického kontaktu lze za účelem šíření obchodních sdělení elektronickými prostředky využít pouze ve vztahu k uživatelům, kteří k tomu dali předchozí souhlas."; § 7 odst. 3: the customer exception applies to contacts obtained "v souvislosti s prodejem výrobku nebo služby"; § 7 odst. 4: every commercial e-mail must be marked as such, show the sender and carry a valid opt-out address |

### 9.2 What follows for ETF Dvojče (my reading)

1. **Sending the requested plan:** art. 6(1)(b). The visitor asks for a free plan; delivering it to the given
   address is "part and parcel of delivery of the requested service" (EDPB para. 2). Not consent: the plan is a
   one-off delivery the visitor asked for, and making it depend on consent would add nothing.
2. **Storing selections, UTM and `ad_variant` with the contact:** not necessary for the delivery (EDPB para. 25), so
   **art. 6(1)(f)**: legitimate interest in knowing which ad brings requests and in the 24 h dedupe / abuse checks.
   Because of (f), art. 21(4) requires the right to object to be pointed out **clearly and separately at the
   latest in the first communication**, which is the plan e-mail.
3. **Newsletter:** a commercial communication under § 2 f). The visitor is not a customer who bought anything, so the
   § 7(3) exception does not apply; **§ 7(2) prior consent** is required, which under GDPR is art. 6(1)(a) with
   art. 7: separate unticked checkbox (7(2)), stored proof (7(1): `NEWSLETTER_CONSENT_AT`, `CONSENT_TEXT_V`),
   one-click withdrawal (7(3)), plan not conditional on it (7(4)). Every newsletter must be marked as obchodní
   sdělení and carry an opt-out address (§ 7(4)).
4. **The plan e-mail itself** is the information the visitor requested and promotes nothing, so it should not be an
   obchodní sdělení. It must stay that way: no offers, no "přihlaste se k odběru", no third-party promotion. Even if
   it were classed as one, it is sent at the visitor's own explicit request.
5. **Retention (proposal):** contacts without newsletter consent are deleted 12 months after their last request
   (long enough for dedupe and the campaign evaluation); newsletter contacts until they unsubscribe, then the consent
   record is kept as proof for 3 years. Placeholder in the privacy notice until Matěj confirms.

**Consequence for the build:** the form does not change (e-mail + optional unticked newsletter checkbox + privacy
link). The plan e-mail footer needs **one added line** for art. 21(4) (point 2). The privacy notice covers art. 13.

## 10. Cookieless analytics (Umami) and § 89(3) ZEK: **verified (statute + EDPB text); ÚOOÚ position only secondhand; decided 2026-10-15: consent bar (decisions §16 #7)** (retrieved 2026-10-15)

Not legal advice. Quotes verbatim; conclusions are my reading.

### 10.1 Sources

| Source | Quote (verbatim, trimmed) |
|---|---|
| Zákon č. 127/2005 Sb., o elektronických komunikacích, § 89 odst. 3, https://www.zakonyprolidi.cz/cs/2005-127 (page shows "verze 52") | "Každý, kdo hodlá používat nebo používá sítě elektronických komunikací k ukládání údajů nebo k získávání přístupu k údajům uloženým v koncových zařízeních účastníků nebo uživatelů, získá od těchto účastníků nebo uživatelů předem prokazatelný souhlas s rozsahem a účelem jejich zpracování. Tato povinnost neplatí pro technické ukládání nebo přístup výhradně pro potřeby přenosu zprávy … nebo je-li to nezbytné pro potřeby poskytování služby informační společnosti, která je výslovně vyžádána účastníkem nebo uživatelem." |
| EDPB Guidelines 2/2023 on Technical Scope of Art. 5(3) of ePrivacy Directive, version 2.0, adopted 7 October 2024, https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf | para. 33: "Additional examples would include JavaScript code, where the accessing entity instructs the browser of the user to send asynchronous requests with the targeted information. Such access clearly falls within the scope of Article 5(3) ePD"; para. 43: context data "such as HTTP header including 'accept' field or user agent" used "in the context of fingerprinting … can lead to the application of Article 5(3) ePD"; para. 56: "the applicability of this article does not systematically mean that consent needs to be collected … it would have to be assessed if a consent is needed or whether an exemption … could apply" |
| ÚOOÚ, J. Kuba, M. Šnajdr: *Praxe ÚOOÚ v oblasti cookies*, seminar 12 June 2024, https://uoou.gov.cz/media/seminare-uoou/prezentace/2024-06-12-p04-praxe-uoou-v-oblasti-cookies.pdf | cookies "ke sběru informací o uživatelích pro statistické, analytické, marketingové či jiné účely = netechnické cookies"; "Potřeba získat … výslovný souhlas … na základě tzv. principu opt-in"; "Výjimku představují pouze tzv. technické cookies"; "Od roku 2023 vedení správních řízení a udělování pokut"; "Pravomocné pokuty činí již zhruba 2 miliony Kč" |
| eLegal (law firm), *Analytické cookies a podobné technologie v roce 2025*, 7 July 2025, https://elegal.cz/analyticke-cookies-bez-souhlasu (**secondary**: reports ÚOOÚ's written answer to the firm's query; ÚOOÚ's text itself not published) | ÚOOÚ "výslovně potvrdil, že: i cookie-less sledovací nástroje, které vytvářejí jedinečný hash návštěvnického identifikátoru (např. ze zařízení, IP adresy a nastavení prohlížeče), spadají pod tzv. „podobné technologie", a tedy i na ně se vztahuje povinnost získat souhlas …, pokud nespadnou do „nezbytné" kategorie." "Nezbytné" if they: "slouží výhradně k měření návštěvnosti webu, neumožňují celkové sledování navigace osoby, slouží pouze k produkci anonymních statistických dat, jimi shromážděné osobní údaje nejsou spojovány s jinými zpracovávanými údaji, nezpřístupňují data třetím stranám." |
| Umami source, `src/app/api/send/route.ts` (https://github.com/umami-software/umami, master, read 2026-10-15) and https://docs.umami.is/docs/metric-definitions | `const saltRotation = process.env.SALT_ROTATION || 'month'` (session hash salt rotates monthly by default); location metrics "Country", "Region", "City" from the IP; "Ad click IDs are automatically captured from URL query parameters" incl. fbclid. Hence `keepUtm()` strips everything but utm_* before sending. |
| Umami docs: session = "hash generated from the visitor's IP address, user agent, and website ID" (https://docs.umami.is/docs/sessions); the tracker sends screen size and language (https://docs.umami.is/docs/metric-definitions) | — |
| Umami Cloud account (Matěj, 2026-10-15) | Data region **Evropská unie** chosen at signup; the signup app says "Once selected this cannot be changed" (Phase 4 plan, provider table). Source for the privacy page's "Data jsou uložená v Evropské unii". |

### 10.2 What follows for ETF Dvojče (my reading)

1. The Umami script is JavaScript that instructs the browser to send screen size, language and the page URL to Umami
   (EDPB para. 33). § 89(3) therefore applies, cookie or not.
2. The § 89(3) exemption for a service "výslovně vyžádána" does not cover analytics on its own: the visitor asked for
   the page and the plan, not for measurement.
3. Against ÚOOÚ's five "nezbytné" conditions (as eLegal reports them): (4) not combined with other data, met (Umami
   events are not linked to the Brevo contact); (3) anonymous aggregate statistics, met in the reports; (1) "výhradně
   měření návštěvnosti" and (2) "neumožňují celkové sledování navigace osoby" are **doubtful**: the funnel follows one
   visitor's steps through the page within a session (that is its purpose); (5) third parties: Umami acts as a
   processor under a DPA, which I read as not a third party, but its US subprocessors make this arguable.
4. Conclusion: under the EDPB/ÚOOÚ reading, the funnel set-up **probably needs consent**; a pageview-only set-up
   (no per-visitor funnel events) is closer to the exemption but still not clearly inside it. No court decision
   exists (eLegal). The decision changes decisions §11 and goes to Matěj.
