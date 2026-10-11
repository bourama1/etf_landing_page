# Voice of customer: real phrasing before copy

Collected 2026-10-11 for Phase 2 (`marketing-skills:customer-research`, Mode 2: public signal). Quotes are verbatim,
including typos and missing diacritics. They were read from the raw WordPress comment feeds (`<article>/feed/`) or
the raw page HTML, never from a search summary. Nothing here is invented or paraphrased inside quote marks.

## What could and could not be read

| Source | Result |
|---|---|
| r/czech, r/eupersonalfinance | **Not readable.** reddit.com returns 403 to curl and WebFetch is refused; the pullpush.io mirror returns 429 ("does not provide free scraping resources for agents"). Web search with `site:reddit.com` returned no Reddit threads. No Reddit quote is used. |
| Finex.cz ([S&P 500 ETF article](https://finex.cz/nejzajimavejsi-etf-fondy-kopirujici-sp-500/)) | Has a "Diskuze k tématu" heading but no comments in the HTML; the comment feed has 0 items. |
| Finhacker.cz, 3 articles | **Used.** 44 comments read via the comment feeds. |
| banky.cz Bankovní poradna #5739 | **Used.** One reader question about bank funds (the only P2 voice found). |
| forum.mustachianpost.com #14665 | Read (Discourse JSON). English, Swiss resident with an EU account; one quote kept as a cross-check of the error message. |

**Bias:** Finhacker readers are more advanced than persona P1 (several talk about IBKR, options, US brokers), and
the threads are 2021–2024, older than the 12-month window the skill prefers. **P2 (bank-fund saver) rests on a
single 2019 quote: low confidence.** Treat the P2 phrasing as a hypothesis for the ad B test, not a finding.

Sources (FH = Finhacker):
- **FH1** https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-1-cast/ (comments 2021–2024)
- **FH2** https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-2-cast/ (comments 2022–2023)
- **FH3** https://www.finhacker.cz/etf-ktere-nemusi-danit-dividendy-sen-kazdeho-indexoveho-investora/ (comments 2021–2023)
- **BK** https://www.banky.cz/poradna/investice-do-podilovych-fondu/ (2019-01-12)
- **MP** https://forum.mustachianpost.com/t/voo-not-tradable-on-ib/14665 (2024-11-25)

---

## Theme 1: "Smím si to vůbec koupit?" (access, blocked trade) · confidence **high** (5 commenters, 3 threads)

- "Ahoj, můžu se zeptat, jestli pořád máte ta "zakázaná" ETFka? … jen bych nerad, aby mi to pak za týden zavřeli s
  poznámkou že to nejde… :-)" (Jan, FH1 [#comment-1525](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-1-cast/#comment-1525), 2022-05-17)
- "Ahoj, jelikož mi Degiro nedovoluje obchodovat ETF od Vanguard (ISIN IE00BK5BQT80), tak hledám alternativy. …
  Nechce se mi tam zakládat účet, když bych tam pak stejně nemohl nakupovat." (MichalK, FH2 [#comment-2188](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-2-cast/#comment-2188), 2023-05-14)
- "Ale můžu úplně stejně jednoduše koupit i například " iShares Core S&P 500 ETF", tedy ETF, které nemá v názvu
  "UCITS", které říká, že odpovídá určitým regulacím?" (Zden, FH2 [#comment-2131](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-2-cast/#comment-2131), 2023-04-06)
- "Dívám se, že toto ETF je k dispozici na IB, ale na XTB jsem ho nenašel. Pokud se jen blbě dívám, tak prosím o
  comment :)" (Skeletom, FH3 [#comment-2122](https://www.finhacker.cz/etf-ktere-nemusi-danit-dividendy-sen-kazdeho-indexoveho-investora/#comment-2122), 2023-03-28)
- "Just tried to buy VOO through IB, however I get the message that the fund is missing the KID (Key information
  document) in the appropriate language and cannot be traded. Does anyone know what I can do?" (ortho1, MP #1, 2024-11-25)
- Workaround hunting, not a quote to reuse: one commenter mapped three US brokers, international transfers via
  Revolut and AirBank and withdrawal fees ("vklady "drahé", provoz levný") just to reach US ETFs (Petr, FH1
  [#comment-2518](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-1-cast/#comment-2518), 2024-01-03).

**For copy:** they say **"zakázaná ETFka"**, **"nedovoluje obchodovat"**, **"nejde"**, **"hledám alternativy"**,
and they search by **ISIN**. They want to know before opening an account whether they'll be able to buy. The
UCITS label confuses them ("v názvu UCITS"). Ad A's "Broker vám nedovolí koupit VOO?" matches "nedovoluje".

## Theme 2: "Kterou verzi / měnu?" (choice overload among equivalents) · confidence **medium** (3 commenters)

- "Jsem amater, prosim, mam otazku k mene ETF … Trochu dumam nad tim, kterou menu vybrat, kdyz je stejne ETFko
  dostupne v EUR i USD. … Jaka je vyhoda/nevyhoda kdyz jsou " Fund currency " a " Trade Currency " jsou rozdilne?
  Je velke menove riziko?" (dab, FH2 [#comment-2416](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-2-cast/#comment-2416), 2023-11-16)
- "Na seznamu XTB jsem jej našel. Znamená to tedy, že lze obchodovat?" (MichalK, FH2 #comment-2188)
- "Našel jsem stránku, kde je seznam ETFs, co mají KIID … Značné ulehčení při hledání" (Zden, FH2
  [#comment-2170](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-2-cast/#comment-2170), 2023-04-21)

**For copy:** a beginner self-labels as **"amatér"** and is stuck between fund currency and trading currency.
"Ulehčení při hledání" is the job the tool does. **Consequence for Step C:** every UCITS twin in `data/etfs.json` has
fund currency USD, so a "Měna fondu: USD / EUR" filter would filter nothing. What confuses people is the
*trading* currency on the exchange (Xetra EUR vs. London USD). See the open item in `content/page.md`.

## Theme 3: US estate tax worry · confidence **medium** (3 commenters + the blog author, FH1)

- "dnes jsem narazil na článek o dědické dani, která se vztahuje na tyto americká etf. u Vyšších investic až 40% pro
  nerezidenty usa." (Jan, FH1 [#comment-1658](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-1-cast/#comment-1658), 2022-10-05)
- "IB to aktuálně řeší tak, že v případě úmrtí majitele účtu jej zablokuje a dokud nedostane potvrzení od IRS o
  uhrazení daně, tak jej pozůstalým neuvolní." (Jan, FH1 [#comment-1665](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-1-cast/#comment-1665), 2022-10-06; hearsay, "někde dočetl")
- "O estate tax vím … rozumím tomu nicméně tak, že … je … nakonec jedno, u kterého brokera je člověk drží, protože
  "vždycky na to přijdou a budou to chtít"." (Petr, FH1 [#comment-2523](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-1-cast/#comment-2523), 2024-01-03)

**For copy:** they say **"dědická daň"**, not "estate tax". The "40 %" and the IB account-freeze claim are
commenters' statements, **not sourced facts**: the page uses only `data/sources.md` §3 (filing above $60 000,
"může podléhat").

## Theme 4: Fees, and surprise that the EU version costs more to trade · confidence **low–medium**

- "Jsem překvapený cenou evropského ekvivalentu. Pokud "18,67 USD za 100 kusů CSPX", tak to vyjde Fio se SPY
  levněji. Rozumím tomu správně? Až se mi nechce věřit." (dan, FH2 [#comment-1350](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-2-cast/#comment-1350), 2022-01-26)
- "Fio má ten příjemný bonus, že když něco nemůžete najit a zavoláte tam na dealing … tak ti typci to tam behem
  chvile pridaji" (Petr, FH2 [#comment-1564](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-2-cast/#comment-1564), 2022-07-07)
- "Je Fio banka vhodná i pro dlouhodobé investování amerických ETF, co když ČR přijme euro?" (Apolo, FH2
  [#comment-2407](https://www.finhacker.cz/jak-obejit-znemozneni-obchodovani-americkych-etfek-2-cast/#comment-2407), 2023-11-04)

**For copy:** confirms decisions.md §0: don't claim the twin is cheaper. Broker fees per trade are what people
notice. **"Fio"** is named spontaneously, so the FAQ answer about Fio is worth its slot.

## Theme 5 (P2): bank funds and the entry fee · confidence **low** (1 source)

- "zaplacen jednorázový vstupní poplatek a k dnešnímu dnu hodnota majetkového účtu odpovídá jen hodnotě příspěvků,
  vstupní poplatek se dosud vůbec v hodnotě neobjevil. … Mám dojem, že platit jednorázový vstupní poplatek je jen
  trik pro prodejce." (TANA B., BK #5739, 2019-01-12)

**For copy:** the P2 visitor talks about **"vstupní poplatek"** and suspects the seller (**"trik pro prodejce"**).
The ad B hook "Kolik vás stojí poplatky?" fits that suspicion. Ongoing fees (TER) never came up in their own words,
so the page has to explain them in crowns rather than percent.

## Vocabulary bank (what they actually write)

| They write | Use on the page | Avoid |
|---|---|---|
| "zakázaná ETFka", "nedovoluje obchodovat", "nejde" | "broker vám ho neprodá", "nejde koupit" | "regulatorní omezení distribuce" |
| "evropský ekvivalent", "alternativa" (the blog author: "evropské zrcadlo") | "evropské dvojče" (brand), "evropská verze" | "substitut" |
| "ETFko", "ETFka" | fine in ads/FAQ; "ETF" in headings | |
| ISIN (they search by it) | show ISIN in the plan, tell them to paste it into the broker | |
| "dědická daň" | "americká dědická daň" | "estate tax" alone |
| "vstupní poplatek", "trik pro prodejce" | "vstupní poplatek až 3–5 %" (sourced) | implying every bank fund charges the maximum |
| "amatér" | write for them; no jargon without a gloss | |
