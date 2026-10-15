// Typed view of data/*.json plus the Czech formatters. Nothing here invents a number: it only reads the snapshot.
import etfsJson from '../../data/etfs.json' with { type: 'json' };
import banksJson from '../../data/bank-funds.json' with { type: 'json' };
import brokersJson from '../../data/brokers.json' with { type: 'json' };
import fxJson from '../../data/fx.json' with { type: 'json' };
import type { Bank, Broker } from './fees.ts';

export type Listing = { exchange: string; ticker: string; currency: string | null };
type Src = { url: string; as_of: string | null };
export type Fund = {
  ticker: string; name: string; issuer: string; isin: string; index_key: string; index: string;
  ter_pct: number; distribution: 'acc' | 'dist'; fund_currency: string; listings: Listing[]; inception: string;
  twins?: string[]; similar?: string[]; kid_cs?: boolean | null;
  sources: { default: Src; kid?: Src };
};

export const US = etfsJson.us_etfs as Fund[];
export const UCITS = etfsJson.ucits_etfs as Fund[];
export const US_TICKERS = US.map((u) => u.ticker);
export const byIsin = new Map(UCITS.map((f) => [f.isin, f]));
export const DATA_DATE = etfsJson.snapshot.retrieved_at;
export const FX = fxJson;
export type BankFund = Bank & { kid_date: string | null; inducements?: { equity_eam_cr_pct_range: number[] } };
export const BANKS = banksJson.funds as BankFund[];
export const BROKERS = brokersJson.brokers as (Broker & { as_of: string | null })[];
// "Nevím" uses the highest published FX surcharge, so its source line cites that broker (decisions §15 #3).
export const FX_BROKER = BROKERS.reduce((a, b) => ((b.fx_pct ?? 0) > (a.fx_pct ?? 0) ? b : a));
const SHORT: Record<string, string> = { xtb: 'XTB', t212: 'Trading 212', fio: 'Fio', cs: 'ČS' };
export const brokerShort = (b: { id: string; name: string }) => SHORT[b.id] ?? b.name;

const NBSP = String.fromCharCode(160);
const num = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 4 });
export const fmtNum = (n: number) => num.format(n);
export const fmtPct = (n: number) => `${num.format(n)}${NBSP}%`;
export const fmtCzk = (n: number) => `${num.format(Math.round(n))}${NBSP}Kč`;
// TER is always written with two decimals, as issuers and page.md do ("0,30 %").
const ter = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
export const fmtTer = (n: number) => `${ter.format(n)}${NBSP}%`;
const span = (xs: number[], nf: Intl.NumberFormat) => {
  const lo = Math.min(...xs), hi = Math.max(...xs);
  return lo === hi ? `${nf.format(hi)}${NBSP}%` : `${nf.format(lo)}–${nf.format(hi)}${NBSP}%`;
};
export const fmtPctRange = (xs: number[]) => span(xs, num);
export const fmtTerRange = (xs: number[]) => span(xs, ter);
export const fmtCzkRange = (lo: number, hi: number) => `${num.format(Math.round(lo))}–${fmtCzk(hi)}`;
// Czech noun form: 1 → one, 2–4 → few, anything else (0, 5+) → many.
export const plural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
};

// Public list of every source; the repo is the project's home.
export const SOURCES_URL = 'https://github.com/bourama1/etf_landing_page/blob/master/data/sources.md';

const listing = (f: Fund, exchange: string, currency?: string) =>
  f.listings.find((l) => l.exchange.includes(exchange) && (currency == null || l.currency === currency));
export const xetraTicker = (f: Fund) => listing(f, 'Xetra')?.ticker ?? null;
export const usdLondonTicker = (f: Fund) => listing(f, 'London', 'USD')?.ticker ?? null;
