// Loaded on every page from Base.astro. No website ID (local, previews) → nothing is loaded and no bar is shown.
// Consent bar (decisions §16, data/sources.md §10): top of the screen, so it never sits on the sticky CTA, and only after
// the first scroll, tap or key press, so the first screen stays the one the ad promised. Both answers look the same.
import { loadUmami, setConsent, consentChoice, hasAnalytics } from '../lib/track.ts';

loadUmami(); // a "Souhlasím" from an earlier visit

function openBar() {
  if (document.querySelector('.consent')) return;
  const bar = document.createElement('div');
  bar.className = 'consent';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Měření návštěvnosti');
  const p = document.createElement('p');
  const more = Object.assign(document.createElement('a'), { href: '/ochrana-osobnich-udaju/#mereni', textContent: 'Podrobnosti' });
  p.append('Smíme měřit, jak se stránka používá? Bez cookies a bez vašeho e-mailu. ', more);
  const answers = document.createElement('div');
  for (const [label, v] of [['Souhlasím', 'yes'], ['Nesouhlasím', 'no']] as const) {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn-quiet', textContent: label });
    b.dataset.consent = v;
    b.addEventListener('click', () => { setConsent(v); bar.remove(); });
    answers.append(b);
  }
  bar.append(p, answers);
  document.body.append(bar);
}

if (hasAnalytics()) {
  document.querySelectorAll<HTMLButtonElement>('[data-consent-open]').forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', openBar);
  });
  if (consentChoice() === null) {
    const events = ['scroll', 'pointerdown', 'keydown'];
    const show = () => { events.forEach((e) => removeEventListener(e, show)); openBar(); };
    events.forEach((e) => addEventListener(e, show, { passive: true }));
  }
}
