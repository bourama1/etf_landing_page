# Page copy: ETF Dvojče

Status: **Phase 2 draft for review (✋)** · 2026-10-11 · written with `copywriting`, edited with `copy-editing`.
Inputs: `docs/decisions.md` §1–4, §7–10, §14, `.agents/product-marketing.md`, `content/voice-of-customer.md`, `data/`.

**Conventions in this file**
- `{…}`: a value filled at build/run time from `data/` or the tool (never typed by hand).
- `[DOPLNIT …]`: a placeholder that must be filled before launch (listed in the README).
- `[CHYBÍ ZDROJ …]`: a claim that has no source in `data/` yet. It must not ship until sourced or cut.
- `[ROZHODNUTÍ …]`: needs Matěj's decision.
- *Poznámka:* notes for the build (English or Czech), not page copy.
- Section order follows decisions.md §8. Numbers in examples come from `node content/calc-examples.mjs`.

---

## 0. Meta

- `<title>`: Evropské dvojče vašeho ETF | ETF Dvojče
- meta description: Broker vám neprodá VOO? Najděte evropské ETF se stejným indexem a spočítejte si poplatky
  v korunách. U každého čísla zdroj a datum.
- og:title (shared link, from the thank-you share button): Které evropské ETF koupit místo VOO?
- og:description: Ťuknete na americké ETF a uvidíte jeho evropské dvojče. Zdarma, nejsme broker.

---

## 1. Hero

*Poznámka:* both variants must fit a 390×844 viewport *including* the Instagram in-app browser bars (~700 px usable):
headline ≤ 3 lines, sub ≤ 2 lines, then the interactive element, then the trust line. No image.

### 1A. Ad A "blocked trade" (`ad_variant=a`, also the default for `unknown`) → opens on Step A

**Headline:** Broker vám nedovolí koupit VOO? Má evropské dvojče.

**Sub (what they get, one line):** Ťukněte na ETF, které jste chtěli, a uvidíte jeho evropskou verzi se stejným indexem.

**Interactive (= primary action):** label **Které ETF jste chtěli koupit?**, then the chips
`VOO` `SPY` `IVV` `VTI` `QQQ` `VT` `SCHD` `Jiné`

**Trust line:** Nejsme broker a nic neprodáváme. U každého čísla najdete zdroj a datum.

Alternatives considered:
- *Chtěli jste VOO, ale nejde koupit? Má evropské dvojče.* Uses the commenters' "nejde" (VoC theme 1). Keep as an
  A/B candidate.
- *VOO vám broker neprodá. Tady je jeho evropské dvojče.* Stronger, but "neprodá" as a flat statement is false at
  Fio (sources.md §1.3). The question form in the chosen headline stays true for every visitor.

Why: the headline repeats the ad's hook word for word (message match). "nedovolí" mirrors "nedovoluje obchodovat" in
VoC theme 1. The sub promises only what the first tap delivers.

### 1B. Ad B "fees in CZK" (`ad_variant=b`) → opens on Step B, VOO preselected

**Headline:** Kolik vás za 20 let stojí poplatky? Spočítejte si to v korunách.

**Sub:** Bankovní akciový fond, nebo indexové ETF. Nastavte, kolik měsíčně spoříte, a uvidíte rozdíl.

**Interactive (= primary action), live as the slider moves:**
- Měsíčně spořím: **{3 000 Kč}** (slider)
- Jak dlouho: **{20 let}** (slider)
- Výnos trhu {5 %} ročně · *předpoklad, ne předpověď* · [změnit]
- Result line, `marker` behind the bank-fund number:
  **Kvůli poplatkům budete mít méně o:**
  Bankovní akciový fond **{272 000–339 000 Kč}** · Indexové ETF **{22 000 Kč}**
- Source line: Zdroj: KID fondů ČSOB Akciový (1. 6. 2026) a KB Portfolio – Akciových indexů – Exclusive (24. 4. 2026);
  ETF {VUAA}, factsheet Vanguard, stav k {31. 8. 2026}; poplatky brokera: {ceník}, stav k {datum}. [Jak počítáme]

**Trust line:** Nejsme broker ani banka a nic neprodáváme. U každého čísla najdete zdroj a datum.

Alternatives considered:
- *Bankovní fond, nebo ETF? Rozdíl v poplatcích vám ukážeme v korunách.* Clearer for P2, but it drops the ad's
  question and loses the message match.
- The draft ad line "Za 30 sekund" was dropped: it's a time promise we haven't measured.

Why: P2 talks about "vstupní poplatek" and suspects a "trik pro prodejce" (VoC theme 5). Percentages don't land with
them, crowns do. The number is a range of two real bank funds, so it doesn't rest on the most expensive one. The
headline names no bank (decisions.md §4).

---

## 2. Tool → partial result → inline e-mail ask

*Poznámka:* one flow, three steps (decisions.md §4). Visitors from ad A start at Step A, visitors from ad B at Step B
with VOO preselected (Step A is then shown collapsed above as "Vybráno: VOO · změnit").

### Step A: the translator

**Label:** 1. Které ETF jste chtěli koupit?
**Chips:** VOO · SPY · IVV · VTI · QQQ · VT · SCHD · Jiné (multi-select)
**Helper under the chips (before the first tap):** Můžete vybrat víc.

**After a tap, per chip** (the US ticker gets the strike-through, the twins slide in):

- US ticker state label (`blocked`, always with text): **U většiny brokerů nejde koupit**
- Twin header, S&P 500 (VOO, SPY, IVV): **{6} evropských ETF sleduje stejný index S&P 500.**
- Twin header, QQQ: **{3} evropská ETF sledují stejný index Nasdaq-100.**
- Twin header, VT: **{2} evropská ETF sledují stejný index FTSE Global All Cap.** Below them, labelled:
  *Podobné, jiný index (bez malých firem):* {VWCE, VGWL}.
  Note under VGLA/VGLD: Nový fond, obchoduje se od {18. 8. 2026}.
- Twin row: **{SXR8}** · {iShares Core S&P 500 UCITS ETF} · TER {0,07 %} ročně · {Akumulační} · Zdroj: {iShares},
  stav k {30. 9. 2026}
  - Akumulační = dividendy reinvestuje. Distribuční = dividendy vyplácí.
- Under the list: Stejný fond má na každé burze jiný ticker: {SXR8} na Xetře je v Londýně {CSPX}. Jistotu dává jen
  ISIN, ten najdete v plánu.
- Line under the list (all chips): Pořadí není doporučení.

**VTI** (no same-index twin, decisions.md §14 #4):
VTI sleduje celý americký trh, včetně malých firem. Evropské ETF se stejným indexem jsme nenašli.
Nejbližší dostupné jsou fondy na S&P 500: *jiný index, jen velké firmy.* {S&P 500 twin rows}

**SCHD** (decisions.md §14 #4):
SCHD nemá evropské dvojče. ETF se stejným indexem (Dow Jones U.S. Dividend 100) jsme v Evropě nenašli.

**Jiné:**
Zatím porovnáváme {7} amerických ETF, na která se lidé ptají nejčastěji. U jiného fondu zjistěte, jaký index
sleduje (je na stránce vydavatele), a hledejte evropské ETF se stejným indexem.

**Next button:** Pokračovat na poplatky

### Step B: fees in CZK

**Label:** 2. Kolik měsíčně a na jak dlouho?
- Měsíčně spořím: {3 000 Kč} (slider; range decided in Phase 3)
- Jak dlouho: {20 let}
- Výnos trhu: {5 %} ročně. *Předpoklad, ne předpověď.* Pro srovnání: americké akcie vynesly v letech 1900–2025
  v průměru 6,6 % ročně nad inflaci. Zdroj: UBS Global Investment Returns Yearbook 2026. Minulá výkonnost není
  zárukou budoucích výnosů.
- **Kde nakupujete?** XTB · Trading 212 · Fio · Česká spořitelna · Nevím
  - helper: Poplatky ETF počítáme i s poplatkem brokera a směnou měny. Nejde o srovnání ani doporučení brokerů.
  - Nevím (default): počítáme s nejvyšší zveřejněnou přirážkou za směnu, {0,5 %}.
  - Fio: Fio nezveřejňuje kurzovou přirážku, počítáme jen poplatek za obchod.
  - Česká spořitelna: ceník neuvádí kurzovou přirážku, počítáme jen poplatek za obchod a úschovu.
  - Fio / ČS at small amounts, when the fixed fee is above {2 %} of the payment: Při {3 000 Kč} měsíčně je pevný
    poplatek {3,95 EUR} asi {x} % z každého nákupu. Méně častý, větší nákup vyjde levněji.
    [CHYBÍ ZDROJ: kurz EUR/CZK. The CZK→EUR conversion for fixed fees needs a dated ČNB rate in `data/`.]

**Live result line:** (same as hero B) **Kvůli poplatkům budete mít méně o:** Bankovní akciový fond
**{272 000–339 000 Kč}** · Indexové ETF **{22 000 Kč}**

**Expandable "Jak počítáme":**
Každý měsíc vložíte stejnou částku. U bankovního fondu z ní odečteme vstupní poplatek ({3–5 %}, maximum podle KID) a
každý rok průběžné náklady ({1,75–2,59 %}). U ETF odečteme poplatek fondu (TER), poplatek za obchod a směnu měny při
nákupu i prodeji. Nepočítáme transakční náklady fondů, rozpětí cen na burze ani daně. Rozdíl je to, o kolik méně
budete mít na konci proti investici bez poplatků.
Zdroje: KID ČSOB Akciový (1. 6. 2026), KID KB Portfolio – Akciových indexů – Exclusive (24. 4. 2026), ceníky
brokerů ({XTB 29. 4. 2026, Trading 212, Fio 1. 7. 2026, ČS 1. 2. 2026}), factsheet {fondu}.
*Poznámka:* the KB fund is actively managed and tracks no index (sources.md §5). Never call it an index fund.

**Next button:** Ještě jedno upřesnění

### Step C: one filter

**Label:** 3. Co s dividendami?
- Reinvestovat (akumulační)
- Vyplácet (distribuční)
- Nevím, ukažte obojí
- helper: Akumulační fond dividendy nevyplácí, takže je každý rok nedaníte. Distribuční je vyplácí a daníte je.
  *Filtr, ne doporučení.*
  *Poznámka:* wording approved in `data/NOTES.md` (it rests on reading the statute, not a quoted rule).
  Source line: Zdroj: zákon o daních z příjmů, § 20b a § 16a, znění k 1. 8. 2026. Informativní, nejde o daňové
  poradenství.

[ROZHODNUTÍ: decisions.md §4 planned a second filter, "Měna fondu: USD / EUR / nevím". Every twin in `etfs.json` has
fund currency **USD**, so it would filter nothing. VoC theme 2 shows the real confusion is the *trading* currency
(EUR on Xetra vs. USD in London). Proposal: drop the filter (one fewer tap) and state in the twin list "na Xetře
v eurech" and, in the plan, the London USD ticker. Alternative: "V jaké měně nakupujete? Eura (Xetra) / Dolary
(Londýn) / Nevím".]

### Result block

*Poznámka:* square-cornered block with the 2 px ink rule (decisions.md §10). It contains the e-mail ask.

**Header:** Vaše evropská dvojčata
- Per pick: ~~{VOO}~~ → **{SPYL} · {SXR8} · {VUAA}** ({3} akumulační fondy na S&P 500)
- Same-index line: Stejný index {S&P 500}, fond sídlí v Irsku a má KID, takže ho evropský broker smí prodat
  drobnému investorovi. [CHYBÍ ZDROJ: KID per UCITS twin. `etfs.json` doesn't record that a KID exists for each
  fund. Before launch, add the issuer KID URL for each twin, or cut "a má KID".]
- Fee line: Při {3 000 Kč} měsíčně a {20} letech vás poplatky v ETF připraví asi o **{22 000 Kč}**, v bankovním
  akciovém fondu o **{272 000–339 000 Kč}**.
- Small print: Výnos {5 %} ročně je předpoklad, ne předpověď. Minulá výkonnost není zárukou budoucích výnosů.
  **Toto není doporučení.** Zdroje: [Jak počítáme].

### Inline e-mail ask (primary ask, inside the result block)

**Heading:** Chcete to celé, i s daňovým checklistem?
**Body:** Pošleme vám plán e-mailem: ISIN pro vyhledání u brokera, akumulační vs. distribuční pro rezidenta ČR,
poplatky po letech a daně z ETF v Česku 2026.
- Field label: **Váš e-mail** · placeholder: vas@email.cz
- Checkbox (unticked): Chci občas dostat novinky o ETF (nepovinné)
- Button: **Poslat plán**
- Under the button: Jeden e-mail s plánem. Odhlásíte se jedním klikem. [Zásady ochrany osobních údajů]

**States:**
- Sending: Posíláme…
- Empty: Vyplňte e-mail, ať máme kam plán poslat.
- Invalid: Tenhle e-mail nevypadá úplně správně. Zkontrolujete ho?
- Server error: Plán se nepodařilo odeslat. Zkuste to prosím za chvíli znovu.
- Rate limit: Příliš mnoho pokusů z jednoho místa. Zkuste to prosím za hodinu.

### Sticky bar (appears only after the result is shown; hidden while the inline form is on screen)

~~{VOO}~~ → {3} dvojčata · **[Poslat plán e-mailem]**
*Poznámka:* tapping scrolls to the inline form and focuses the field. It never opens a modal (decisions.md §3).

---

## 3. Proč VOO často nejde koupit

**Heading:** Proč vám VOO broker často neprodá

1. **Evropská pravidla chtějí ke každému fondu pro drobné investory dokument KID.** Je to krátký přehled rizik a
   nákladů. Zdroj: nařízení (EU) č. 1286/2014 (PRIIPs), čl. 5 a 13.
2. **Americké fondy KID nevydávají, a tak je většina brokerů drobným investorům neprodá.** XTB i LYNX to píšou
   přímo. LYNX dodává, že co už máte, smíte dál držet i prodat. Zdroj: XTB, centrum nápovědy (3. 2. 2026); LYNX,
   Key Information Document (staženo 9. 10. 2026).
3. **Výjimka je Fio.** Americká ETF u něj koupit jde. Fio k nim neradí a jen provede nákup na váš pokyn, což ČNB
   u takové služby připouští. Zdroj: fio.cz/akcie-investice/etf (staženo 9. 10. 2026); ČNB, Otázky a odpovědi k PRIIPs, RS2018-12, odpověď B.2
   (22. 10. 2018).

**Closing line:** Evropská dvojčata sledují stejný index, jen sídlí v Irsku. [Najít své dvojče] (scrolls to Step A)

*Poznámka:* "jen sídlí v Irsku" is true for all {13} UCITS funds in `etfs.json` (domicile IE). Re-check when funds
are added.

---

## 4. Co je v plánu

**Heading:** Co vám přijde e-mailem

*Poznámka:* show a real screenshot of the rendered e-mail (decisions.md §8), not a mock-up. Captions:

1. **Vaše dvojčata s ISIN.** ISIN zadáte do vyhledávání u brokera a najdete přesně ten fond.
2. **Akumulační, nebo distribuční?** Tabulka pro rezidenta ČR: daň z dividend, papírování a americká dědická daň.
3. **Poplatky po letech v korunách.** Bankovní fond proti ETF, i s poplatky brokera.
4. **Daně z ETF v Česku 2026.** Časový a hodnotový test, co se změnilo od 1. 1. 2026 a kdy dividendy patří do
   přiznání. Informativní, nejde o daňové poradenství.
5. **Jak fond koupit.** Postup, který funguje u každého brokera.

**CTA:** Poslat plán (scrolls to the inline form if the result is shown, otherwise to Step A)

---

## 5. Kdo za tím stojí

**Heading:** Kdo za tím stojí a odkud máme čísla

ETF Dvojče provozuje [DOPLNIT: jméno provozovatele, IČO, sídlo]. Nejsme broker ani banka, neprodáváme fondy a
nemáme od nikoho provize za odkazy.

Čísla o fondech bereme ze stránek a factsheetů vydavatelů (Vanguard, iShares, State Street, Invesco). Poplatky
bankovních fondů z jejich KID, poplatky brokerů z jejich ceníků a daňová pravidla ze zákona o daních z příjmů.
Data jsou ke dni {9. 10. 2026}. U každého čísla na stránce je zdroj.

Kontakt: [DOPLNIT: e-mail provozovatele]

---

## 6. FAQ

**Je to zdarma?**
Ano. Plán vám pošleme za e-mailovou adresu, nic dalšího nechceme.

**Budete mi posílat spam?**
Pošleme jeden e-mail s plánem. Novinky jen tehdy, když zaškrtnete políčko. Odhlásíte se jedním klikem.

**Je to investiční doporučení?**
Ne. Ukazujeme fakta o fondech se stejným indexem a co stojí. Který fond koupíte a jestli vůbec, je na vás.

**Fio mi VOO koupit dovolí. Co teď?**
Koupit ho tam můžete. Pro rezidenta ČR je ale akumulační dvojče jednodušší. Nevyplácí dividendy, takže je nemusíte
každý rok uvádět v daňovém přiznání. A irského fondu se netýká americká dědická daň. U amerického ETF může po
vašem úmrtí vzniknout povinnost podat v USA daňové přiznání k dědictví, pokud máte v USA majetek nad 60 000 USD.
Na dani z dividend neušetříte.
Z amerických dividend se podle smlouvy s USA platí 15 % v obou případech.
Zdroj: smlouva ČR–USA o zamezení dvojímu zdanění, čl. 10; IRS, Some nonresidents with U.S. assets must file estate
tax returns (27. 6. 2026); zákon o daních z příjmů, § 20b. Informativní, nejde o daňové poradenství.

**Kdy z ETF platím daň při prodeji?**
Zisk z prodeje je osvobozený, když mezi nákupem a prodejem uplynou víc než 3 roky. Nebo když za celý rok prodáte
cenné papíry nejvýš za 100 000 Kč. Pozor, limit se počítá z celé částky z prodeje, ne ze zisku. Od 1. 1. 2026 už
3letý test nemá strop 40 milionů Kč. Podrobnosti máte v plánu.
Zdroj: zákon o daních z příjmů, § 4 odst. 1 písm. t) a u), znění k 1. 8. 2026; Finanční správa, Daňové novinky pro
rok 2026 (5. 1. 2026). Informativní, nejde o daňové poradenství.

**Je evropská verze dražší než VOO?**
U S&P 500 mají evropské fondy TER {0,03–0,07 %} ročně, VOO {0,03 %}. U fondů se stejným indexem je rozdíl malý.
Víc rozhoduje, kolik zaplatíte brokerovi a za směnu měny.
*Poznámka:* both figures from `etfs.json`. Never claim the twin is cheaper (decisions.md §0).

**Co když už VOO mám?**
Obvykle ho můžete dál držet i prodat. Třeba LYNX výslovně píše, že omezené jsou jen nové nákupy. Jak to má váš
broker, zjistíte v jeho nápovědě. Zdroj: LYNX, Key Information Document (staženo 9. 10. 2026).

**Odkud máte čísla?**
Ze stránek vydavatelů fondů, z KID bankovních fondů, z ceníků brokerů a ze zákona. Každé číslo má na stránce zdroj
a datum. Přehled všech zdrojů: [Zdroje] (a sources page, or `data/sources.md` on GitHub).

---

## 7. Final form (fallback ask) + footer

**Heading:** Nechcete klikat? Pošleme vám plán pro S&P 500.
**Body:** Dostanete evropská dvojčata VOO, SPY a IVV s ISIN, poplatky v korunách pro {3 000 Kč} měsíčně na {20} let
a daně z ETF v Česku 2026.
- Field, checkbox, button, microcopy and states: same as the inline ask.
- *Poznámka:* if the visitor already used the tool, the heading switches to **Poslat plán e-mailem** and the body
  to "Pošleme vám plán pro {VOO, QQQ}." with their own selections.

### Footer

ETF Dvojče · provozovatel [DOPLNIT: jméno, IČO, sídlo] · [DOPLNIT: kontaktní e-mail]
[Zásady ochrany osobních údajů] · [Zdroje dat]

Informace na této stránce slouží jen ke vzdělávání. Nejde o investiční doporučení, investiční poradenství ani daňové
poradenství. Nejsme obchodník s cennými papíry a nezprostředkujeme nákup žádného fondu. Minulá výkonnost není
zárukou budoucích výnosů. Hodnota investice může klesat i stoupat a nemusí se vám vrátit celá vložená částka.
Výnos v kalkulačce je předpoklad, ne předpověď. Data k {9. 10. 2026}.

---

## 8. Thank-you state (replaces the form block after the server confirms)

**Heading:** Hotovo. Plán je na cestě na {vas@email.cz}.
**Body:** Měl by dorazit do pár minut. Když ho nevidíte, podívejte se do složky s hromadnou poštou nebo do spamu.
- Wrong address link: Překlep v adrese? [Zadat znovu]

**Unlocked on the page:** Celá tabulka pro váš výběr, i s ISIN.

| Americké ETF | Evropské dvojče | ISIN | TER ročně | Dividendy | Zdroj, stav k |
|---|---|---|---|---|---|
| {VOO} | {SXR8} | {IE00B5BMR087} | {0,07 %} | {akumulační} | {iShares, 30. 9. 2026} |

Below the table: Daňový checklist a postup nákupu najdete v e-mailu.

**Share:** Znáte někoho, kdo taky chtěl VOO? [Poslat odkaz]
*Poznámka:* the share link is the bare page URL with `utm_source=share`, no personal data (decisions.md §6).

---

## 9. No-JS fallback (static, in the HTML)

*Poznámka:* shown when JS is off, in place of the tool. Rows generated from `etfs.json`. Order is alphabetical within
acc/dist, not a ranking.

**Heading:** Evropská dvojčata nejčastějších amerických ETF

| Americké ETF | Ticker na Xetře | Fond | TER ročně | Dividendy | Zdroj, stav k |
|---|---|---|---|---|---|
| VOO, SPY, IVV (S&P 500) | SPYL | State Street SPDR S&P 500 UCITS ETF (Acc) | 0,03 % | akumulační | State Street (SPDR), 30. 9. 2026 |
| VOO, SPY, IVV (S&P 500) | SXR8 | iShares Core S&P 500 UCITS ETF USD (Acc) | 0,07 % | akumulační | iShares (BlackRock), 30. 9. 2026 |
| VOO, SPY, IVV (S&P 500) | VUAA | Vanguard S&P 500 UCITS ETF (USD) Accumulating | 0,07 % | akumulační | Vanguard, 31. 8. 2026 |
| VOO, SPY, IVV (S&P 500) | IUSA | iShares Core S&P 500 UCITS ETF USD (Dist) | 0,07 % | distribuční | iShares (BlackRock), 30. 9. 2026 |
| VOO, SPY, IVV (S&P 500) | SPY5 | State Street SPDR S&P 500 UCITS ETF (Dist) | 0,03 % | distribuční | State Street (SPDR), 30. 9. 2026 |
| VOO, SPY, IVV (S&P 500) | VUSA | Vanguard S&P 500 UCITS ETF (USD) Distributing | 0,07 % | distribuční | Vanguard, 31. 8. 2026 |
| QQQ (Nasdaq-100) | EQQB | Invesco EQQQ NASDAQ-100 UCITS ETF Acc | 0,30 % | akumulační | Invesco, 31. 8. 2026 |
| QQQ (Nasdaq-100) | SXRV | iShares NASDAQ 100 UCITS ETF USD (Acc) | 0,30 % | akumulační | iShares (BlackRock), 30. 9. 2026 |
| QQQ (Nasdaq-100) | EQQQ | Invesco EQQQ NASDAQ-100 UCITS ETF Dist | 0,30 % | distribuční | Invesco, 31. 8. 2026 |

Pořadí není doporučení. Plán s poplatky v korunách a daňovým checklistem vám pošleme e-mailem.
*Poznámka:* the final form must work without JS as a plain POST to `/api/lead`.
