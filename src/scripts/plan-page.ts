// /plan: the same Block list as the plan e-mail, rendered to DOM from allow-listed URL params (no lookup, no innerHTML).
import { US_TICKERS, FX } from '../lib/data.ts';
import { blocks } from '../lib/email.ts';
import type { Block } from '../lib/email.ts';
import { buildPlan } from '../lib/plan.ts';
import { parseSelection } from '../lib/selection.ts';

const LINK = /\[([^\]]+)\]\((https?:[^)\s]+)\)/g;

// Inline markup **bold** and [label](url), same grammar as the e-mail's inline(); only text nodes, so nothing is parsed as HTML.
function inline(parent: Node, s: string) {
  for (const part of s.split(/(\*\*.+?\*\*)/g)) {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const b = document.createElement('strong');
      links(b, part.slice(2, -2));
      parent.append(b);
    } else links(parent, part);
  }
}
function links(parent: Node, s: string) {
  let last = 0;
  for (const m of s.matchAll(LINK)) {
    parent.append(s.slice(last, m.index));
    const a = document.createElement('a');
    a.href = m[2];
    a.textContent = m[1];
    parent.append(a);
    last = m.index + m[0].length;
  }
  parent.append(s.slice(last));
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const e = document.createElement(tag);
  if (text) inline(e, text);
  return e;
}

function render(b: Block): Node | null {
  switch (b.k) {
    case 'h': return el('h2', b.s);
    case 'h3': return el('h3', b.s);
    case 'p': return el('p', b.s);
    case 'hr': return el('hr');
    case 'cta': return null;
    case 'list': {
      const ul = el(b.mark === '1' ? 'ol' : 'ul');
      if (b.mark === '☐') ul.className = 'facts';
      for (const i of b.items) {
        const li = el('li');
        if (b.mark === '☐') li.append('☐ ');
        inline(li, i);
        ul.append(li);
      }
      return ul;
    }
    case 'table': {
      const t = el('table'), head = t.createTHead().insertRow();
      for (const h of b.head) {
        const th = el('th', h);
        th.scope = 'col';
        head.append(th);
      }
      const body = t.createTBody();
      for (const r of b.rows) {
        const tr = body.insertRow();
        for (const c of r) inline(tr.insertCell(), c);
      }
      const wrap = el('div');
      wrap.className = 'table-wrap';
      wrap.append(t);
      return wrap;
    }
  }
}

const root = document.querySelector('[data-plan]');
if (root) {
  const sel = parseSelection(new URLSearchParams(location.search), US_TICKERS);
  const plan = buildPlan(sel, FX);
  root.replaceChildren(...blocks(plan, sel, location.origin, new Date()).filter((b) => !b.mail).flatMap((b) => render(b) ?? []));
}
