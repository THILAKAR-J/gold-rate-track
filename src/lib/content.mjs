// Content edited in the admin panel (data/content.json) and applied at build time.
//
// data/content.json = {
//   pages: { "/gold-rate/chennai/": { title?, description?, h1?, extra?, faq?: [{q, a}], noindex? } },
//   cityBoards: { chennai: { source: "MJDTA board", entries: { "2026-11-04": { "24K": n, "22K": n, "18K": n, at? } } } }
// }
// Titles and descriptions may use tokens such as {date} or {22k}; they are filled in on every build, so a
// template written once stays correct every day.
import { inr, sinr, medDate, longDate, weekday, esc } from './format.mjs';

export const EMPTY = { pages: {}, cityBoards: {} };

/** Token values for one page. City pages get the city's own rates and unit. */
export function tokensFor(ctx, path) {
  const R = ctx.rates, N = R.national;
  const slug = (path.match(/^\/gold-rate\/([a-z-]+)\/$/) || [])[1];
  const c = slug && ctx.cityBySlug(slug);
  const r = c ? R.cities[slug] : { '24K': N['24K'].g, '22K': N['22K'].g, '18K': N['18K'].g, chg22: N['22K'].chg, chg24: N['24K'].chg };
  const sov = c && c.unit.id === 'sov';
  const ug = sov ? 8 : 10;
  return {
    date: medDate(R.date),
    date_long: longDate(R.date),
    day: weekday(R.date),
    city: c ? c.name : 'India',
    unit: c ? (sov ? c.unit.label : '10 Gram') : '10 Gram',
    '22k': inr(r['22K']), '24k': inr(r['24K']), '18k': inr(r['18K']),
    '22k_8g': inr(r['22K'] * 8), '24k_8g': inr(r['24K'] * 8),
    '22k_10g': inr(r['22K'] * 10), '24k_10g': inr(r['24K'] * 10),
    '22k_unit': inr(r['22K'] * ug), '24k_unit': inr(r['24K'] * ug),
    change: sinr(c ? r.chg22 : N['22K'].chg),
    silver_kg: inr(R.silverPerKg), silver_g: inr(R.silverPerKg / 1000)
  };
}

export const TOKEN_HELP = {
  date: 'Rate date, short (3 Nov 2026)', date_long: 'Rate date, long (3 November 2026)', day: 'Weekday',
  city: 'City name (India on national pages)', unit: 'Local unit (Sovereign, Pavan or 10 Gram)',
  '22k': '22K per gram', '24k': '24K per gram', '18k': '18K per gram',
  '22k_8g': '22K for 8 g (1 pavan)', '24k_8g': '24K for 8 g', '22k_10g': '22K for 10 g', '24k_10g': '24K for 10 g',
  '22k_unit': "22K in the city's unit", '24k_unit': "24K in the city's unit",
  change: "Today's 22K change per gram", silver_kg: 'Silver per kg', silver_g: 'Silver per gram'
};

export const fill = (s, tok) => String(s).replace(/\{([a-z0-9_]+)\}/g, (m, k) => (k in tok ? tok[k] : m));

/** Keep owner-written HTML to simple text tags; drop scripts, styles, event handlers and javascript: links. */
export function cleanHtml(html) {
  let s = String(html || '');
  s = s.replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select)[\s\S]*?(<\/\1>|$)/gi, '');
  s = s.replace(/<\/?(?!\/?(p|h2|h3|ul|ol|li|strong|b|em|i|a|br)\b)[^>]*>/gi, '');
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/href\s*=\s*("|')\s*javascript:[^"']*\1/gi, 'href="#"');
  s = s.replace(/<a\s+(?![^>]*href=)[^>]*>/gi, '<a>');
  return s.trim();
}
const cleanText = (s) => String(s || '').replace(/<[^>]+>/g, '').trim();

/** Apply city board rates typed in the admin for today's rate date. Returns the slugs that got a local rate. */
export function applyBoards(rates, cities, content) {
  const used = [];
  for (const c of cities) {
    const b = content.cityBoards?.[c.slug];
    const e = b?.entries?.[rates.date];
    if (!e || !['24K', '22K', '18K'].every((k) => e[k] > 1000)) continue;
    const earlier = Object.keys(b.entries).filter((d) => d < rates.date).sort().at(-1);
    const p = earlier ? b.entries[earlier] : null;
    const N = rates.national;
    rates.cities[c.slug] = {
      '24K': e['24K'], '22K': e['22K'], '18K': e['18K'], local: true, at: e.at || rates.updatedAt,
      chg24: p ? e['24K'] - p['24K'] : N['24K'].chg, chg22: p ? e['22K'] - p['22K'] : N['22K'].chg
    };
    if (b.source) c.source = b.source;
    used.push(c.slug);
  }
  return used;
}

/** Page shell hook: apply this page's overrides to the page options (title, description, robots, H1, FAQ, extra text). */
export function applyPage(ctx, o) {
  const ov = ctx.content?.pages?.[o.path] || {};
  const tok = tokensFor(ctx, o.path);
  const defaults = { title: o.title, description: o.description, h1: (o.main.match(/<h1 id="h1" class="h1">([\s\S]*?)<\/h1>/) || [])[1] || '', faq: faqFromLd(o.jsonld) };
  const out = { ...o, jsonld: (o.jsonld || []).map((x) => ({ ...x })) };
  if (ov.title) out.title = fill(cleanText(ov.title), tok);
  if (ov.description) out.description = fill(cleanText(ov.description), tok);
  if (ov.noindex) out.noindex = true;
  for (const x of out.jsonld) if (x['@type'] === 'WebPage') { x.name = out.title; x.description = out.description; }
  if (ov.h1) out.main = out.main.replace(/(<h1 id="h1" class="h1">)[\s\S]*?(<\/h1>)/, `$1${esc(fill(cleanText(ov.h1), tok))}$2`);
  if (Array.isArray(ov.faq) && ov.faq.length && /aria-labelledby="f-h"/.test(out.main)) {
    const items = ov.faq.filter((f) => f.q && f.a).map((f) => ({ q: fill(cleanText(f.q), tok), a: fill(cleanHtml(f.a), tok) }));
    const html = items.map((f, i) => `<details class="faq"${i === 0 ? ' open' : ''}><summary>${esc(f.q)}<span class="faq-i" aria-hidden="true">+</span></summary><p>${f.a}</p></details>`).join('\n');
    out.main = out.main.replace(/(<section class="sec" aria-labelledby="f-h">[\s\S]*?<div class="faqs">)[\s\S]*?(<\/div><\/section>)/, `$1${html}$2`);
    out.jsonld = out.jsonld.filter((x) => x['@type'] !== 'FAQPage').concat([{ '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })) }]);
  }
  if (ov.extra && cleanHtml(ov.extra)) {
    const box = `<section class="card" aria-label="About this rate"><div class="prose">${fill(cleanHtml(ov.extra), tok)}</div></section>`;
    if (/<section class="sec" aria-labelledby="f-h">/.test(out.main)) out.main = out.main.replace('<section class="sec" aria-labelledby="f-h">', box + '\n<section class="sec" aria-labelledby="f-h">');
    else if (out.main.includes('</div><aside class="rail"')) out.main = out.main.replace('</div><aside class="rail"', box + '\n</div><aside class="rail"');
    else out.main = out.main.replace('</main>', `<div class="wrap page-pad">${box}</div>\n</main>`);
  }
  ctx.adminIndex?.push({
    path: o.path, pageId: o.pageId, defaults, override: ov, tokens: tok,
    effective: { title: out.title, description: out.description, h1: ov.h1 ? fill(cleanText(ov.h1), tok) : defaults.h1, faq: faqFromLd(out.jsonld), noindex: !!out.noindex }
  });
  return out;
}

function faqFromLd(ld) {
  const f = (ld || []).find((x) => x['@type'] === 'FAQPage');
  return f ? f.mainEntity.map((q) => ({ q: q.name, a: q.acceptedAnswer.text })) : [];
}
