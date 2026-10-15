# Ads: Meta (Instagram Stories 9:16 + Feed 4:5)

Status: **Approved by Matěj 2026-10-15** (drafted 2026-10-11) · skills `ads` + `ad-creative` (Mode 1, grounded in
`content/voice-of-customer.md`). Final assets (images + `copy.md` per ad) go to `ads/ad-a/` and `ads/ad-b/` in Phase 6.

Format: **static images** (one design per ad, cut to 9:16 and 4:5). Statics are cheap to make and easy to iterate.
The A/B question is the angle (decisions.md §7), so everything else stays as equal as possible between A and B:
same brand bar, same type, same CTA button, same targeting.

Targeting: Czech Republic, broad, no interest stacking; the creative does the selecting.
**VERIFY before launch:** Meta's current rules for financial-services ads (whether the "Financial products and
services" special ad category applies in the EU and what it restricts), and Meta's advertising policy on financial
products. Noted for the README.

Character counts (in brackets) were measured by script, see the bottom of this file. Meta limits used: primary text
125 visible, headline ~40, description ~30 (`ad-creative` platform specs).

---

## Ad A: "Blocked trade" (persona P1)

**Target URL**
```
<LIVE_URL>/?utm_source=instagram&utm_medium=paid_social&utm_campaign=etf_dvojce_2026q4&utm_content=ad_a_blocked
```
Page opens on Step A (decisions.md §4). Hero headline = the ad's on-image headline, word for word.

**Grounding:** "nedovoluje obchodovat", "nejde", "hledám alternativy" (VoC theme 1, FH1/FH2); the KID error message
(MP #1). The ad names no broker and shows no real broker's UI.

### Primary text
> Chtěli jste VOO a broker hlásí, že ho koupit nejde? Jeho evropské dvojče sleduje stejný index S&P 500.
>
> Ťukněte na ticker, který jste chtěli, a dvojče uvidíte hned, bez registrace. Kdo chce celý plán i s daněmi,
> dostane ho e-mailem.
>
> Nejsme broker a nic neprodáváme. Informativní obsah, nejde o investiční doporučení.

### Headline
Evropské dvojče vašeho VOO

### Description
Zdarma. U čísel zdroj a datum.

### CTA button
Learn More (Meta shows the localised Czech label).

### On-image text
1. Error toast (top third): **Nákup nelze dokončit. Chybí dokument KID.**
2. Ticker pair (centre, the brand's departure-board look): **~~VOO~~** → flap tiles mid-flip, the twin not yet
   readable
3. Headline (largest text): **Broker vám nedovolí koupit VOO? Má evropské dvojče.**
4. Line under it: **Stejný index S&P 500. Najdete ho jedním ťuknutím.**
5. Brand bar (bottom): ETF Dvojče
6. Small print: Informativní obsah, nejde o investiční doporučení.

### Visual brief
- Background `paper` #F1F3EE, text `ink` #1A2421, Archivo only (decisions.md §10). No photo, no gradient, no emoji.
- **Toast:** a generic phone-notification card, white, 8 px radius, grey "!" icon. No broker logo, colours or
  app chrome that could pass for a real broker (Meta impersonation rules plus our own honesty rule).
- **Ticker pair:** "VOO" in Archivo Expanded Black, ~25 % of the frame width, struck through in `blocked` #B8361E
  with the label "nejde koupit" under it (never colour alone). On the right, three split-flap tiles caught mid-flip
  in `ink`/`paper`, where you can't read a ticker yet. The click resolves that curiosity, and the page shows the
  same pair animating to the real twin, which keeps the message matched.
- **9:16 (1080×1920):** toast, ticker pair, headline, line 4, brand bar from top to bottom. Keep all text out of the
  top and bottom bands that Instagram covers with its UI (check the current safe-zone overlay in Ads Manager).
- **4:5 (1080×1350):** drop the toast and put "Chybí dokument KID" as a small `blocked` label under VOO. Ticker pair
  on top, headline below.
- Text stays well under a fifth of the image area apart from the ticker pair, which is the image.

### Alternatives (for later tests, not launched together)
- Headline variant: *Chtěli jste VOO, ale nejde koupit? Má evropské dvojče.* (the commenters' own "nejde").
  Change the landing-page H1 with it.
- Primary text opener variant: *"Produkt není dostupný." Tohle hlásí broker u VOO většině lidí v EU.* Rejected for
  now: "většině lidí v EU" is not sourced.

---

## Ad B: "Fees in CZK" (persona P2)

**Target URL**
```
<LIVE_URL>/?utm_source=instagram&utm_medium=paid_social&utm_campaign=etf_dvojce_2026q4&utm_content=ad_b_fees
```
Page opens on Step B with VOO preselected; hero headline = the ad's on-image headline.

**Grounding:** "vstupní poplatek", "trik pro prodejce" (VoC theme 5, BK, low confidence: this ad is the test of
that hypothesis). Numbers from `node content/calc-examples.mjs`, KB fund case (the smaller of the two bank-fund
gaps, so the ad does not lean on the most expensive fund).

### Primary text
> Spoříte 3 000 Kč měsíčně v bankovním akciovém fondu? Za 20 let vás poplatky můžou stát kolem 272 000 Kč.
>
> U indexového ETF je to při stejné částce kolem 22 000 Kč. Spočítejte si to se svou částkou, výsledek uvidíte
> hned v korunách.
>
> Výpočet: výnos 5 % ročně je předpoklad, ne předpověď. Fond: vstupní poplatek 5 % (maximum podle KID ze 24. 4.
> 2026), průběžné náklady 1,75 % ročně. ETF: 0,07 % ročně a 0,5 % za směnu měny při nákupu i prodeji. Zdroje na
> webu. Nejsme broker ani banka a nic neprodáváme. Nejde o investiční doporučení.

### Headline
Poplatky za 20 let v korunách

### Description
Bankovní fond, nebo ETF

### CTA button
Learn More (localised by Meta).

### On-image text
1. Headline (top, largest): **Kolik vás za 20 let stojí poplatky?**
2. Scenario line: **3 000 Kč měsíčně, 20 let**
3. Two bars (centre), labels left, numbers right:
   - **Bankovní akciový fond: 272 000 Kč** (long bar, `marker` #F3DC5A behind the number)
   - **Indexové ETF: 22 000 Kč** (short bar)
4. Line under the bars: **Spočítejte si to v korunách.**
5. Brand bar: ETF Dvojče
6. Small print: Výnos 5 % ročně je předpoklad, ne předpověď. Fond: vstupní poplatek 5 % (max. dle KID), 1,75 %
   ročně. ETF: 0,07 % ročně + 0,5 % směna měny. Nejde o investiční doporučení.

### Visual brief
- Same tokens and type as ad A. The two bars are flat `ink` fills on `paper`; their lengths are to scale
  (272 : 22). The only colour accent is the `marker` behind the bank-fund number (decisions.md §10).
- Numbers in Archivo with tabular figures, the big ones in a wide width. No coins, piggy banks, arrows or charts
  with fake axes.
- **9:16:** headline, scenario, bars, line 4, brand bar, small print, inside the safe zone.
- **4:5:** same order, with the small print as the bottom band.
- The decisions.md §7 draft said "two cost lines diverging over 20 years". Changed to two bars: a 20-year line chart
  needs axes and year labels that a viewer can't read in 2 seconds, while the two end totals carry the claim. The
  year-by-year curve lives on the page and in the e-mail.

### Alternatives (later tests)
- Scenario variant with the ČSOB case (entry max 3 %, 2,59 % ročně): 339 000 Kč vs 22 000 Kč. Larger gap, so it is
  held back on purpose: launch with the conservative number.
- Headline variant: *Kolik vás stojí vstupní poplatek a 1,75 % ročně?* Closer to P2's words, but less concrete.

---

## Decisions

- Ad B names no bank or fund, neither on the image nor in the primary text. The full source (KB Portfolio –
  Akciových indexů – Exclusive, KID 24. 4. 2026) is on the landing page (Matěj, 2026-10-15; decisions.md §14 #9).
- `<LIVE_URL>` is filled after deploy (Phase 5).

## Measured lengths

Counted with `node` (`[...str].length`) on 2026-10-11:

| Element | A | B | Limit |
|---|---|---|---|
| Primary text, first paragraph (visible part) | 102 | 104 | 125 visible |
| Headline | 26 | 29 | ~40 |
| Description | 30 | 23 | ~30 |
