// The one door to analytics (decisions §11–12). Umami Cloud, cookieless; ad_variant rides on every event as data-tag.
import { isSafeProps } from './funnel.ts';
import type { Props } from './funnel.ts';
import { adVariant, sanitizeUtm } from './selection.ts';

type Umami = { track: (name: string, data?: Props) => void };
type Win = { umami?: Umami };

let win: Win = typeof window === 'undefined' ? {} : (window as unknown as Win);
let id: string = import.meta.env?.PUBLIC_UMAMI_WEBSITE_ID ?? '';
let dev: boolean = !!import.meta.env?.DEV;
let log = (...a: unknown[]) => console.debug(...a);
let queue: [string, Props?][] = [];

// Test hooks: track.test.ts runs in Node without a window or an Astro env.
export function _setup(w: Win, websiteId: string, isDev: boolean, logger = log) {
  win = w; id = websiteId; dev = isDev; log = logger; queue = [];
}
export function _flush() {
  const q = queue;
  queue = [];
  q.forEach(([n, p]) => track(n, p));
}

export const variant = () => adVariant(sanitizeUtm(new URLSearchParams(location.search)).utm_content);

export function track(name: string, props?: Props) {
  if (!isSafeProps(props)) return;
  if (!id) { if (dev) log('[track]', name, props); return; }
  if (win.umami) win.umami.track(name, props);
  else queue.push([name, props]); // script still loading (async): flushed by loadUmami's onload
}

export function loadUmami() {
  if (!id) return;
  const s = document.createElement('script');
  s.src = 'https://cloud.umami.is/script.js';
  s.async = true; // an injected script never blocks parsing and renders nothing, so no layout shift
  s.dataset.websiteId = id;
  s.dataset.tag = variant();
  s.onload = _flush;
  document.head.append(s);
}
