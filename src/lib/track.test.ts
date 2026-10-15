import { test } from 'node:test';
import assert from 'node:assert/strict';
import { track, _setup, _flush } from './track.ts';

test('no website ID: no-op, logs in dev', () => {
  const logs: unknown[][] = [];
  _setup({} as never, '', true, (...a) => logs.push(a));
  track('cta_click', { location: 'sticky' });
  assert.deepEqual(logs, [['[track]', 'cta_click', { location: 'sticky' }]]);
});

test('no website ID outside dev: silent', () => {
  const logs: unknown[][] = [];
  _setup({} as never, '', false, (...a) => logs.push(a));
  track('cta_click', { location: 'sticky' });
  assert.deepEqual(logs, []);
});

test('queued before the script loads, flushed in order after', () => {
  const sent: unknown[][] = [];
  const win: { umami?: { track: (n: string, d?: object) => void } } = {};
  _setup(win as never, 'site-id', false);
  track('interaction_start', { step: 'a', ad_variant: 'a' });
  track('step_complete', { step: 'a', tickers: 'VOO' });
  win.umami = { track: (n, d) => sent.push([n, d]) };
  _flush();
  track('interaction_complete', { tickers: 'VOO', monthly: 3000, years: 20 });
  assert.deepEqual(sent.map(([n]) => n), ['interaction_start', 'step_complete', 'interaction_complete']);
  assert.deepEqual(sent[0][1], { step: 'a', ad_variant: 'a' });
});

test('drops an event whose props contain an e-mail', () => {
  const sent: unknown[] = [];
  _setup({ umami: { track: (n: string) => sent.push(n) } } as never, 'site-id', false);
  track('form_error', { reason: 'jan@seznam.cz' });
  assert.deepEqual(sent, []);
});
