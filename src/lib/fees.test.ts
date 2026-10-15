// Oracle: output of `node content/calc-examples.mjs` (pasted at task 5 start):
// Paid in: 720000 Kč · 20 let · výnos 5 % p.a. (předpoklad)
// No fees at all: 1222000 Kč
// Index ETF (TER 0.07 %, FX 0.5 % in and out): 1200000 Kč, fees cost 22000 Kč
// ČSOB Akciový (entry max 3 %, ongoing 2.59 %): 883000 Kč, fees cost 339000 Kč, gap vs ETF 317000 Kč
// KB Portfolio – Akciových indexů – Exclusive (entry max 5 %, ongoing 1.75 %): 950000 Kč, fees cost 272000 Kč, gap vs ETF 250000 Kč
// Fio Xetra fee on a 125 EUR buy: 3.16 %
import { test } from 'node:test';
import assert from 'node:assert/strict';
import banksJson from '../../data/bank-funds.json' with { type: 'json' };
import brokersJson from '../../data/brokers.json' with { type: 'json' };
import { finalValue, compare, yearRows, roundK, commissionEur, brokerFor, etfValue } from './fees.ts';
import type { Broker, Bank, Inputs } from './fees.ts';

const banks = banksJson.funds as Bank[], brokers = brokersJson.brokers as Broker[];
const base: Inputs = { monthly: 3000, years: 20, returnPct: 5 };
const ctx = { brokerId: 'unknown' as const, terPct: 0.07, eurCzk: 24.355, banks, brokers };

test('reproduces content/calc-examples.mjs for the default inputs', () => {
  const r = compare(base, ctx);
  assert.equal(roundK(r.noFee), 1222000);
  assert.equal(roundK(r.etf), 1200000);
  assert.equal(roundK(r.etfCost), 22000);
  assert.equal(roundK(r.bankMin), 883000);
  assert.equal(roundK(r.bankMax), 950000);
  assert.equal(roundK(r.bankCostMin), 272000);
  assert.equal(roundK(r.bankCostMax), 339000);
});

test('"Nevím" uses the highest published FX surcharge from brokers.json', () => {
  const max = Math.max(...brokers.map((b) => b.fx_pct ?? 0));
  assert.equal(brokerFor('unknown', brokers).fx_pct, max);
});

test('Fio fixed fee: 3.95 EUR on a 125 EUR buy is 3.16 % (calc-examples)', () => {
  const fio = brokerFor('fio', brokers);
  assert.equal(commissionEur(fio.commission, 125), 3.95);
  assert.equal((commissionEur(fio.commission, 125) / 125 * 100).toFixed(2), '3.16');
});

test('Fio tiers: 1 401 EUR -> 4.95, 10 000 EUR -> 0.15 % = 15, 3 500 EUR -> min 6.95', () => {
  const c = brokerFor('fio', brokers).commission;
  assert.equal(commissionEur(c, 1401), 4.95);
  assert.equal(commissionEur(c, 10000), 15);
  assert.equal(commissionEur(c, 3500), 6.95);
});

test('ČS: 0.35 % with a 4 EUR minimum, custody adds to ongoing cost', () => {
  const cs = brokerFor('cs', brokers);
  assert.equal(commissionEur(cs.commission, 123), 4);
  assert.equal(commissionEur(cs.commission, 2000), 7);
  const withCustody = etfValue(base, cs, 0.07, 24.355);
  const sameNoCustody = etfValue(base, { ...cs, custody_pct: 0 }, 0.07, 24.355);
  assert.ok(withCustody < sameNoCustody);
});

test('fixed-fee note appears for Fio at 3 000 Kč and not for XTB', () => {
  assert.ok(compare(base, { ...ctx, brokerId: 'fio' }).fixedFeePct! > 2);
  assert.equal(compare(base, { ...ctx, brokerId: 'xtb' }).fixedFeePct, null);
});

test('year rows: 1/5/10/15/20 and the 20-year row equals compare()', () => {
  const rows = yearRows(base, ctx);
  assert.deepEqual(rows.map((r) => r.year), [1, 5, 10, 15, 20]);
  assert.equal(rows[4].paidIn, 720000);
  assert.equal(roundK(rows[4].etf), 1200000);
  assert.equal(roundK(rows[4].bankMin), 883000);
  assert.equal(roundK(rows[4].bankMax), 950000);
  assert.deepEqual(yearRows({ ...base, years: 7 }, ctx).map((r) => r.year), [1, 5, 7]);
});

test('0 % return and no fees returns exactly the money paid in', () => {
  assert.equal(finalValue({ monthly: 1000, years: 2, returnPct: 0 }), 24000);
});
