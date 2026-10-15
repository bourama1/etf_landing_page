// The one door to analytics (decisions §11–12, §16). Umami Cloud, cookieless, but only after consent: § 89(3) ZEK
// covers a script that makes the browser send data (data/sources.md §10). ad_variant rides on every event as data-tag.
import { isSafeProps, keepUtm } from './funnel.ts';
import type { Props } from './funnel.ts';
import { adVariant, sanitizeUtm } from './selection.ts';

type Umami = { track: (name?: string, data?: Props) => void };
type Win = { umami?: Umami };
export type Consent = 'yes' | 'no' | null;
const KEY = 'etfd-analytics'; // stores only the visitor's choice, which § 89(3) allows as necessary for honouring it

const stored = (): Consent => { try { const v = localStorage.getItem(KEY); return v === 'yes' || v === 'no' ? v : null; } catch { return null; } };

let win: Win = typeof window === 'undefined' ? {} : (window as unknown as Win);
let id: string = import.meta.env?.PUBLIC_UMAMI_WEBSITE_ID ?? '';
let dev: boolean = !!import.meta.env?.DEV;
let log = (...a: unknown[]) => console.debug(...a);
let consent: Consent = typeof window === 'undefined' ? null : stored();
let queue: [string, Props?][] = [];
let loaded = false;
let ready = false; // pageview sent: from here events go straight out
let blocked = false; // script failed to load (ad blocker, offline): stop holding events

// Test hooks: track.test.ts runs in Node without a window or an Astro env.
export function _setup(w: Win, websiteId: string, isDev: boolean, choice: Consent, logger = log) {
  win = w; id = websiteId; dev = isDev; consent = choice; log = logger; queue = []; loaded = false; ready = false; blocked = false;
}

// Script loaded: pageview first (data-auto-pageview is off; Umami funnels are ordered), then what happened before.
export function _flush() {
  if (consent !== 'yes' || !win.umami || ready) return; // ready: the pageview already went out
  win.umami.track();
  ready = true;
  const q = queue;
  queue = [];
  q.forEach(([n, p]) => win.umami!.track(n, p));
}

// Script failed to load: drop what waits and stop queueing (memory would grow for the whole visit).
export function _blocked() { blocked = true; queue = []; }

export const variant = () => adVariant(sanitizeUtm(new URLSearchParams(location.search)).utm_content);
export const hasAnalytics = () => !!id;
export const consentChoice = () => consent;

export function track(name: string, props?: Props) {
  if (!isSafeProps(props)) return;
  if (!id) { if (dev) log('[track]', name, props); return; }
  if (consent === 'no' || blocked) return;
  if (consent === 'yes' && ready) win.umami!.track(name, props);
  else queue.push([name, props]); // no choice yet, or the script is still loading: held in memory only
}

export function setConsent(v: 'yes' | 'no') {
  consent = v;
  try { localStorage.setItem(KEY, v); } catch { /* private mode: the choice lasts for this page only */ }
  if (v === 'yes') { loadUmami(); _flush(); } // the script may have loaded while consent was withdrawn
  else queue = [];
}

export function loadUmami() {
  if (!id || consent !== 'yes' || loaded || typeof document === 'undefined') return; // document: Node tests
  loaded = true;
  const s = document.createElement('script');
  s.src = 'https://cloud.umami.is/script.js';
  s.async = true; // an injected script never blocks parsing and renders nothing, so no layout shift
  s.dataset.websiteId = id;
  s.dataset.tag = variant();
  s.dataset.autoPageview = 'false';
  // Umami calls window[data-before-send] with every payload; only utm_* leave in the URL and referrer (privacy page).
  (window as unknown as Record<string, unknown>).etfdBeforeSend = (_type: string, p: { url?: string; referrer?: string }) =>
    ({ ...p, url: p.url && keepUtm(p.url), referrer: p.referrer && keepUtm(p.referrer) });
  s.dataset.beforeSend = 'etfdBeforeSend';
  s.onload = _flush;
  s.onerror = _blocked;
  document.head.append(s);
}
