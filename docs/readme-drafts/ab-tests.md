# A/B testy (koncept do README)

Tři hypotézy z `docs/decisions.md` §13, seřazené podle očekávaného dopadu. Velikost vzorku počítá
`node scripts/sample-size.mjs` (test dvou podílů, α = 0,05 oboustranně, síla 0,8; skript má kontrolu proti ručně
spočítané hodnotě). Výchozí konverze 4–6 % je náš odhad ukotvený na mediánu Unbounce 3,9 % pro investiční landing
pages (`data/benchmarks.md`), ne naměřená hodnota.

**Předpoklad provozu: 300 prokliků z reklamy denně, rozdělených 50/50.** Je to předpoklad, ne prognóza. Při
průměrném CPC 1,80 USD z LocaliQ (americký průměr kampaní na leady, `data/benchmarks.md`) by to stálo zhruba
540 USD denně, takže skutečná délka testu závisí na rozpočtu.

**Jak se varianty přidělují:** v reklamě, ne na stránce. Publikum rozdělí reklamní systém (A/B test v Meta Ads
Manageru; funkci a její podmínky ověřit před spuštěním) a každá varianta má vlastní `utm_content` (`ad_a_…`,
`ad_b_…`, u testů 2 a 3 přípona ramene, např. `ad_a_gate1` / `ad_a_gate2`). Stránka podle něj zvolí variantu,
Brevo uloží `UTM_CONTENT` ke kontaktu a Umami ho má v URL zobrazení stránky. Na stránce tak není žádné náhodné
přidělování ani blikání. **Postavené je jen rameno testu 1** (varianty A a B); varianty stránky pro testy 2 a 3
zatím neexistují.

**Primární metrika u všech tří:** leady v Brevo ÷ prokliky z reklamy (Meta „link clicks") pro danou variantu.
Nezávisí na souhlasu s měřením. Umami trychtýř (jen návštěvníci se souhlasem) slouží jako vysvětlení, ne k vyhlášení
vítěze.

| Pořadí | Test | MDE (relativně) | Vzorek na variantu (4 / 5 / 6 %) | Délka při 300/den (5 %) |
|---|---|---|---|---|
| 1 | Úhel reklamy + vstupní krok (A blokace vs. B poplatky) | 30 % | 4 783 / 3 780 / 3 112 | 26 dní |
| 2 | Hloubka brány (všechna dvojčata před formulářem vs. jedno) | 30 % | 4 783 / 3 780 / 3 112 | 26 dní |
| 3 | Rámování nabídky („plán" vs. „daňový checklist") | 20 % | 10 317 / 8 158 / 6 719 | 55 dní |

---

## 1. Úhel reklamy a vstupní krok (největší očekávaný dopad)

- **Hypotéza:** Protože dvě persony mají jiný problém (P1 narazí na zablokovaný nákup VOO, P2 platí vysoké poplatky
  v bankovním fondu, decisions §1), věříme, že reklama „Broker vám nedovolí koupit VOO?" s otevřením na kroku A
  přinese jiný podíl leadů na proklik než reklama „Kolik vás za 20 let stojí poplatky?" s otevřením na kalkulačce.
  Poznáme to na rozdílu leadů ÷ prokliků mezi `ad_a_blocked` a `ad_b_fees`.
- **Proč první:** mění zároveň publikum, slib i první obrazovku. Výsledek řekne, který problém trh víc pálí, a podle
  toho se píše všechno ostatní.
- **Metriky:** primární leady ÷ prokliky; sekundární (Umami, se souhlasem) `interaction_start` ÷ pageview,
  `interaction_complete` ÷ `interaction_start`, `form_view` → `lead_submitted`; cena za lead z Meta.
- **Guardraily:** míra odhlášení z e-mailu s plánem, `form_error` (`server`, `rate`), stížnosti / nahlášení reklamy.
- **MDE 30 %:** menší rozdíl mezi dvěma celými koncepty by nezměnil rozhodnutí, kam dát rozpočet.
- **Pozor:** nejde o čistý test jedné proměnné (mění se publikum i stránka). Odpovídá na otázku „který koncept",
  ne „která věta". Meta navíc doručuje reklamy různým lidem; výsledek platí pro publikum, které Meta vybrala.

## 2. Hloubka brány

- **Hypotéza:** Protože hodnota má být zřejmá ještě před formulářem (zadání), ale nesmí být celá zdarma, věříme, že
  když před formulářem ukážeme jen první dvojče a zbytek (všechna dvojčata, ISIN, poplatky po letech) pošleme
  e-mailem, vzroste podíl leadů na proklik u persony P1. Poznáme to na leadech ÷ proklicích u `ad_a_gate1`
  (dnešní stav, všechna dvojčata) vs. `ad_a_gate2` (jedno dvojče).
- **Metriky:** primární leady ÷ prokliky; sekundární `interaction_complete` → `form_view` → `form_start`.
- **Guardraily:** `magnet_opened` ÷ leady (jestli e-mail lidé opravdu otevírají), odhlášení, opakované odeslání
  formuláře (Brevo `LAST_REQUEST_AT`).
- **Riziko:** užší brána může zvýšit leady a snížit důvěru („schovávají to"). Proto guardrail na otevření plánu.

## 3. Rámování nabídky

- **Hypotéza:** Protože pro rezidenta ČR je nejasná hlavně daň (decisions §0, §2), věříme, že nadpis výzvy „Pošleme
  vám daňový checklist" místo „Pošleme vám plán" zvýší podíl leadů na proklik. Poznáme to na leadech ÷ proklicích
  u dvou ramen se stejnou reklamou.
- **Metriky:** primární leady ÷ prokliky; sekundární `form_view` → `form_start` → `lead_submitted`.
- **Guardrail:** odhlášení a otevření plánu (slib checklistu musí e-mail splnit, a ten ho obsahuje).
- **Proč poslední:** mění jednu větu, takže čekaný efekt je menší a test potřebuje zhruba dvojnásobek provozu (55 dní
  při 300 proklicích denně). Má smysl až po testu 1, na vítězném úhlu.

## Pravidla pro všechny tři

- Velikost vzorku a délka se určí před spuštěním a test se nezastavuje dřív, i když je výsledek „jasný" (peeking).
- Testy běží postupně, ne současně: každý mění jiné místo trychtýře a překrývaly by se.
- Celé týdny (stejný počet pracovních dnů a víkendů v obou ramenech).
- Kontrola úniku měření: Umami `lead_submitted` ÷ leady v Brevo podle varianty (README, sekce Měření).
