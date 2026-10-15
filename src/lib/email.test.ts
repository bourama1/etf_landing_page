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
  for (const s of ['IE00B5BMR087', '883 000–950 000 Kč', 'odkaz pro odhlášení']) assert.ok(text.includes(s), s);
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

test('unsubscribe is a marked placeholder in html and text', () => {
  const { html, text } = render('t=VOO');
  for (const s of [html, text]) {
    assert.ok(s.includes('[DOPLNIT: odkaz pro odhlášení]'));
    assert.ok(!s.includes('[Odhlásit se]'));
  }
});

test('broker names are in the genitive, ETF line has no colon (email.md)', () => {
  const cs = render('t=VOO&b=cs').html;
  assert.ok(cs.includes('nakupujete u České spořitelny.'));
  assert.ok(cs.includes('poplatek za obchod a směna měny u České spořitelny (ceník k '));
  const fio = render('t=VOO&b=fio').html;
  assert.ok(fio.includes('nakupujete u Fio.') && fio.includes('směna měny u Fio (ceník k '));
  assert.ok(render('t=VOO&b=t212').html.includes('nakupujete u Trading 212.'));
  assert.ok(render('t=VOO').html.includes('nakupujete u „nevím“.'));
  assert.ok(!fio.includes('směna měny:  u') && !fio.includes('směna měny: u'));
});

test('table rows start with a row header, so every data cell has a header (axe td-has-header)', () => {
  const { html } = render('t=VOO');
  const tables = html.match(/<table style="border-collapse:collapse;width:100%">.*?<\/table>/g)!; // data tables, not the layout ones
  assert.equal(tables.length, 3);
  const bodyRows = tables.flatMap((t) => t.match(/<tr><t[dh][^>]*>/g)!.slice(1));
  assert.ok(bodyRows.length > 5, `${bodyRows.length} body rows`);
  for (const r of bodyRows) assert.ok(r.startsWith('<tr><th scope="row"'), r);
});
