# Product Marketing Context

**Document version:** v2
**Last updated:** 2026-10-08

> Auto-drafted from `CLAUDE.md` (the only file in the repo at the time). There is no customer research behind it
> yet. Anything marked *(hypothesis)* is an assumption to validate, not a finding. Tax and regulatory claims are
> **unverified** until Phase 1 sources them in `data/`.

## Product Overview
**One-liner:** A free tool that tells a Czech investor which European (UCITS) ETF to buy instead of the US ETF they
heard about (VOO, SPY, QQQ, VTI), and what that choice costs over 20 years.
**What it does:** The visitor picks the NYSE ETFs they wanted. The page shows the UCITS equivalent that tracks the
same index (ticker, TER, accumulating/distributing, currency, exchange) and a fee comparison. The full,
personalised summary (all their picks, fee impact, CZ tax checklist, where to buy it from CZ) is sent by e-mail.
**Product category:** Investment education / ETF comparison tool (shelf: "jaké ETF koupit", "VOO z Česka",
"S&P 500 ETF Česko").
**Product type:** Lead-magnet landing page (content plus an interactive comparison).
**Business model:** Lead generation for an independent, neutral brand (working name **ETF Dvojče**): not a broker,
no products, no affiliate links. Real operator details are placeholders until launch (see `docs/decisions.md` §9).

## Target Audience
**Target:** Czech retail investors on mobile who arrive from a paid social ad (B2C, so no company type applies).
**Decision-maker:** The individual, often a self-directed beginner. *(hypothesis)*
**Primary use case:** "I want to buy the S&P 500 ETF everyone talks about. My broker either won't let me, or I'm
not sure it's the right version for me."
**Jobs to be done:**
- Find out what I'm actually allowed to buy, and which version of it is right for me.
- Avoid paying more in fees or taxes than I have to without having to become an expert.
- Feel confident I'm not making a beginner mistake with my savings.
**Use cases:**
- Tried to buy VOO/SPY in a broker app and got "produkt není dostupný pro retailové klienty".
- Saw "just buy VOO" on Reddit/YouTube/TikTok and wants the Czech version of that advice.
- Already holds a UCITS ETF and wants to check it isn't overpriced against alternatives.

## Personas
B2C, so this is a single decision-maker. The personas are defined in `docs/decisions.md` §1.

## Problems & Pain Points
**Core problem:** The advice is American but the investor is Czech. At most brokers the ETF everyone names is not
available to EU retail clients because it has no PRIIPs KID (Fio may be an exception; to verify). Even where a broker allows it, it may not be the best choice for
a Czech tax resident. *(both parts to verify in Phase 1)*
**Why alternatives fall short:**
- US content (Reddit, YouTube) assumes a US account and US taxes.
- Broker apps show the error but don't suggest the equivalent.
- Czech finance blogs are long and SEO-shaped, which makes them hard to use in 5 seconds on a phone.
- Justetf-style screeners are powerful but overwhelming for a beginner (hundreds of S&P 500 trackers).
**What it costs them:** Time, decision paralysis (they keep money in a savings account), or a pricier or less
tax-efficient fund chosen by accident.
**Emotional tension:** "Am I even allowed to buy this?", "Will I mess up the taxes?", "Is this a scam trying to
sell me something?"

## Competitive Landscape
**Direct:** justETF, ETF comparison articles on Czech finance sites (Finex, Finhacker, Měšec). They are thorough
but not built for a 5-second mobile visit and don't map "my US ticker → your UCITS ticker" in one step.
**Secondary:** Broker education pages (XTB, Trading 212, Portu, Fio). They are biased toward their own shelf.
**Indirect:** Asking a friend or a Facebook group, using a robo-advisor (Portu and similar), or doing nothing and
leaving the money in a savings account.

## Differentiation
**Key differentiators:**
- Starts from the ticker the visitor already knows (VOO), not from a screener.
- Czech-specific: CZ tax rules, CZK and EUR context, and where to buy it from CZ.
- Every number has a source and date on the page.
**How we do it differently:** A one-tap translation from US ETF to UCITS ETF, with the fee difference shown in CZK.
**Why that's better:** One decision instead of fifty, in the visitor's currency and tax context.
**Why customers choose us:** We are not a broker and we don't sell a fund (true for the chosen independent-brand operator).

## Objections
| Objection | Response |
|-----------|----------|
| "Why do you want my e-mail? Will you spam me?" | Say exactly what arrives (one e-mail with the summary) and that unsubscribing takes one click. Marketing consent is separate and not pre-ticked. |
| "Is this investment advice / are you selling something?" | No. It's information only, with an operator disclosure and sources on every number. |
| "Isn't the European version worse than the real VOO?" | Same index, comparable fees, with differences shown honestly (TER, tracking, domicile, tax). |

**Anti-persona:** Professional or experienced traders who already know UCITS vs US domicile. People who want stock
tips or crypto. People looking for get-rich-quick returns.

## Switching Dynamics
**Push:** The broker blocked the trade, or US advice doesn't fit Czech reality.
**Pull:** A clear answer in seconds: "buy this ticker, here's why".
**Habit:** Following a favourite YouTuber, sticking with the bank's own funds, or doing nothing.
**Anxiety:** Taxes, picking the wrong fund, being sold to, or handing an e-mail to a stranger.

## Customer Language
**How they describe the problem:** *(hypothesis. Mine r/czech, r/eupersonalfinance and Finex/Finhacker comments
before writing copy in Phase 2. No verbatim quotes have been collected yet, and none are invented here.)*
**Words to use:** ETF, S&P 500, poplatky, daně, "koupit z Česka", konkrétní ticker (VOO, CSPX, VUAA), korun.
**Words to avoid:** "zaručený výnos", "pasivní příjem", "tajný", "Odemkněte svůj potenciál", and any implied
recommendation ("doporučujeme koupit").
**Glossary:**
| Term | Meaning |
|------|---------|
| UCITS | EU fund framework. These ETFs have a KID and can be sold to EU retail clients. |
| KID | Key Information Document required by PRIIPs for products sold to retail clients |
| TER | Total expense ratio, the annual fund fee |
| Akumulační / distribuční | Reinvests dividends or pays them out |
| Domicil | Country where the fund is legally based (IE, LU, US) |

## Brand Voice
**Tone:** Calm, factual, a bit dry. The knowledgeable friend, not the finfluencer.
**Style:** Direct and short. Numbers first. One idea per sentence.
**Personality:** Honest, precise, practical, unhyped.

## Proof Points
**Metrics:** Only sourced fund data (TER, AUM, inception) and regulation citations. No user counts.
**Customers / Testimonials:** None. None will be invented.
**Value themes:**
| Theme | Proof |
|-------|-------|
| "Tohle si koupit můžete" | PRIIPs text + broker help pages (Phase 1) |
| "Stejný index, evropská verze" | Issuer factsheets (Phase 1). Do NOT claim UCITS is cheaper than the US original |
| "Poplatky v korunách" | Bank-fund KIDs vs. index ETF TER (Phase 1) |
| "Daně v Česku jasně" | financnisprava.cz (Phase 1) |

## Goals
**Business goal:** Collect qualified e-mail leads from paid mobile traffic at a cost that would justify running the
ads (the reviewer's question: "could we run ads tomorrow?").
**Conversion action:** Submit e-mail to receive the personalised summary.
**Current metrics:** None (new page).

## Changelog
*Newest first. One line per revision: what changed and why.*
- v2 (2026-10-08) — Phase 0: operator = independent brand "ETF Dvojče"; softened the access claim (Fio exception);
  dropped the "UCITS is cheaper" value theme as unsupported; added the CZK-fees theme for ad B.
- v1 (2026-10-08) — Initial context, auto-drafted from CLAUDE.md. Operator and customer language still open.
