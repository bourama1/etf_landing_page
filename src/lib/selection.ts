import type { BrokerId } from './fees.ts';

// Trust boundary: every value that reaches the lead form, /api/lead or /plan goes through here (decisions §6a).
export const RANGES = {
  monthly: [500, 30000, 500, 3000],
  years: [1, 40, 1, 20],
  returnPct: [0, 10, 0.5, 5],
} as const;

const BROKERS: BrokerId[] = ['unknown', 'xtb', 't212', 'fio', 'cs'];
const DIVIDENDS = ['acc', 'dist', 'both'] as const;
type Dividends = (typeof DIVIDENDS)[number];

export type Selection = {
  tickers: string[];
  monthly: number;
  years: number;
  returnPct: number;
  broker: BrokerId;
  dividends: Dividends;
};

function num(v: string | null, [min, max, step, def]: readonly number[]): number {
  const trimmed = v?.trim();
  const n = trimmed ? Number(trimmed) : NaN;
  if (!Number.isFinite(n)) return def;
  const clamped = Math.min(max, Math.max(min, n));
  return Math.round((clamped - min) / step) * step + min;
}

export function parseSelection(p: URLSearchParams, knownTickers: string[]): Selection {
  const requested = new Set((p.get('t') ?? '').split(',').map((t) => t.trim().toUpperCase()));
  const broker = p.get('b') as BrokerId;
  const dividends = p.get('d') as Dividends;
  return {
    tickers: knownTickers.filter((k) => requested.has(k)),
    monthly: num(p.get('m'), RANGES.monthly),
    years: num(p.get('y'), RANGES.years),
    returnPct: num(p.get('r'), RANGES.returnPct),
    broker: BROKERS.includes(broker) ? broker : 'unknown',
    dividends: DIVIDENDS.includes(dividends) ? dividends : 'both',
  };
}

export function toParams(s: Selection): URLSearchParams {
  return new URLSearchParams([
    ['t', s.tickers.join(',')],
    ['m', String(s.monthly)],
    ['y', String(s.years)],
    ['r', String(s.returnPct)],
    ['b', s.broker],
    ['d', s.dividends],
  ]);
}

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function validateEmail(raw: unknown): { ok: true; email: string } | { ok: false; reason: 'empty' | 'invalid' } {
  const email = raw == null ? '' : String(raw).trim().toLowerCase();
  if (email === '') return { ok: false, reason: 'empty' };
  if (email.length > 254 || /[\u0000-\u001f]/.test(email) || !EMAIL_RE.test(email)) return { ok: false, reason: 'invalid' };
  return { ok: true, email };
}

export function sanitizeUtm(p: URLSearchParams): Record<'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content' | 'utm_term', string> {
  const get = (k: string) => (p.get(k) ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 100).trim();
  return {
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
  };
}

export function adVariant(utmContent: string): 'a' | 'b' | 'unknown' {
  const m = /^ad_([ab])(?:_|$)/.exec(utmContent);
  return m ? (m[1] as 'a' | 'b') : 'unknown';
}
