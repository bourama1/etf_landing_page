import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtPct, fmtCzk, fmtDate } from './data.ts';

test('Czech formatters use comma and non-breaking spaces', () => {
  assert.equal(fmtPct(0.07), '0,07 %');
  assert.equal(fmtCzk(22000), '22 000 Kč');
  assert.equal(fmtDate('2026-09-30'), '30. 9. 2026');
});
