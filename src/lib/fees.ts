// Fee model, decisions §4/§15 and content/calc-examples.mjs (the oracle these tests reproduce).
export type Inputs = { monthly: number; years: number; returnPct: number };
export type BrokerId = 'unknown' | 'xtb' | 't212' | 'fio' | 'cs';
type Tier = { up_to_eur: number | null; fee_eur?: number; fee_pct?: number; min_eur?: number };
export type Commission = { pct?: number; min_eur?: number; tiers_eur?: Tier[] };
export type Broker = { id: BrokerId; name: string; commission: Commission; fx_pct: number | null; custody_pct: number };
export type Bank = { name: string; entry_max_pct: number; ongoing_pct: number | null; exit_pct: number | null };

export function finalValue({ monthly, years, returnPct, entryPct = 0, ongoingPct = 0, exitPct = 0 }:
  Inputs & { entryPct?: number; ongoingPct?: number; exitPct?: number }) {
  const g = Math.pow(1 + returnPct / 100, 1 / 12) * Math.pow(1 - ongoingPct / 100, 1 / 12);
  let v = 0;
  for (let m = 0; m < years * 12; m++) v = (v + monthly * (1 - entryPct / 100)) * g;
  return v * (1 - exitPct / 100);
}

export function brokerFor(id: BrokerId, brokers: Broker[]): Broker {
  if (id !== 'unknown') return brokers.find((b) => b.id === id)!;
  const fx = Math.max(...brokers.map((b) => b.fx_pct ?? 0));
  return { id, name: 'Nevím', commission: { pct: 0, min_eur: 0 }, fx_pct: fx, custody_pct: 0 };
}

// shortcut: ignores XTB's 0.2 % above 100 000 EUR monthly turnover; upgrade if sale values that large matter.
export function commissionEur(c: Commission, eur: number) {
  if (c.tiers_eur) {
    const t = c.tiers_eur.find((t) => t.up_to_eur == null || eur <= t.up_to_eur)!;
    return t.fee_eur ?? Math.max((eur * t.fee_pct!) / 100, t.min_eur ?? 0);
  }
  return Math.max((eur * (c.pct ?? 0)) / 100, c.min_eur ?? 0);
}

const commissionPct = (b: Broker, czk: number, eurCzk: number) => (commissionEur(b.commission, czk / eurCzk) * eurCzk / czk) * 100;

export function etfValue(inp: Inputs, b: Broker, terPct: number, eurCzk: number) {
  const fx = b.fx_pct ?? 0;
  const gross = finalValue({ ...inp, entryPct: fx + commissionPct(b, inp.monthly, eurCzk), ongoingPct: terPct + b.custody_pct });
  return gross * (1 - (fx + commissionPct(b, gross, eurCzk)) / 100);
}

export const roundK = (n: number) => Math.round(n / 1000) * 1000;

type Ctx = { brokerId: BrokerId; terPct: number; eurCzk: number; banks: Bank[]; brokers: Broker[] };

export function compare(inp: Inputs, ctx: Ctx) {
  const b = brokerFor(ctx.brokerId, ctx.brokers);
  const noFee = finalValue(inp);
  const etf = etfValue(inp, b, ctx.terPct, ctx.eurCzk);
  const bankVals = ctx.banks.filter((f) => f.ongoing_pct != null).map((f) =>
    finalValue({ ...inp, entryPct: f.entry_max_pct, ongoingPct: f.ongoing_pct!, exitPct: f.exit_pct ?? 0 }));
  const bankMin = Math.min(...bankVals), bankMax = Math.max(...bankVals);
  const fixed = commissionPct(b, inp.monthly, ctx.eurCzk);
  const pctOnly = (b.commission.pct ?? 0); // a pure-percentage fee is not a "fixed fee"
  return { noFee, etf, etfCost: noFee - etf, bankMin, bankMax, bankCostMin: noFee - bankMax, bankCostMax: noFee - bankMin,
    fixedFeePct: fixed > 2 && fixed > pctOnly + 1e-9 ? fixed : null };
}

export function yearRows(inp: Inputs, ctx: Ctx, marks = [1, 5, 10, 15, 20]) {
  const years = marks.filter((y) => y < inp.years);
  years.push(inp.years);
  return years.map((year) => {
    const r = compare({ ...inp, years: year }, ctx);
    return { year, paidIn: inp.monthly * 12 * year, bankMin: r.bankMin, bankMax: r.bankMax, etf: r.etf };
  });
}
