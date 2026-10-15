import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, renderEmail } from './email.ts';
import { buildPlan } from './plan.ts';
import { parseSelection } from './selection.ts';
import { US_TICKERS, FX } from './data.ts';

const render = (q: string) => {
  const sel = parseSelection(new URLSearchParams(q), US_TICKERS);
  const r = renderEmail(buildPlan(sel, FX), sel, 'https://example.cz', new Date('2026-10-11T10:00:00Z'));
  // Numbers use non-breaking spaces; the assertions below are written with plain ones.
  return { subject: r.subject, html: r.html.replaceAll(' ', ' '), text: r.text.replaceAll(' ', ' ') };
};

test('esc escapes & < > " \'', () => assert.equal(esc(`<a href="x">'&`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;'));

test('subject variants (email.md)', () => {
  assert.equal(render('t=VOO').subject, 'Váš ETF plán: VOO a jeho evropská dvojčata');
  assert.equal(render('t=VOO,QQQ').subject, 'Váš ETF plán: VOO, QQQ a jejich evropská dvojčata');
  assert.equal(render('').subject, 'Váš ETF plán pro S&P 500');
});

test('html contains ISINs, year-20 row, sources, disclaimer; no raw "<script"', () => {
  const { html, text } = render('t=VOO');
  for (const s of ['IE00B5BMR087', '1 200 000 Kč', '883 000–950 000 Kč', '250 000–317 000 Kč', 'Toto není doporučení',
    'Minulá výkonnost není zárukou budoucích výnosů', 'nejde o daňové poradenství', 'iShares (BlackRock), 30. 9. 2026',
    'Data jsou k 9. 10. 2026', 'vyžádali na example.cz', '11. 10. 2026', 'Co jste v nástroji vybrali a z jaké reklamy',
    '[DOPLNIT: provozovatel, IČO, sídlo]']) assert.ok(html.includes(s), s);
  assert.ok(!html.includes('<script'));
  for (const s of ['IE00B5BMR087', '883 000–950 000 Kč', 'Odhlásit se']) assert.ok(text.includes(s), s);
  assert.ok(!/<[a-z]/i.test(text));
});

test('online plan link carries only allow-listed params', () => {
  const { html } = render('t=VOO&m=5000&evil=<script>');
  assert.match(html, /\/plan\?t=VOO&amp;m=5000&amp;y=20&amp;r=5&amp;b=unknown&amp;d=both&amp;utm_source=email/);
  assert.ok(!html.includes('evil'));
});

test('Fio note only when Fio was chosen; special groups use their own copy', () => {
  assert.ok(!render('t=VOO').html.includes('Fio kurzovou přirážku nezveřejňuje'));
  assert.ok(render('t=VOO&b=fio').html.includes('Fio kurzovou přirážku nezveřejňuje'));
  assert.ok(render('t=VTI').html.includes('Nejbližší dostupné jsou fondy na S&amp;P 500'));
  assert.ok(render('t=SCHD').html.includes('nemá evropské dvojče'));
  const vt = render('t=VT').html;
  assert.ok(vt.includes('VGLA, VGLD sledují stejný index FTSE Global All Cap') && vt.includes('18. 8. 2026') && vt.includes('VWCE, VGWL'));
});

test('computed fee paragraphs (Fio render)', () => {
  const { html } = render('t=VOO&b=fio');
  for (const s of ['3,95 EUR', '3,16 %', '1,65 %', '3–5 %', '1,75–2,59 %', 'Fio kurzovou přirážku nezveřejňuje',
    'Plán vám přišel, protože jste si ho 11. 10. 2026 vyžádali na example.cz.']) assert.ok(html.includes(s), s);
  assert.ok(!html.includes('nejvyšší z vašich dvojčat') && !html.includes('Pořadí v tabulce'));
  assert.ok(!render('t=VOO&b=xtb').html.includes('Fio kurzovou přirážku nezveřejňuje'));
});

test('TER is written with two decimals (table and fee line)', () => {
  const { html } = render('t=QQQ');
  assert.ok(html.includes('TER 0,30 % ročně'));
  assert.ok(!html.includes('0,3 %'));
});
