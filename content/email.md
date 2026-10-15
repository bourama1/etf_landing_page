# Plan e-mail: "Váš ETF plán z Česka"

Status: **Phase 2 draft for review (✋)** · 2026-10-11 · skill `emails` (single transactional e-mail; its
nurture-sequence templates were not used because decisions.md §2 promises exactly one e-mail).
Lead magnet v2: decisions.md §2. Delivery rules: §6, §6a (only allow-listed, escaped values are inserted).

Conventions as in `content/page.md`: `{…}` runtime value, `[DOPLNIT …]` fill before launch, `[CHYBÍ ZDROJ …]`,
`[OVĚŘIT …]` = a source exists but doesn't settle the point.

```
Name:      Plan delivery
Trigger:   /api/lead accepted a new address, or PLAN_SENT_AT is older than 24 h (decisions.md §6a rule 3)
Goal:      deliver the plan; secondary: open /plan online (magnet_opened)
Length:    1 e-mail. Newsletter only with the separate opt-in.
Sender:    ETF Dvojče <[DOPLNIT: plan@doména]>, reply-to [DOPLNIT: kontaktní e-mail]
Headers:   List-Unsubscribe + List-Unsubscribe-Post (one-click), set in Brevo
```

---

## Subject and preheader

- **Subject:** Váš ETF plán: {VOO} a jeho evropská dvojčata
  - several picks: Váš ETF plán: {VOO, QQQ} a jejich evropská dvojčata
  - fallback form, no picks: Váš ETF plán pro S&P 500
- **Preheader:** ISIN pro vyhledání u brokera, poplatky v korunách a daně z ETF v Česku 2026.

Alternatives: *Plán z ETF Dvojčete: kde koupit {VOO} jako Evropan* (curiosity, but "kde koupit" overpromises; the
plan is generic about brokers). *Evropská dvojčata pro {VOO} + daňový checklist* (good for the A/B test "plan vs.
checklist" in decisions.md §13).

---

## Body

### Top (what they asked for, in the first screen of the e-mail)

Dobrý den,

tady je plán, který jste si vyžádali na ETF Dvojče. Data jsou k {9. 10. 2026}, u každého čísla najdete zdroj.

**[Otevřít plán online]** → `/plan?{allow-listed params}` (fires `magnet_opened`)

Obsah: 1. Vaše dvojčata · 2. Akumulační, nebo distribuční? · 3. Poplatky v korunách · 4. Daně z ETF v Česku 2026 ·
5. Jak fond koupit

---

### 1. Vaše dvojčata

Per pick, one table (rows from `data/etfs.json`, the same order as on the page, "Pořadí není doporučení"):

**{VOO} ({S&P 500})** → evropská ETF se stejným indexem

| Fond | ISIN | Ticker | TER ročně | Dividendy | Měna fondu | Zdroj, stav k |
|---|---|---|---|---|---|---|
| {iShares Core S&P 500 UCITS ETF USD (Acc)} | {IE00B5BMR087} | {SXR8 (Xetra, EUR) · CSPX (Londýn, USD)} | {0,07 %} | {akumulační} | {USD} | {iShares factsheet, 30. 9. 2026} |

Under each table:
- Ticker se liší podle burzy, ISIN je pro fond jen jeden. U brokera hledejte podle ISIN.
- Měna fondu je měna, ve které fond počítá hodnotu. Na Xetře ho koupíte v eurech, v Londýně v dolarech.

Special cases (decisions.md §14 #4):
- **VTI:** Evropské ETF se stejným indexem ({Morningstar US Total Market}) jsme nenašli. Nejbližší dostupné jsou
  fondy na S&P 500. Jde o jiný index, jen velké firmy (decisions.md §14 #4). {S&P 500 rows}
- **SCHD:** SCHD nemá evropské dvojče. ETF na index {Dow Jones U.S. Dividend 100} jsme v Evropě nenašli.
- **VT:** {VGLA, VGLD} sledují stejný index {FTSE Global All Cap}. Jsou nové, obchodují se od {18. 8. 2026}.
  Podobné, ale bez malých firem: {VWCE, VGWL} (index {FTSE All-World}).

Toto není doporučení. Který fond koupíte a jestli vůbec, je na vás.

---

### 2. Akumulační, nebo distribuční? (pro rezidenta ČR)

Platí pro americké dividendy uvnitř fondu na S&P 500 a pro investora, kterému broker uplatňuje smlouvu ČR–USA.

| | Americké ETF ({VOO}) | Irské akumulační ({SXR8}, {VUAA}, {SPYL}) | Irské distribuční ({VUSA}, {IUSA}, {SPY5}) |
|---|---|---|---|
| Daň v USA z dividend | 15 % sraženo vám | 15 % sraženo fondu | 15 % sraženo fondu |
| Daň v ČR | 15 %, započtete daň z USA, doplácíte 0 | nic, dokud neprodáte | 15 % z vyplacené dividendy, nic se nezapočítává |
| Celkem z americké dividendy | asi 15 % | asi 15 % | asi 15 % + 15 % ze zbytku |
| Papírování každý rok | dividendy do přiznání (viz část 4) | žádné, dokud držíte | dividendy do přiznání |
| Americká dědická daň | může se týkat (majetek v USA nad 60 000 USD) | netýká se | netýká se |

Shrnutí: na dani z dividend irský fond neušetří. Akumulační verze ale nic nevyplácí, takže nemáte co přiznávat, a
irský fond se netýká americké dědické daně. Distribuční irský fond vychází daňově nejhůř ze všech tří.

Zdroje: smlouva ČR–USA, čl. 10 odst. 2 b) a 3 (irs.gov); smlouva Irsko–USA, čl. 10 odst. 2 b) (irs.gov); Irish
Revenue, Tax and Duty Manual 27-01A-02, §4.2.3 (leden 2026); zákon o daních z příjmů § 8, § 16a, § 38f (znění
k 1. 8. 2026); IRS, Instructions for Form 706-NA (září 2025); IRS, Some nonresidents with U.S. assets must file
estate tax returns (27. 6. 2026). Informativní, nejde o daňové poradenství.

*Poznámka:* table built only from `data/sources.md` §2.5 and §3. "Nic, dokud neprodáte" is the reading recorded in
`data/NOTES.md` (no provision taxes undistributed fund income); NOTES suggests a tax adviser confirms it before
launch. The 15 % on the Irish fund assumes it qualifies for the IE–US treaty, as issuers assume (sources.md §2.2).
SPY is a trust, so the estate-tax row says "může se týkat" (sources.md §3).

---

### 3. Poplatky v korunách

Váš výpočet: **{3 000 Kč} měsíčně, {20} let, výnos {5 %} ročně** (předpoklad, ne předpověď), nakupujete u
{brokera / „nevím“}.

| Po letech | Vloženo | Bankovní akciový fond | Indexové ETF | Rozdíl |
|---|---|---|---|---|
| {1} | {36 000 Kč} | {…} | {…} | {…} |
| {5} | | | | |
| {10} | | | | |
| {15} | | | | |
| {20} | {720 000 Kč} | {883 000–950 000 Kč} | {1 200 000 Kč} | {250 000–317 000 Kč} |

*Poznámka:* values from the tested Phase 3 calculator; the year-20 row must match `node content/calc-examples.mjs`
for the default inputs (shown here). Years 1–15 are not computed yet, so they are left blank on purpose.

Co je v čísle:
- **Bankovní fond:** vstupní poplatek {3–5 %} z každé platby (maximum podle KID, banka může dát slevu) a průběžné
  náklady {1,75–2,59 %} ročně. Zdroj: KID ČSOB Akciový (1. 6. 2026), KID KB Portfolio – Akciových indexů –
  Exclusive (24. 4. 2026).
- **ETF:** TER {0,07 %} ročně, poplatek za obchod a směna měny u {brokera} ({ceník, datum}).
  - Fio: Fio kurzovou přirážku nezveřejňuje, v čísle je jen poplatek za obchod. *(only if Fio was chosen)*
- Nepočítáme transakční náklady fondů, rozpětí cen na burze ani daně.

Na co si dát pozor u malých částek: pevný poplatek za obchod může být v procentech vyšší než vstupní poplatek
bankovního fondu. Třeba u Fio stojí nákup na Xetře do 1 400 EUR {3,95 EUR}, při nákupu za 125 EUR je to 3,16 %.
Zdroj: Fio, Ceník základních služeb (od 1. 7. 2026).

Kolik si může vzít banka: Česká spořitelna uvádí, že od správců akciových fondů dostává za jejich distribuci až
{1,65 %} ročně z majetku ve fondu. Platí to z ročního poplatku fondu. Zdroj: ČS, Základní informace o poskytování
investičních služeb.
*Poznámka:* sources.md §5 allows this as context. Never derive a TER from it.

---

### 4. Daně z ETF v Česku 2026 (checklist)

Informativní, nejde o daňové poradenství. Platí pro fyzické osoby, které ETF nedrží v obchodním majetku.

- [ ] **Časový test.** Zisk z prodeje je osvobozený, když mezi nákupem a prodejem uplynou víc než 3 roky. Počítá se
  zvlášť pro každý nákup, takže u pravidelného investování má každá měsíční platba své datum.
  Zdroj: § 4 odst. 1 písm. u) ZDP.
- [ ] **Od 1. 1. 2026 bez stropu.** Limit 40 milionů Kč pro časový test se u cenných papírů ruší. Zůstává jen
  u kryptoaktiv. Zdroj: Finanční správa, Daňové novinky pro rok 2026 (5. 1. 2026); § 4 odst. 3 ZDP.
- [ ] **Hodnotový test.** Když za celý rok prodáte cenné papíry nejvýš za 100 000 Kč, je příjem osvobozený.
  Počítá se celá částka z prodeje, ne zisk. Když limit přesáhnete, tento test vám nepomůže pro žádný z prodejů.
  Zdroj: § 4 odst. 1 písm. t) ZDP.
- [ ] **Dividendy z distribučního fondu** se daní v daňovém přiznání. Můžete je dát do samostatného základu daně se
  sazbou 15 % (Příloha č. 4), pak tam ale musí jít všechny zahraniční dividendy za daný rok.
  Zdroj: § 8 odst. 4 a 8 a § 16a ZDP; Příloha č. 4 k přiznání za rok 2026, ř. 401a.
- [ ] **Kdy podat přiznání.** Zaměstnanec s podepsaným prohlášením nemusí podávat přiznání, pokud jeho ostatní
  příjmy podle § 7 až 10 nepřesáhnou za rok 20 000 Kč. Zahraniční dividendy se do toho počítají. Když s ostatními
  příjmy přesáhnou 20 000 Kč, přiznání podat musíte. Zdroj: § 38g odst. 2 a § 8 odst. 3 a 4 ZDP.
- [ ] **Schovávejte potvrzení o každém nákupu** (datum a cena). Bez nich časový test těžko doložíte.
- [ ] **Americká ETF a dědická daň.** Pokud máte v USA majetek nad 60 000 USD, může po vašem úmrtí vzniknout
  povinnost podat v USA přiznání k dědictví. Česko s USA smlouvu o dědické dani nemá. Akcie irských fondů se za
  americký majetek nepovažují. Zdroj: IRS, Instructions for Form 706-NA (září 2025); IRS, Estate & gift tax
  treaties (8. 9. 2026).

---

### 5. Jak fond koupit

Postup je stejný u každého brokera, který evropská ETF nabízí:

1. V aplikaci brokera vyhledejte **ISIN** z části 1. Ticker se liší podle burzy.
2. Zkontrolujte název fondu. „Acc“ znamená akumulační, „Dist“ distribuční.
3. Vyberte burzu. Na Xetře nakupujete v eurech.
4. V ceníku brokera si najděte poplatek za obchod a za směnu měny a porovnejte ho s tím, kolik měsíčně vkládáte.
5. Pokud fond nenajdete, napište brokerovi ISIN. Nabídka se u brokerů liší.

Konkrétního brokera nedoporučujeme a od žádného nemáme provizi.

---

### Footer

Plán vám přišel, protože jste si ho {11. 10. 2026} vyžádali na {etfdvojce…}. Další e-maily posíláme, jen pokud jste
zaškrtli odběr novinek. [Odhlásit se]

ETF Dvojče · [DOPLNIT: provozovatel, IČO, sídlo] · [Zásady ochrany osobních údajů]

Informace slouží jen ke vzdělávání. Nejde o investiční doporučení, investiční poradenství ani daňové poradenství.
Minulá výkonnost není zárukou budoucích výnosů. Hodnota investice může klesat i stoupat a nemusí se vám vrátit
celá vložená částka.

---

## Checks before launch

- Spam check in Brevo; render test in Gmail (web + Android app), Seznam.cz, Outlook.
- Plain-text part generated (Brevo) and readable on its own.
- Mailchimp "Business + Finance" click rate 2,78 % (`data/benchmarks.md`, 2023 data) is the reference for the
  "Otevřít plán online" click; opens are not used (Apple Mail Privacy Protection).
