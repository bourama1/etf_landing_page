import { test } from 'node:test';
import assert from 'node:assert/strict';
import { track, setConsent, _setup, _flush, _blocked } from './track.ts';

type Sent = [string | undefined, object | undefined];
const fakeUmami = (sent: Sent[]) => ({ track: (n?: string, d?: object) => sent.push([n, d]) });

test('no website ID: no-op, logs in dev', () => {
  const logs: unknown[][] = [];
  _setup({} as never, '', true, null, (...a) => logs.push(a));
  track('cta_click', { location: 'sticky' });
  assert.deepEqual(logs, [['[track]', 'cta_click', { location: 'sticky' }]]);
});

test('no website ID outside dev: silent', () => {
  const logs: unknown[][] = [];
  _setup({} as never, '', false, null, (...a) => logs.push(a));
  track('cta_click', { location: 'sticky' });
  assert.deepEqual(logs, []);
});

test('before a choice nothing is sent; after consent and load: pageview first, then the queue in order', () => {
  const sent: Sent[] = [];
  const win: { umami?: ReturnType<typeof fakeUmami> } = {};
  _setup(win as never, 'site-id', false, null);
  track('section_view', { section: 'hero' });
  track('interaction_start', { step: 'a', ad_variant: 'a' });
  win.umami = fakeUmami(sent); // even if a script were there, no choice = no send
  track('step_complete', { step: 'a', tickers: 'VOO' });
  assert.deepEqual(sent, []);
  setConsent('yes');
  _flush(); // the script's onload
  track('interaction_complete', { tickers: 'VOO', monthly: 3000, years: 20 });
  assert.deepEqual(sent.map(([n]) => n), [undefined, 'section_view', 'interaction_start', 'step_complete', 'interaction_complete']);
  assert.deepEqual(sent[2][1], { step: 'a', ad_variant: 'a' });
});

test('refusal drops the queue and everything after it', () => {
  const sent: Sent[] = [];
  _setup({ umami: fakeUmami(sent) } as never, 'site-id', false, null);
  track('section_view', { section: 'hero' });
  setConsent('no');
  track('cta_click', { location: 'sticky' });
  _flush();
  assert.deepEqual(sent.filter(([n]) => n), []);
});

test('withdrawal after consent stops sending', () => {
  const sent: Sent[] = [];
  _setup({ umami: fakeUmami(sent) } as never, 'site-id', false, 'yes');
  _flush();
  track('cta_click', { location: 'sticky' });
  setConsent('no');
  track('cta_click', { location: 'inline' });
  assert.deepEqual(sent, [[undefined, undefined], ['cta_click', { location: 'sticky' }]]);
});

test('drops an event whose props contain an e-mail', () => {
  const sent: Sent[] = [];
  _setup({ umami: fakeUmami(sent) } as never, 'site-id', false, 'yes');
  _flush();
  track('form_error', { reason: 'jan@seznam.cz' });
  assert.deepEqual(sent, [[undefined, undefined]]);
});

test('withdrawn while the script loaded, then consent again: pageview and later events go out', () => {
  const sent: Sent[] = [];
  const win: { umami?: ReturnType<typeof fakeUmami> } = {};
  _setup(win as never, 'site-id', false, null);
  setConsent('yes'); // script requested
  setConsent('no'); // withdrawn before it loaded
  win.umami = fakeUmami(sent);
  _flush(); // onload while 'no': nothing
  track('section_view', { section: 'hero' }); // dropped: 'no'
  setConsent('yes');
  track('cta_click', { location: 'sticky' });
  assert.deepEqual(sent.map(([n]) => n), [undefined, 'cta_click']);
});

test('a second _flush never sends a second pageview', () => {
  const sent: Sent[] = [];
  _setup({ umami: fakeUmami(sent) } as never, 'site-id', false, 'yes');
  _flush();
  _flush();
  assert.deepEqual(sent.map(([n]) => n), [undefined]);
});

test('script blocked (onerror): queue dropped, nothing queued afterwards', () => {
  const sent: Sent[] = [];
  const win: { umami?: ReturnType<typeof fakeUmami> } = {};
  _setup(win as never, 'site-id', false, 'yes');
  track('section_view', { section: 'hero' });
  _blocked();
  for (let i = 0; i < 500; i++) track('cta_click', { location: 'sticky' });
  win.umami = fakeUmami(sent); // never happens after onerror; proves the queue is empty
  _flush();
  assert.deepEqual(sent.map(([n]) => n), [undefined]);
});
