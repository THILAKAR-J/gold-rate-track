// Reusable page parts: city cards and filters, weight icons, FAQ, tool art.
import { esc, inr } from './format.mjs';

export const PURITY = {
  '24K': { name: '24K · 999', pct: '99.9%', note: '99.9% pure', use: 'Coins and bars', fine: '999' },
  '22K': { name: '22K · 916', pct: '91.6%', note: '91.6% pure', use: 'Most jewellery', fine: '916' },
  '18K': { name: '18K · 750', pct: '75%', note: '75% pure', use: 'Diamond and studded pieces', fine: '750' }
};

/* ---------- Weight icons (34×34) ---------- */
const T = (x, y, s, txt) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-size="${s}" font-weight="800" fill="#5E3F06" font-family="Inter, sans-serif">${txt}</text>`;
export const WICON = {
  coin: `<circle cx="17" cy="17" r="13" fill="#F2C766" stroke="#9C6B12" stroke-width="2"/><circle cx="17" cy="17" r="8.5" fill="none" stroke="#9C6B12" stroke-opacity="0.5"/>`,
  coin8: `<circle cx="17" cy="17" r="15" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/>${T(17, 21.5, 11, '8g')}`,
  sov1: `<circle cx="17" cy="17" r="15" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/>${T(17, 21.5, 11, '1')}`,
  sov2: `<circle cx="13" cy="17" r="11" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/><circle cx="21" cy="17" r="11" fill="#F2C766" stroke="#9C6B12" stroke-width="2"/>${T(21, 21, 10, '2')}`,
  sov5: `<circle cx="11" cy="20" r="9" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/><circle cx="23" cy="20" r="9" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/><circle cx="17" cy="12" r="9" fill="#F2C766" stroke="#9C6B12" stroke-width="2"/>${T(17, 15.5, 9, '5')}`,
  bar10: `<path d="M5 25 L9 11 H25 L29 25 Z" fill="#E8B64C" stroke="#9C6B12" stroke-width="2" stroke-linejoin="round"/><path d="M11 15 H23" stroke="#9C6B12" stroke-opacity="0.5"/>`,
  tola: `<rect x="4" y="11" width="26" height="13" rx="3" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/><path d="M9 17.5 H25" stroke="#9C6B12" stroke-opacity="0.5"/>`,
  bar100: `<path d="M2 27 L7 9 H27 L32 27 Z" fill="#E8B64C" stroke="#9C6B12" stroke-width="2" stroke-linejoin="round"/><path d="M10 14 H24 M9 19 H25" stroke="#9C6B12" stroke-opacity="0.5"/>`
};
export const wcell = (ic, label, sub) =>
  `<span class="wcell"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">${WICON[ic]}</svg><span>${esc(label)}<em>${esc(sub)}</em></span></span>`;

/* ---------- Tool art (240×96) ---------- */
const TX = (x, y, s, fill, txt, extra = '') =>
  `<text x="${x}" y="${y}" ${extra} font-size="${s}" font-weight="800" fill="${fill}" font-family="Inter, sans-serif">${txt}</text>`;
export const ART = {
  receipt: `<path d="M80 14 H150 V80 L141 74 L132 80 L123 74 L114 80 L105 74 L96 80 L87 74 L80 80 Z" fill="#FFFFFF" stroke="#12161A" stroke-width="2" stroke-linejoin="round"/><path d="M91 28 H126 M91 39 H120 M91 50 H132" stroke="#9AA3AB" stroke-width="3" stroke-linecap="round"/><rect x="91" y="58" width="48" height="9" rx="3" fill="#E8B64C"/><circle cx="172" cy="60" r="18" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/>${TX(172, 67, 19, '#12161A', '₹', 'text-anchor="middle"')}`,
  scale: `<path d="M120 24 V80 M96 80 H144 M70 32 H170" stroke="#12161A" stroke-width="2.5" stroke-linecap="round"/><path d="M70 32 L57 56 M70 32 L83 56 M53 56 Q70 67 87 56 M170 32 L157 56 M170 32 L183 56 M153 56 Q170 67 187 56" fill="none" stroke="#12161A" stroke-width="2" stroke-linecap="round"/><circle cx="70" cy="50" r="9" fill="#E8B64C" stroke="#9C6B12" stroke-width="1.5"/>${TX(70, 53.5, 8, '#5E3F06', '8g', 'text-anchor="middle"')}<rect x="158" y="44" width="24" height="11" rx="2" fill="#E8B64C" stroke="#9C6B12" stroke-width="1.5"/><circle cx="120" cy="22" r="4" fill="#12161A"/>`,
  coins: `<circle cx="78" cy="62" r="16" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/><circle cx="104" cy="54" r="16" fill="#F2C766" stroke="#9C6B12" stroke-width="2"/><circle cx="130" cy="62" r="16" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/>${TX(104, 59, 13, '#5E3F06', '8g', 'text-anchor="middle"')}<rect x="150" y="30" width="44" height="52" rx="8" fill="#12161A"/><path d="M160 46 H184 M160 58 H176" stroke="#E8B64C" stroke-width="3" stroke-linecap="round"/>`,
  huid: `<rect x="62" y="18" width="108" height="60" rx="10" fill="#FFFFFF" stroke="#12161A" stroke-width="2"/><path d="M76 30 L82 36 L76 42" fill="none" stroke="#12161A" stroke-width="2"/>${TX(90, 44, 17, '#12161A', '22K916')}<text x="76" y="64" font-size="11" font-weight="600" fill="#4A5560" font-family="Inter, sans-serif">HUID · AB12C3</text><circle cx="182" cy="26" r="14" fill="#0B7A55"/><path d="M175 26 L180 31 L189 21" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  making: `<path d="M120 24 V80 M96 80 H144 M70 32 H170" stroke="#12161A" stroke-width="2.5" stroke-linecap="round"/><path d="M70 32 L57 56 M70 32 L83 56 M53 56 Q70 67 87 56 M170 32 L157 56 M170 32 L183 56 M153 56 Q170 67 187 56" fill="none" stroke="#12161A" stroke-width="2" stroke-linecap="round"/><path d="M60 56 L62 47 H78 L80 56 Z" fill="#E8B64C" stroke="#9C6B12" stroke-width="1.5" stroke-linejoin="round"/><circle cx="170" cy="47" r="10" fill="#FFFFFF" stroke="#B4400A" stroke-width="2"/>${TX(170, 51.5, 12, '#B4400A', '%', 'text-anchor="middle"')}<circle cx="120" cy="22" r="4" fill="#12161A"/>`,
  lamp: `<path d="M120 50 C111 40 117 29 120 20 C123 29 129 40 120 50 Z" fill="#F2C766" stroke="#B4400A" stroke-width="1.5"/><path d="M86 54 Q120 84 154 54 Z" fill="#E8B64C" stroke="#9C6B12" stroke-width="2" stroke-linejoin="round"/><path d="M106 76 H134" stroke="#9C6B12" stroke-width="2" stroke-linecap="round"/><circle cx="62" cy="40" r="3" fill="#E8B64C"/><circle cx="178" cy="34" r="3" fill="#E8B64C"/><circle cx="192" cy="58" r="2" fill="#9C6B12"/><circle cx="50" cy="62" r="2" fill="#9C6B12"/>`,
  bell: `<rect x="76" y="14" width="88" height="70" rx="14" fill="#161D23"/><path d="M106 60 V46 a14 14 0 0 1 28 0 V60 l4 4 H102 Z" fill="#E8B64C"/><path d="M114 68 a6 6 0 0 0 12 0" fill="none" stroke="#E8B64C" stroke-width="3"/><circle cx="160" cy="20" r="11" fill="#0B7A55"/>${TX(160, 24.5, 12, '#FFFFFF', '1', 'text-anchor="middle"')}`,
  question: `<circle cx="96" cy="48" r="26" fill="#FFFFFF" stroke="#12161A" stroke-width="2"/>${TX(96, 57, 26, '#845A0E', '?', 'text-anchor="middle"')}<circle cx="150" cy="54" r="18" fill="#E8B64C" stroke="#9C6B12" stroke-width="2"/>${TX(150, 60, 16, '#12161A', '₹', 'text-anchor="middle"')}`
};
export const art = (k) => `<svg class="art" viewBox="0 0 240 96" aria-hidden="true">${ART[k]}</svg>`;

/** A tool/guide card. With href it is a link; without, a static card. */
export function toolCard(ctx, { href, art: a, eyebrow, title, text }) {
  const inner = `${art(a)}<span class="eyebrow">${esc(eyebrow)}</span><b>${esc(title)}</b><span>${text}</span>`;
  return href ? `<a class="tool" href="${ctx.url(href)}">${inner}</a>` : `<div class="tool tool-static">${inner}</div>`;
}

/* ---------- FAQ ---------- */
export const faqHtml = (items) =>
  items
    .map(
      (f, i) =>
        `<details class="faq"${i === 0 ? ' open' : ''}><summary>${esc(f.q)}<span class="faq-ico" aria-hidden="true">+</span></summary><p class="ans">${f.a}</p></details>`
    )
    .join('\n');
export const faqLd = (items) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') }
  }))
});

/* ---------- City cards with region chips and search ---------- */
export function cityDiff(c22, nat22) {
  const d = c22 - nat22;
  return {
    text: d === 0 ? 'Same as India' : (d > 0 ? '+₹' : '−₹') + Math.abs(d) + ' vs India',
    cls: 'diff ' + (d === 0 ? 'd-same' : d > 0 ? 'd-more' : 'd-less'),
    d
  };
}

export function cityFinder(ctx, { headingId, heading, level = 2 }) {
  const nat22 = ctx.rates.national['22K'].g;
  const cards = ctx.cities
    .map((c) => {
      const r = ctx.rates.cities[c.slug];
      const df = cityDiff(r['22K'], nat22);
      return `<a class="city" href="${ctx.url(`/gold-rate/${c.slug}/`)}" data-city="${esc(c.name.toLowerCase())} ${esc(
        c.state.toLowerCase()
      )}" data-region="${c.region}"><span class="city-top"><b>${esc(c.name)}</b><span>${esc(c.state)}</span></span><span class="city-price num">${inr(
        r['22K']
      )}<small>22K</small></span><span class="city-foot"><span class="num">24K ${inr(r['24K'])}</span><span class="${df.cls}">${df.text}</span></span></a>`;
    })
    .join('\n');
  const regions = ['All', 'South', 'North', 'West', 'East']
    .map((r) => `<button type="button" class="chip-btn${r === 'All' ? ' on' : ''}" aria-pressed="${r === 'All'}" data-region-btn="${r}">${r}</button>`)
    .join('');
  const n = ctx.cities.length;
  const h = `h${level}`;
  return `<section aria-labelledby="${headingId}" class="stack" data-finder>
<div class="sec-head">
<div><${h} id="${headingId}" class="h2">${esc(heading)}</${h}><p class="sub">22K per gram, compared with the national rate. <span data-count aria-live="polite">Showing ${n} of ${n} cities.</span></p></div>
<div class="filters">
<div class="chips" role="group" aria-label="Region">${regions}</div>
<div class="field finder-q"><label class="sr" for="city-q-${headingId}">Find a city</label><input id="city-q-${headingId}" class="in" type="search" placeholder="Find a city" autocomplete="off" data-q></div>
</div>
</div>
<div class="cities">
${cards}
</div>
<p class="empty" data-empty hidden>We don't publish that city yet. We add a city only when we have a local rate source. <a href="${ctx.url(
    '/grievance-redressal/'
  )}">Ask for your city</a></p>
</section>`;
}
