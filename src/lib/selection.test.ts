import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSelection, toParams, validateEmail, sanitizeUtm, adVariant, RANGES } from './selection.ts';

const known = ['VOO', 'SPY', 'IVV', 'VTI', 'QQQ', 'VT', 'SCHD'];
const p = (s: string) => new URLSearchParams(s);

test('defaults when nothing is sent', () => {
  assert.deepEqual(parseSelection(p(''), known),
    { tickers: [], monthly: 3000, years: 20, returnPct: 5, broker: 'unknown', dividends: 'both' });
});
test('drops unknown tickers, uppercases, dedupes, keeps data order', () => {
  assert.deepEqual(parseSelection(p('t=qqq,VOO,<a href=x>,VOO,ABC'), known).tickers, ['VOO', 'QQQ']);
});
test('clamps and snaps numbers to slider ranges', () => {
  const s = parseSelection(p('m=999999&y=-3&r=7.3'), known);
  assert.equal(s.monthly, RANGES.monthly[1]);
  assert.equal(s.years, 1);
  assert.equal(s.returnPct, 7.5);
  assert.equal(parseSelection(p('m=abc'), known).monthly, 3000);
});
test('enums fall back to defaults', () => {
  const s = parseSelection(p('b=revolut&d=<script>'), known);
  assert.equal(s.broker, 'unknown');
  assert.equal(s.dividends, 'both');
});
test('toParams round-trips', () => {
  const s = parseSelection(p('t=VOO,QQQ&m=5000&y=10&r=6&b=fio&d=acc'), known);
  assert.deepEqual(parseSelection(toParams(s), known), s);
});
test('toParams emits keys in the fixed order t, m, y, r, b, d', () => {
  const s = parseSelection(p('t=VOO,QQQ&m=5000&y=10&r=6&b=fio&d=acc'), known);
  assert.equal(toParams(s).toString(), 't=VOO%2CQQQ&m=5000&y=10&r=6&b=fio&d=acc');
  assert.equal(toParams(parseSelection(p(''), known)).toString(), 't=&m=3000&y=20&r=5&b=unknown&d=both');
});
test('e-mail: trims and lowercases valid addresses', () => {
  assert.deepEqual(validateEmail('  Jana.Novak+etf@Seznam.CZ '), { ok: true, email: 'jana.novak+etf@seznam.cz' });
});
test('e-mail: empty, invalid, header injection, too long', () => {
  assert.deepEqual(validateEmail(''), { ok: false, reason: 'empty' });
  assert.deepEqual(validateEmail(undefined), { ok: false, reason: 'empty' });
  for (const bad of ['jana', 'jana@', 'jana@seznam', 'a b@c.cz', 'a@b.cz\r\nBcc: x@y.cz', 'a@b.c', `${'a'.repeat(250)}@b.cz`])
    assert.deepEqual(validateEmail(bad), { ok: false, reason: 'invalid' }, bad);
});
test('UTM: trimmed, control chars stripped, capped at 100, missing = ""', () => {
  const u = sanitizeUtm(p(`utm_source=%20instagram%20&utm_content=ad_a_blocked%0D%0A&utm_term=${'x'.repeat(300)}`));
  assert.equal(u.utm_source, 'instagram');
  assert.equal(u.utm_content, 'ad_a_blocked');
  assert.equal(u.utm_term.length, 100);
  assert.equal(u.utm_medium, '');
});
test('ad variant from utm_content', () => {
  assert.equal(adVariant('ad_a_blocked'), 'a');
  assert.equal(adVariant('ad_b_fees'), 'b');
  assert.equal(adVariant('AD_B_x'), 'unknown');
  assert.equal(adVariant(''), 'unknown');
});
test('ad variant needs the ad_a_ / ad_b_ prefix (decisions §7)', () => {
  assert.equal(adVariant('ad_a'), 'unknown');
  assert.equal(adVariant('ad_b'), 'unknown');
});
test('UTM: leading whitespace does not eat the 100-char budget', () => {
  assert.equal(sanitizeUtm(p(`utm_source=${' '.repeat(150)}instagram`)).utm_source, 'instagram');
});
