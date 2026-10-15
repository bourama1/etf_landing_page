import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once, sectionVisible, stepProps, resultProps, isSafeProps } from './funnel.ts';
import type { Selection } from './selection.ts';

const sel: Selection = { tickers: ['VOO', 'QQQ'], monthly: 3000, years: 20, returnPct: 5, broker: 'xtb', dividends: 'acc' };
const box = (visible: number, height: number) => ({ intersectionRect: { height: visible }, boundingClientRect: { height } });

test('once: true only the first time per key', () => {
  const seen = once();
  assert.equal(seen('a'), true);
  assert.equal(seen('a'), false);
  assert.equal(seen('b'), true);
});

test('sectionVisible: half of a short section', () => {
  assert.equal(sectionVisible(box(199, 400), 844), false);
  assert.equal(sectionVisible(box(200, 400), 844), true);
});

test('sectionVisible: a section 3x the viewport counts once it fills half the screen', () => {
  assert.equal(sectionVisible(box(421, 2532), 844), false);
  assert.equal(sectionVisible(box(422, 2532), 844), true);
});

test('sectionVisible: zero-height section never counts', () => {
  assert.equal(sectionVisible(box(0, 0), 844), false);
});

test('stepProps: only the fields of that step', () => {
  assert.deepEqual(stepProps('a', sel), { step: 'a', tickers: 'VOO,QQQ' });
  assert.deepEqual(stepProps('b', sel), { step: 'b', monthly: 3000, years: 20, broker: 'xtb' });
  assert.deepEqual(stepProps('c', sel), { step: 'c', dividends: 'acc' });
});

test('resultProps: tickers, amount, horizon', () => {
  assert.deepEqual(resultProps(sel), { tickers: 'VOO,QQQ', monthly: 3000, years: 20 });
});

test('isSafeProps: rejects anything that looks like an e-mail', () => {
  assert.equal(isSafeProps(undefined), true);
  assert.equal(isSafeProps({ location: 'inline' }), true);
  assert.equal(isSafeProps({ x: 'jan@seznam.cz' }), false);
  assert.equal(isSafeProps({ x: 'a@b' }), false);
});
