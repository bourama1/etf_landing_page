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
