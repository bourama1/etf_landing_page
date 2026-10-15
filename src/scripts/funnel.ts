// Funnel events on the landing page (decisions §12; event table in docs/superpowers/plans/2026-10-15-phase4-tracking.md).
// Listens from outside tool.ts/forms.ts: delegated DOM events, the tool:result event, two observers.
// The server-confirmed events (form_error, lead_submitted, thank_you_view) live in forms.ts.
import { track, variant } from '../lib/track.ts';
import { once, sectionVisible, stepProps, resultProps } from '../lib/funnel.ts';
import type { Props } from '../lib/funnel.ts';
import { parseSelection } from '../lib/selection.ts';
import type { Selection } from '../lib/selection.ts';
import { US_TICKERS } from '../lib/data.ts';

const first = once();
const tool = document.querySelector<HTMLElement>('.tool');
const val = (s: string) => tool?.querySelector<HTMLInputElement>(s)?.value ?? '';
// Same read as tool.ts: the inputs themselves, so the order of the two change listeners doesn't matter.
const current = () => parseSelection(new URLSearchParams({
  t: US_TICKERS.filter((t) => tool?.querySelector(`[data-ticker="${t}"]`)?.getAttribute('aria-pressed') === 'true').join(','),
  m: val('#in-m'), y: val('#in-y'), r: val('#in-r'),
  b: val('input[name="broker"]:checked'), d: val('input[name="dividends"]:checked'),
}), US_TICKERS);

// section_view / form_view, once each. Thresholds every 10 % so a tall section is re-checked while it scrolls.
const watch = (els: NodeListOf<HTMLElement>, event: string, props: (el: HTMLElement) => Props) => {
  const obs = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!sectionVisible(e, innerHeight)) return;
    obs.unobserve(e.target);
    const p = props(e.target as HTMLElement);
    if (first(`${event}:${Object.values(p)[0]}`)) track(event, p);
  }), { threshold: Array.from({ length: 11 }, (_, i) => i / 10) });
  els.forEach((el) => obs.observe(el));
};
watch(document.querySelectorAll('[data-section]'), 'section_view', (el) => ({ section: el.dataset.section! }));
watch(document.querySelectorAll('.lead-form'), 'form_view', (el) => ({ location: el.dataset.location! }));

// form_start: first focus in the e-mail field of each form.
document.querySelectorAll<HTMLFormElement>('.lead-form').forEach((f) => f.addEventListener('focusin', (e) => {
  if ((e.target as HTMLInputElement).name !== 'email') return;
  const location = f.dataset.location!;
  // The sticky and 'Poslat plán' links focus the field before the scroll ends: form_view must still come first (ordered funnel).
  if (first(`form_view:${location}`)) track('form_view', { location });
  if (first(`form_start:${location}`)) track('form_start', { location });
}));

// cta_click: every click on a link to the form (sticky bar, a[data-cta]) or on a submit button.
document.addEventListener('click', (e) => {
  const t = e.target as Element;
  const loc = t.closest('[data-sticky] a') ? 'sticky'
    : t.closest<HTMLElement>('a[data-cta]')?.dataset.cta
    ?? (t.closest('button[type="submit"]') ? t.closest<HTMLFormElement>('.lead-form')?.dataset.location : undefined);
  if (loc) track('cta_click', { location: loc });
});

// The visitor's own actions in the tool, never the ad-B preselection. Which step an event belongs to:
const stepOf = (e: Event): 'a' | 'b' | 'c' | null => {
  const t = e.target as HTMLInputElement;
  if (e.type === 'change') return t.closest('.lead-form') ? null : t.name === 'dividends' ? 'c' : 'b';
  return t.closest('[data-ticker], [data-expand]') ? 'a' : t.closest('[data-ret]') ? 'b' : null;
};
// interaction_start in the capture phase: tool.ts renders (and fires tool:result) in its own listeners, and
// interaction_complete must see the touch and come after interaction_start (Umami funnels are ordered).
let touched = false;
const start = (e: Event) => {
  const step = stepOf(e);
  if (!step) return;
  touched = true;
  if (first('interaction_start')) track('interaction_start', { step, ad_variant: variant() });
};
// step_complete in the bubble phase: by then tool.ts has flipped the chip's aria-pressed.
const complete = (e: Event) => {
  const step = stepOf(e);
  const chip = (e.target as Element).closest<HTMLElement>('[data-ticker]');
  const done = e.type === 'change' || (!!chip && chip.dataset.ticker !== 'other' && chip.getAttribute('aria-pressed') === 'true');
  if (step && done && first(`step_complete:${step}`)) track('step_complete', stepProps(step, current()));
};
for (const type of ['click', 'change']) {
  tool?.addEventListener(type, start, { capture: true });
  tool?.addEventListener(type, complete);
}

// interaction_complete: the first result after a real interaction (ad B renders one on load, decisions §4).
window.addEventListener('tool:result', ((e: CustomEvent<Selection>) => {
  if (touched && first('interaction_complete')) track('interaction_complete', resultProps(e.detail));
}) as EventListener);
