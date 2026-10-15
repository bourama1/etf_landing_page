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

const NBSP = String.fromCharCode(160);
const num = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 4 });
export const fmtNum = (n: number) => num.format(n);
export const fmtPct = (n: number) => `${num.format(n)}${NBSP}%`;
export const fmtCzk = (n: number) => `${num.format(Math.round(n))}${NBSP}Kč`;
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
};

const listing = (f: Fund, exchange: string, currency?: string) =>
  f.listings.find((l) => l.exchange.includes(exchange) && (currency == null || l.currency === currency));
export const xetraTicker = (f: Fund) => listing(f, 'Xetra')?.ticker ?? null;
export const usdLondonTicker = (f: Fund) => listing(f, 'London', 'USD')?.ticker ?? null;
