# Reklama B: „Poplatky v korunách" (persona P2)

Meta (Instagram Stories 9:16 + Feed 4:5), statický obrázek. Text schválený v `content/ads.md` (15. 10. 2026).

**Obrázky:** `story-1080x1920.png`, `feed-1080x1350.png` (zdroj `ads/src/ads.html`, `node ads/render.mjs`)

**Cílová URL**
```
https://etf-landing-page-sigma.vercel.app/?utm_source=instagram&utm_medium=paid_social&utm_campaign=etf_dvojce_2026q4&utm_content=ad_b_fees
```
Stránka se otevře na kalkulačce poplatků (krok B) s předvybraným VOO; nadpis stránky = nadpis v reklamě.

**Primární text**
> Spoříte 3 000 Kč měsíčně v bankovním akciovém fondu? Za 20 let vás poplatky můžou stát kolem 272 000 Kč.
>
> U indexového ETF je to při stejné částce kolem 22 000 Kč. Spočítejte si to se svou částkou, výsledek uvidíte
> hned v korunách.
>
> Výpočet: výnos 5 % ročně je předpoklad, ne předpověď. Fond: vstupní poplatek 5 % (maximum podle KID ze 24. 4.
> 2026), průběžné náklady 1,75 % ročně. ETF: 0,07 % ročně a 0,5 % za směnu měny při nákupu i prodeji. Zdroje na
> webu. Nejsme broker ani banka a nic neprodáváme. Nejde o investiční doporučení.

**Nadpis:** Poplatky za 20 let v korunách
**Popis:** Bankovní fond, nebo ETF
**Tlačítko:** Learn More (Meta ho zobrazí česky)

**Čísla:** `node content/calc-examples.mjs` (fond KB Portfolio – Akciových indexů – Exclusive, KID 24. 4. 2026:
poplatky 272 000 Kč; indexové ETF 22 000 Kč). Je to menší ze dvou rozdílů (ČSOB: 339 000 Kč), aby se reklama
neopírala o nejdražší fond. Reklama nejmenuje banku ani fond; plný zdroj je na stránce (decisions §14 #9).
Pruhy jsou ve skutečném poměru 272 : 22.

Délky: první odstavec 104 znaků (viditelných 125), nadpis 29 (~40), popis 23 (~30).
