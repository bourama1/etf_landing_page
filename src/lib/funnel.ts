// Pure parts of the funnel tracking (decisions §12, plan 2026-10-15-phase4). DOM wiring: src/scripts/funnel.ts.
import type { Selection } from './selection.ts';

export type Props = Record<string, string | number>;

export function once() {
  const seen = new Set<string>();
  return (key: string) => !seen.has(key) && !!seen.add(key);
}

// ≥ 50 % of the section, or the section fills ≥ 50 % of the screen (the tool is taller than two phone screens).
export function sectionVisible(e: { intersectionRect: { height: number }; boundingClientRect: { height: number } }, viewportH: number) {
  const need = Math.min(e.boundingClientRect.height, viewportH) / 2;
  return need > 0 && e.intersectionRect.height >= need;
}

export function stepProps(step: 'a' | 'b' | 'c', s: Selection): Props {
  if (step === 'a') return { step, tickers: s.tickers.join(',') };
  if (step === 'b') return { step, monthly: s.monthly, years: s.years, broker: s.broker };
  return { step, dividends: s.dividends };
}

export const resultProps = (s: Selection): Props => ({ tickers: s.tickers.join(','), monthly: s.monthly, years: s.years });

// Last line of defence: no e-mail address ever leaves in an event (CLAUDE.md tracking, GDPR).
export const isSafeProps = (p?: Props) => !p || Object.values(p).every((v) => typeof v !== 'string' || !v.includes('@'));
