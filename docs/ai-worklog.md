# AI worklog

One entry per significant step: what was asked, what came back, how it was checked, and mistakes caught.

---

## 2026-10-08 — Phase 0: positioning + decisions (Claude Code, Opus 5.5)

**Asked (Matěj):** "Read CLAUDE.md. Run product-marketing for this project, then brainstorm Phase 0 with me using
lead-magnets and offers. Stop after docs/decisions.md is done, then run /export into ai-log/."

**What the agent did**
1. Loaded skills `marketing-skills:product-marketing`, `lead-magnets`, `offers` (plus `lead-magnets/references/
   benchmarks.md`), and later `frontend-design` for the visual direction CLAUDE.md requires.
2. Auto-drafted `.agents/product-marketing.md` from CLAUDE.md (the only file in the repo). No subagents were used.
3. Ran 3 web searches to sanity-check the core premise (PRIIPs/KID block) before building the concept on it.
4. Asked Matěj 4 questions (operator, magnet/interaction, ad angles, hosting) and wrote `docs/decisions.md`.

**Matěj's answers:** independent brand (placeholders for operator details) · "all 3" interactive elements ·
ad angles "Fees in CZK" + "Blocked trade" · Vercel Hobby.

**How output was checked**
- The premise was checked against web sources before use (see below).
- The decisions doc tags every unverified factual claim **VERIFY** so Phase 1 can't skip it.
- "All 3" conflicts with CLAUDE.md's "at most 1–2". The agent did not silently comply or silently refuse: it merged
  them into one 3-step flow and flagged the deviation in decisions.md §4 for review.

**Mistakes / hallucinations caught**
1. **CLAUDE.md's premise is too strong.** "Czech retail investors generally cannot buy US ETFs" largely holds
   (IBKR, SEB), but a secondhand source (Finhacker quoting Fio) says Fio still allows execution-only trading of US
   ETFs, citing a ČNB position. Copy changed to "u většiny brokerů". Fio's stance must be verified in Phase 1.
2. **Agent's own drafting error:** the first product-marketing draft claimed "stejný index, nižší náklady" (UCITS
   twin cheaper than the US original). This came from intuition, not data, and is likely wrong (US originals have
   very low TERs). Caught while choosing the fee-calculator angle. The fee story was reframed to bank fund vs.
   index ETF.
3. **Unsourced benchmarks inside a skill:** `lead-magnets/references/benchmarks.md` gives conversion rates by
   industry ("Finance 10–20 %") with no source. Not used as evidence. The README conversion estimate needs cited
   benchmarks.
4. **Fabricated self-check:** the first draft of decisions.md §10 said a generic prompt "gave me" a navy/teal card
   grid. No such prompt was run. Rewritten as a labelled thought experiment.
5. The agent did not invent "verbatim customer quotes" for the context doc's Customer Language section, even
   though the skill template asks for them. They are marked as a Phase 2 research task.
