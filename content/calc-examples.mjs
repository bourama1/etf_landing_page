// Worked fee examples quoted in content/ads.md and content/page.md. Run: node content/calc-examples.mjs
// shortcut: copy-only model, replaced by the tested Phase 3 calculator, which must reproduce these numbers.
// Model: monthly payment at the start of each month; the market returns RETURN p.a. before fees; the ongoing fee is
// taken pro rata monthly; the entry fee / FX surcharge is taken off each payment; the ETF also pays FX on the final sale.
// Fees not modelled (both sides): fund transaction costs, bid/ask spreads, custody, taxes.
import { readFileSync } from 'node:fs';

const banks = JSON.parse(readFileSync(new URL('../data/bank-funds.json', import.meta.url))).funds;
const brokers = JSON.parse(readFileSync(new URL('../data/brokers.json', import.meta.url))).brokers;
const etfs = JSON.parse(readFileSync(new URL('../data/etfs.json', import.meta.url))).ucits_etfs;

export function finalValue({ monthly, years, returnPct, entryPct = 0, ongoingPct = 0, exitPct = 0 }) {
  const g = Math.pow(1 + returnPct / 100, 1 / 12) * Math.pow(1 - ongoingPct / 100, 1 / 12);
  let v = 0;
  for (let m = 0; m < years * 12; m++) v = (v + monthly * (1 - entryPct / 100)) * g;
  return v * (1 - exitPct / 100);
}

const base = { monthly: 3000, years: 20, returnPct: 5 };
const fx = brokers.find(b => b.name === 'XTB').fx_pct; // highest published FX surcharge in brokers.json (0.5 %)
const ter = etfs.find(e => e.isin === 'IE00BFMXXD54').ter_pct; // VUAA, 0.07 %; SXR8 has the same TER
const etf = finalValue({ ...base, entryPct: fx, ongoingPct: ter, exitPct: fx });
const noFee = finalValue(base);
const r = n => Math.round(n / 1000) * 1000;

console.log(`Paid in: ${base.monthly * base.years * 12} Kč · ${base.years} let · výnos ${base.returnPct} % p.a. (předpoklad)`);
console.log(`No fees at all: ${r(noFee)} Kč`);
console.log(`Index ETF (TER ${ter} %, FX ${fx} % in and out): ${r(etf)} Kč, fees cost ${r(noFee - etf)} Kč`);
for (const b of banks.filter(b => b.ongoing_pct != null)) {
  const v = finalValue({ ...base, entryPct: b.entry_max_pct, ongoingPct: b.ongoing_pct, exitPct: b.exit_pct });
  console.log(`${b.name} (entry max ${b.entry_max_pct} %, ongoing ${b.ongoing_pct} %): ${r(v)} Kč, fees cost ${r(noFee - v)} Kč, gap vs ETF ${r(etf - v)} Kč`);
}

// Fixed broker fee at a small monthly amount (sources.md §7 worked example, in EUR to avoid an unsourced FX rate)
const fio = brokers.find(b => b.name.startsWith('Fio')).commission;
console.log(`Fio Xetra fee on a 125 EUR buy: ${(fio.tiers_eur[0].fee_eur / 125 * 100).toFixed(2)} %`);
