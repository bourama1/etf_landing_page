// Plan model shared by the e-mail, /plan and the thank-you table (decisions §15 #2, #6, #7, #8).
import { US, UCITS, BANKS, BROKERS, DATA_DATE, byIsin, xetraTicker, usdLondonTicker } from './data.ts';
import type { Fund } from './data.ts';
import { brokerFor, compare, yearRows } from './fees.ts';
import type { Inputs } from './fees.ts';
import type { Selection } from './selection.ts';

export type Twin = {
  xetra: string; london: string | null; name: string; isin: string; terPct: number; distribution: 'acc' | 'dist';
  fundCurrency: string; kidCs: boolean; kidUrl: string | null; issuer: string; asOf: string | null; inception: string;
  sourceUrl: string; indexName: string;
};
export type Group = { kind: 'same' | 'nearest' | 'none'; picks: string[]; indexName: string; twins: Twin[]; similar: Twin[] };
export type Plan = {
  groups: Group[];
  fees: { rows: ReturnType<typeof yearRows>; compare: ReturnType<typeof compare>; terPct: number; terTicker: string;
    brokerName: string; brokerAsOf: string | null };
  dataDate: string;
  fallback: boolean;
};

const FALLBACK = ['VOO', 'SPY', 'IVV'];
// etfs.json has no flag for "closest other index"; VTI's total-market index has no UCITS twin, so we show S&P 500's.
const NEAREST: Record<string, string> = { ms_us_tm: 'sp500' };
const bare = (index: string) => index.replace(/ Index$/, '');

function toTwin(f: Fund): Twin {
  return {
    xetra: xetraTicker(f) ?? f.ticker, london: usdLondonTicker(f), name: f.name, isin: f.isin, terPct: f.ter_pct,
    distribution: f.distribution, fundCurrency: f.fund_currency, kidCs: f.kid_cs === true, kidUrl: f.sources.kid?.url ?? null,
    issuer: f.issuer, asOf: f.sources.default.as_of, inception: f.inception, sourceUrl: f.sources.default.url, indexName: bare(f.index),
  };
}

const order = (a: Twin, b: Twin) =>
  (a.distribution === b.distribution ? 0 : a.distribution === 'acc' ? -1 : 1) || (a.xetra < b.xetra ? -1 : a.xetra > b.xetra ? 1 : 0);

export function buildPlan(sel: Selection, fx: { rate: number; validFor: string }): Plan {
  const fallback = sel.tickers.length === 0;
  const picks = fallback ? FALLBACK : sel.tickers;
  const shown = (isins: string[] = []) =>
    isins.map((i) => byIsin.get(i)!).filter((f) => sel.dividends === 'both' || f.distribution === sel.dividends).map(toTwin).sort(order);

  const groups: Group[] = [];
  for (const ticker of picks) {
    const u = US.find((x) => x.ticker === ticker)!;
    const seen = groups.find((g) => g.indexName === bare(u.index));
    if (seen) { seen.picks.push(ticker); continue; }
    const nearest = NEAREST[u.index_key];
    const donor = !u.twins?.length && nearest ? US.find((x) => x.index_key === nearest && x.twins?.length) : undefined;
    const twinIsins = donor ? donor.twins : u.twins;
    groups.push({
      kind: donor ? 'nearest' : twinIsins?.length ? 'same' : 'none',
      picks: [ticker], indexName: bare(u.index), twins: shown(twinIsins), similar: shown(u.similar),
    });
  }

  // Highest TER among shown twins; ties go to the fund first in etfs.json order (VUAA before CSPX).
  // No twins shown (e.g. SCHD only): use the S&P 500 twins, as the fallback plan does. Never a US ETF's TER.
  const shownIsins = new Set(groups.flatMap((g) => g.twins.map((t) => t.isin)));
  if (!shownIsins.size) shown(US.find((u) => u.index_key === 'sp500')!.twins).forEach((t) => shownIsins.add(t.isin));
  const top = UCITS.filter((f) => shownIsins.has(f.isin)).reduce((a, b) => (b.ter_pct > a.ter_pct ? b : a));
  const terPct = top.ter_pct;
  const terTicker = xetraTicker(top) ?? top.ticker;

  const inp: Inputs = { monthly: sel.monthly, years: sel.years, returnPct: sel.returnPct };
  const ctx = { brokerId: sel.broker, terPct, eurCzk: fx.rate, banks: BANKS, brokers: BROKERS };
  return {
    groups,
    fees: { rows: yearRows(inp, ctx), compare: compare(inp, ctx), terPct, terTicker, brokerName: brokerFor(sel.broker, BROKERS).name,
      brokerAsOf: BROKERS.find((b) => b.id === sel.broker)?.as_of ?? null },
    dataDate: DATA_DATE,
    fallback,
  };
}
