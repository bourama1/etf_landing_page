import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan } from './plan.ts';
import { parseSelection } from './selection.ts';
import { US_TICKERS, FX } from './data.ts';

const fx = FX;
const plan = (q: string) => buildPlan(parseSelection(new URLSearchParams(q), US_TICKERS), fx);
const xetras = (g: { twins: { xetra: string }[] }) => g.twins.map((t) => t.xetra);

// Expected values below were read from data/etfs.json (Xetra listing ticker, distribution, ter_pct, kid_cs).
test('VOO+SPY+IVV group into one S&P 500 group with 6 twins, acc first', () => {
  const p = plan('t=VOO,SPY,IVV');
  assert.equal(p.groups.length, 1);
  assert.equal(p.groups[0].kind, 'same');
  assert.deepEqual(p.groups[0].picks, ['VOO', 'SPY', 'IVV']);
  assert.deepEqual(xetras(p.groups[0]), ['SPYL', 'SXR8', 'VUAA', 'IUSA', 'SPY5', 'VUSA']);
  assert.equal(p.groups[0].indexName, 'S&P 500');
});

test('dividends=acc filters to accumulating twins', () => {
  const p = plan('t=QQQ&d=acc');
  assert.deepEqual(xetras(p.groups[0]), ['EQQB', 'SXRV']);
  assert.ok(p.groups[0].twins.every((t) => t.distribution === 'acc'));
  assert.deepEqual(xetras(plan('t=QQQ&d=dist').groups[0]), ['EQQQ']);
});

test('VTI is "nearest" with the S&P 500 twins; SCHD is "none"; VT has VWCE/VGWL as similar', () => {
  const vti = plan('t=VTI').groups[0];
  assert.equal(vti.kind, 'nearest');
  assert.equal(vti.indexName, 'Morningstar US Total Market');
  assert.deepEqual(xetras(vti), ['SPYL', 'SXR8', 'VUAA', 'IUSA', 'SPY5', 'VUSA']);
  assert.equal(vti.twins[0].indexName, 'S&P 500');

  const schd = plan('t=SCHD').groups[0];
  assert.equal(schd.kind, 'none');
  assert.deepEqual(schd.twins, []);

  const vt = plan('t=VT').groups[0];
  assert.equal(vt.kind, 'same');
  assert.deepEqual(xetras(vt), ['VGLA', 'VGLD']);
  assert.deepEqual(vt.similar.map((t) => t.xetra), ['VWCE', 'VGWL']);
});

test('different indexes make separate groups, in selection order', () => {
  const p = plan('t=QQQ,VOO');
  assert.deepEqual(p.groups.map((g) => g.picks), [['VOO'], ['QQQ']]);
});

test('empty tickers -> fallback S&P 500 plan', () => {
  const p = plan('');
  assert.equal(p.fallback, true);
  assert.deepEqual(p.groups[0].picks, ['VOO', 'SPY', 'IVV']);
  assert.equal(plan('t=VOO').fallback, false);
});

test('fee rows end at the horizon and use the max shown TER', () => {
  const p = plan('t=VOO&d=acc');
  assert.equal(p.fees.terPct, 0.07);
  assert.equal(p.fees.terTicker, 'VUAA');
  assert.equal(p.fees.rows.at(-1)!.year, 20);
  assert.equal(plan('t=VOO&y=7').fees.rows.at(-1)!.year, 7);
  assert.equal(p.fees.brokerName, 'Nevím');
  assert.equal(plan('t=VOO&b=fio').fees.brokerName, 'Fio banka (e-Broker)');
  assert.equal(p.dataDate, '2026-10-09');
});

test('kidCs mirrors etfs.json: SXR8 true, IUSA false, EQQB false (null)', () => {
  const by = (q: string, x: string) => plan(q).groups[0].twins.find((t) => t.xetra === x)!;
  assert.equal(by('t=VOO', 'SXR8').kidCs, true);
  assert.equal(by('t=VOO', 'IUSA').kidCs, false);
  assert.equal(by('t=QQQ', 'EQQB').kidCs, false);
});

test('twin carries the London USD ticker, ISIN and source fields from etfs.json', () => {
  const t = plan('t=VOO').groups[0].twins.find((x) => x.xetra === 'SXR8')!;
  assert.equal(t.isin, 'IE00B5BMR087');
  assert.equal(t.london, 'CSPX');
  assert.equal(t.terPct, 0.07);
  assert.equal(t.asOf, '2026-09-30');
  assert.equal(t.fundCurrency, 'USD');
});

test('no-twin plan (SCHD only) prices the ETF side with the S&P 500 twins, never a US TER', () => {
  const p = plan('t=SCHD');
  // S&P 500 UCITS set in etfs.json: max ter_pct 0.07 (VUAA, first in file order); SCHD's own ter_pct is 0.06.
  assert.equal(p.fees.terPct, 0.07);
  assert.equal(p.fees.terTicker, 'VUAA');
  assert.equal(plan('t=SCHD&d=dist').fees.terTicker, 'VUSA');
});
