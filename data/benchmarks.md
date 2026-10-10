# Conversion benchmarks (sourced replacement for the lead-magnets skill tables)

The `lead-magnets` skill ships `references/benchmarks.md` with **no sources**. Per CLAUDE.md it is never cited. This
file checks the skill's claims that matter for this project against primary publishers of benchmark data.
Retrieved 2026-10-10. Quotes are verbatim from the source page (checked against the raw HTML, not the fetch summary).

## Sources

| ID | Source | Sample / scope | Date |
|---|---|---|---|
| **UB** | Unbounce, *What's a good conversion rate? (Based on 41,000 landing pages)*, https://unbounce.com/landing-pages/whats-a-good-conversion-rate/ | "Unbounce's 2024 Conversion Benchmark Report, based on real data from over 57 million conversions, 41,000 landing pages, and 464 million pageviews". Pages hosted on Unbounce, all traffic sources, any conversion goal (not only forms). Medians. | Updated 2025-07-25 |
| **LQ** | LocaliQ, *Facebook Advertising Benchmarks for 2026*, https://localiq.com/blog/facebook-advertising-benchmarks/ | "20 industries", averages (not medians). Lead figures are for **Facebook Lead Ads** (in-app form), not landing pages. Country and period not stated. | Last updated 2026-09-23 |
| **MC** | Mailchimp, *Email marketing benchmarks*, https://mailchimp.com/resources/email-marketing-benchmarks/ | Mailchimp campaigns sent to ≥ 1,000 subscribers, by self-reported industry. Averages. | "last updated in December 2023" |
| **CXL** | CXL, *reduce form fields*, https://conversionxl.com/reduce-form-fields/ | Case studies, not a controlled study | undated |

## Skill claim → what the sources say

| Skill claim (unsourced) | Sourced figure | Verdict |
|---|---|---|
| Landing page conversion, **Finance 10–20 %** | UB: "The median conversion rate is 8.3% for landing pages in the financial services industry." · "investing pages land at just **3.9%**" · "The top performing financial services landing pages typically convert at 26.1% or higher" | **Overstated.** Use 3.9 % (investing) as the base, 8.3 % (financial services) as the upper reference |
| All-industry landing page median (implied 15–35 % ranges) | UB: "The median conversion rate for landing pages is 6.6% across all industries." | Skill ranges are well above the median |
| Mobile converts worse | UB: "Mobile accounts for 83% of landing page visits but often converts worse than desktop", **but** in financial services "Mobile traffic actually converts 27.8% better than desktop" | Mobile-first finance page is not a handicap |
| Dedicated landing page (paid) 10–25 % | No primary source found | **Unsupported**, not used |
| Facebook/Instagram CPL **$3–15** | LQ: "The average cost per lead in Facebook ads for the leads objective across industries is $27.39" (Lead Ads); avg CVR "8.54%", lead-campaign CTR "2.70%", CPC "$1.80". No Finance & Insurance lead figures published (traffic campaigns only: CTR 1.46 %, CPC $0.86) | **Understated** by ~2–9× vs. the US-centred average; not CZ-specific |
| Conversion by format (checklist 30–50 %, quiz 30–50 %, …) | No primary source found (only vendor blogs) | **Unsupported**, not used |
| "Every extra field reduces conversion by 5–10 %" | CXL: cutting fields can raise or **lower** conversion (cites a test where removing fields gave "a 14% drop"); evidence is case-based | **Unsupported** as a rule. Our form is e-mail-only anyway |
| E-mail open 30–50 %, click 2–5 % | MC "Business + Finance": open **31.35 %**, click **2.78 %**, unsubscribe 0.15 %; all users: 35.63 % / 2.62 % / 0.22 % | Roughly consistent, but data is from 2023 and opens are inflated by Apple Mail Privacy Protection (not quantified here). Use clicks (`magnet_opened`) as the real signal |

Inconsistency noted in LQ: it lists the "highest CPCs for the leads objective" as $0.73–$1.08, while the average
is $1.80, which can't both be right (probably "lowest"). Only the averages are used.

## What this gives the README (expected conversion, reasoning, not a benchmark)

Funnel definition: **lead_submitted ÷ page_view**, per ad variant (decisions.md §12).

- Base: UB investing-page median **3.9 %**. It is the closest category to ours (investing, a finance landing page).
- Pushes up: the offer is free and email-only. Value shows before the form. Mobile finance traffic converts better
  than desktop (UB +27.8 %). The interactive step means visitors who reach the form are already engaged.
- Pushes down: cold paid-social traffic from an in-app browser with a few seconds of attention (UB mixes all
  traffic sources; LQ shows finance has below-average CTR on traffic campaigns, 1.46 % vs. the all-industry
  figure). A new brand has no track record (decisions.md §2 value equation).
- **Planning estimate: 4–6 % of page views, 5 % as the point estimate. Below 3 % after ~1 000 visits per variant
  means rework. 8 % or more would match the financial-services median (UB 8.3 %).** This is our judgement anchored
  on UB, and the README must present it that way.
- Cost sanity check: LQ's average Lead-Ads CPL is $27.39. A landing-page funnel at 5 % with LQ's lead-campaign
  CPC of $1.80 would be about $1.80 ÷ 0.05 = **$36 per lead** (arithmetic on US averages, not a CZ forecast; CZ CPCs
  not sourced).

## Gaps

- No Czech or CEE-specific landing-page or Meta CPC/CPL benchmark found.
- No primary benchmark for interactive calculators/quizzes as lead magnets (vendor claims only).
- Unbounce's full PDF report was not opened; figures come from Unbounce's own summary page of that report.
