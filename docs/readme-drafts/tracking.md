# Měření (koncept do README)

## Nástroje a proč

- **Umami Cloud** (plán Hobby, zdarma): 100 tisíc událostí měsíčně, 1 web, data 6 měsíců, trychtýř je v plánu
  zdarma. Při registraci se volí oblast dat **Evropská unie**; volbu nejde později změnit. Skript má 2,3 kB (gzip).
  Zdroje a ověření: `docs/superpowers/plans/2026-10-15-phase4-tracking.md`, tabulka „Provider verification".
- **Brevo:** každý lead je kontakt s atributy `AD_VARIANT` a `UTM_*` (decisions §6a). **Konverze se počítají
  z Brevo,** ne z Umami.
- **Meta Ads Manager:** prokliky (link clicks) na každou reklamu. Jmenovatel konverzního poměru.

## Souhlas s měřením

Umami nepoužívá cookies, ale jeho skript nechá prohlížeč poslat velikost obrazovky, jazyk a URL. Podle EDPB
(Guidelines 2/2023, bod 33) i podle ÚOOÚ (jak uvádí eLegal, 2025) na to dopadá § 89 odst. 3 zákona č. 127/2005 Sb.,
takže potřebujeme souhlas (`data/sources.md` §10, rozhodnutí Matěje 2026-10-15). Řešení:

- Lišta „Smíme měřit, jak se stránka používá?" s rovnocennými tlačítky „Souhlasím" / „Nesouhlasím".
- Je nahoře a ukáže se až po prvním posunutí, ťuknutí nebo stisku klávesy. První obrazovka z reklamy tak zůstává
  čistá a lišta nepřekrývá spodní tlačítko „Poslat plán e-mailem". Na telefonu je vysoká 112 px. Dokud je otevřená, skok na formulář (spodní lišta, „Poslat plán") se zastaví pod ní, a v pořadí
  klávesnice je první.
- Bez souhlasu se skript Umami vůbec nestáhne. Události z doby před odpovědí čekají jen v paměti stránky; po
  „Souhlasím" se odešlou (nejdřív zobrazení stránky, pak zbytek ve správném pořadí), po „Nesouhlasím" se zahodí.
- Volba se pamatuje v `localStorage` a dá se změnit odkazem „Nastavení měření" v patičce.

Důsledek: **Umami vidí jen návštěvníky se souhlasem.** Proto jmenovatel konverze bereme z Meta a Umami trychtýř
čteme jako vzorek chování, ne jako úplný počet.

## Události

Názvy z decisions §12. Každá událost nese `tag` = varianta reklamy (`a` / `b` / `unknown`, z `utm_content`: `ad_a_*`
→ a, `ad_b_*` → b, jinak unknown). Žádná vlastnost nikdy neobsahuje e-mail ani volný text; `track()` zahodí každou
událost, ve které je znak `@`.

| Událost | Kdy | Vlastnosti | Kolikrát |
|---|---|---|---|
| `page_view` | zobrazení stránky (vestavěný pageview Umami, posílaný ručně jako první) | URL jen s parametry `utm_*` (ostatní, např. `fbclid`, odstraní `keepUtm()` před odesláním), `tag` | jednou za načtení |
| `section_view` | sekce z ≥ 50 % na obrazovce, nebo zabírá ≥ 50 % obrazovky | `section`: hero, tool, why, plan, about, faq, final | jednou za sekci |
| `interaction_start` | první vlastní akce v nástroji (čip, posuvník, přepínač, „změnit", „Vybráno: VOO · změnit") | `step` (a/b/c), `ad_variant` | jednou |
| `step_complete` | A: vybrané ETF; B: první změna posuvníku nebo brokera; C: první volba dividend | A `tickers`; B `monthly`, `years`, `broker`; C `dividends` | jednou za krok |
| `interaction_complete` | první výsledek **po** vlastní akci (u reklamy B je výsledek vidět hned, ten se nepočítá) | `tickers`, `monthly`, `years` | jednou |
| `cta_click` | spodní lišta, odkazy „Poslat plán" / „Najít své dvojče", tlačítka formulářů | `location`: sticky, plan, why, inline, footer | při každém kliknutí |
| `form_view` | formulář z ≥ 50 % na obrazovce | `location`: inline, footer | jednou za formulář |
| `form_start` | první focus v poli e-mail | `location` | jednou za formulář |
| `form_error` | prázdný nebo špatný e-mail (i kontrola prohlížeče), odpověď 400 / 429 / 5xx, výpadek sítě | `reason`: empty, invalid, rate, server, network; `location` | při každé chybě |
| `lead_submitted` | **až když `/api/lead` potvrdí** (`2xx` a `ok: true`) | `location`, `ad_variant` | při každém úspěchu |
| `thank_you_view` | zobrazení poděkování | `location` | při každém zobrazení |
| `magnet_opened` | `/plan` otevřený z odkazu v e-mailu (`utm_source=email`) | — | jednou za načtení |

`step_complete` přidává decisions §12 ke jménům z CLAUDE.md, protože nástroj má tři kroky.

**Ověřeno lokálně:** `node scripts/funnel-check.mjs` sestaví web s falešným ID, spustí skutečný skript Umami
v Chromiu a zachytí všechno, co by odeslal (nic neodejde). Scénáře: reklama A celou cestou, reklama B (2 s bez
dotyku = žádná interakce), bez UTM, `/plan` z e-mailu i napřímo, a odmítnutí měření (skript se nestáhne, nic se
neodešle). Výstup: `docs/funnel-check.log`.

## Trychtýř v Umami

Kroky v tomto pořadí, okno 60 minut, filtr podle tagu `a` nebo `b`:

1. Zobrazení stránky `/`
2. `interaction_start`
3. `interaction_complete`
4. `form_view`
5. `form_start`
6. `lead_submitted`

## Konverzní poměr a kontrola úniku

**Konverze varianty v = leady v Brevo s `AD_VARIANT = v` ÷ prokliky z Meta na reklamy varianty v**, za stejné
období. (Původní plán v decisions §12 dělil zobrazeními stránky v Umami. Se souhlasem by Umami vidělo jen část
návštěv a poměr by vyšel uměle vysoký.)

**Kontrola úniku měření:** podíl leadů, které Umami vidělo = Umami `lead_submitted` (tag v) ÷ leady v Brevo
(`AD_VARIANT = v`). Měl by být zhruba stejný jako podíl souhlasů; výrazně nižší hodnota znamená ztracené události
(blokátor reklam, zavřená karta hned po odeslání, nefunkční skript). Pozor: odeslání zachycené honeypotem vrací
úspěch, takže se v Umami započítá, ale v Brevo ne.

**Podíl souhlasů** = Umami zobrazení stránky (tag v) ÷ prokliky z Meta (v). Hrubý odhad, protože i prokliky ztrácí
část lidí ještě před načtením stránky.

## Rozpočet událostí

Umami účtuje každou vlastnost události jako další událost (Cloud FAQ). Plně zapojená návštěva vyjde zhruba na
30 účtovaných událostí, krátká návštěva na 3. Při průměru kolem 10 stačí Hobby na zhruba 10 tisíc návštěv se
souhlasem měsíčně. Při 300 proklicích denně (předpoklad z A/B karet) a vysokém podílu souhlasů je to na hraně; pak
Umami Pro za 20 USD měsíčně (1 milion událostí). Co se stane po překročení limitu na Hobby, jsme nenašli: hlídat
stránku Usage.

## Co se neměří

- Návštěvníci bez JavaScriptu (formulář funguje, `/dekujeme/` se neměří). Jejich leady jsou v Brevo.
- `magnet_opened` nejde přiřadit k reklamě: odkaz v e-mailu nenese `utm_content`, protože UTM do e-mailu nepatří
  (decisions §6a). Variantu zná kontakt v Brevo.
- Náhledová nasazení: ID webu je jen v produkčním prostředí Vercelu.
