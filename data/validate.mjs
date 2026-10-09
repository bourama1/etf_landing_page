// Validates data/etfs.json: ISIN check digits, required fields, source references, twin links.
// Run: node data/validate.mjs            (exit 1 on any problem)
//      node data/validate.mjs --isin 922908363   (print the US ISIN derived from a CUSIP)
import { readFileSync } from 'node:fs';

// ISO 6166 check digit: letters -> numbers (A=10…Z=35), then Luhn over the digit string.
export function isinCheckDigit(body11) {
  const digits = [...body11.toUpperCase()].map((c) => parseInt(c, 36)).join('');
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 0) d *= 2; // rightmost digit is doubled (check digit not yet appended)
    sum += d > 9 ? d - 9 : d;
  }
  return String((10 - (sum % 10)) % 10);
}
export const isValidIsin = (isin) => /^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin) && isinCheckDigit(isin.slice(0, 11)) === isin[11];

// Self-check against ISINs published by issuers (SSGA, iShares, Vanguard factsheets).
for (const known of ['US78462F1030', 'IE00B5BMR087', 'IE00B3XXRP09', 'IE000VAHT5T0', 'IE00BFZXGZ54']) {
  if (!isValidIsin(known)) throw new Error(`ISIN self-check failed on ${known}`);
}
if (isValidIsin('US78462F1031')) throw new Error('ISIN self-check accepted a wrong check digit');

const arg = process.argv.indexOf('--isin');
if (arg > -1) {
  const body = 'US' + process.argv[arg + 1];
  console.log(body + isinCheckDigit(body));
  process.exit(0);
}

const data = JSON.parse(readFileSync(new URL('./etfs.json', import.meta.url), 'utf8'));
const problems = [];
const funds = [...data.us_etfs, ...data.ucits_etfs];
const byIsin = new Map(data.ucits_etfs.map((f) => [f.isin, f]));
const required = ['ticker', 'name', 'issuer', 'index', 'domicile', 'ter_pct', 'distribution', 'fund_currency',
  'listings', 'inception', 'sources'];

for (const f of funds) {
  const id = f.ticker;
  for (const k of required) if (f[k] === undefined || f[k] === '') problems.push(`${id}: missing ${k}`);
  if (f.isin !== null && !isValidIsin(f.isin)) problems.push(`${id}: bad ISIN ${f.isin}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.inception)) problems.push(`${id}: inception not ISO date`);
  if (typeof f.ter_pct !== 'number' || f.ter_pct <= 0 || f.ter_pct > 1) problems.push(`${id}: ter_pct out of range`);
  if (!['acc', 'dist'].includes(f.distribution)) problems.push(`${id}: distribution must be acc|dist`);
  const keys = Object.keys(f.sources ?? {});
  if (!keys.includes('default')) problems.push(`${id}: sources.default missing`);
  for (const [k, s] of Object.entries(f.sources ?? {})) {
    if (!/^https:\/\//.test(s.url)) problems.push(`${id}: source ${k} has no https url`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.retrieved_at)) problems.push(`${id}: source ${k} retrieved_at not ISO`);
    if (s.as_of !== null && !/^\d{4}-\d{2}-\d{2}$/.test(s.as_of)) problems.push(`${id}: source ${k} as_of not ISO/null`);
  }
  for (const [field, key] of Object.entries(f.field_sources ?? {})) {
    if (!keys.includes(key)) problems.push(`${id}: field_sources.${field} -> unknown source ${key}`);
  }
}
for (const f of data.us_etfs) {
  for (const isin of [...f.twins, ...f.similar]) {
    const t = byIsin.get(isin);
    if (!t) { problems.push(`${f.ticker}: twin ${isin} not in ucits_etfs`); continue; }
    if (f.twins.includes(isin) && t.index_key !== f.index_key) problems.push(`${f.ticker}: twin ${t.ticker} tracks a different index`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`OK: ${data.us_etfs.length} US + ${data.ucits_etfs.length} UCITS funds, all ISINs valid, twins consistent.`);
