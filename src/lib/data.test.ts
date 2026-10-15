import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtPct, fmtCzk, fmtDate, fmtPctRange, fmtCzkRange } from './data.ts';

const S = ' '; // non-breaking space, as Intl cs-CZ and fmtPct emit

test('Czech formatters use comma and non-breaking spaces', () => {
  assert.equal(fmtPct(0.07), `0,07${S}%`);
  assert.equal(fmtCzk(22000), `22${S}000${S}Kč`);
  assert.equal(fmtDate('2026-09-30'), '30. 9. 2026');
});

test('ranges use an en dash and collapse when equal', () => {
  assert.equal(fmtPctRange([0.07, 0.03, 0.07]), `0,03–0,07${S}%`);
  assert.equal(fmtPctRange([0.3, 0.3]), `0,3${S}%`);
  assert.equal(fmtCzkRange(272000, 339000), `272${S}000–339${S}000${S}Kč`);
});
