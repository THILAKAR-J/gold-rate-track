// Reusable page parts for the v2 design.
import { esc, inr, sinr, sgn, shortDate, dayMonth, longDate } from './format.mjs';
import { icon } from './layout.mjs';

export const PURITY = {
  '24K': { carat: '24 carat', mark: '999', pct: '99.9%', note: '999 pure', use: 'Coins and bars', path: '/24-carat-gold-rate/' },
  '22K': { carat: '22 carat', mark: '916', pct: '91.6%', note: '916 jewellery', use: 'Most jewellery', path: '/22-carat-gold-rate/' },
  '18K': { carat: '18 carat', mark: '750', pct: '75%', note: '750', use: 'Diamond and studded jewellery', path: '/18-carat-gold-rate/' }
};
export const TOLA = 11.6638;
export const pctOf = (g, chg) => ((Math.abs(chg) / (g - chg)) * 100).toFixed(2) + '%';
export const arrow = (c) => (c >= 0 ? '▲' : '▼');
export const chgCls = (c, dark = true) => (dark ? (c >= 0 ? 'chg chg-up' : 'chg chg-down') : c >= 0 ? 'chg chg-up-l' : 'chg chg-down-l');

/* ---------- Rate tiles (hero) ---------- */
export function tiles(list) {
  return `<div class="tiles">${list
    .map(
      (t) => `<div class="tile${t.main ? ' main' : ''}">
<div class="tile-top"><span class="tile-k">${t.k} <span>· ${t.sub}</span></span>${t.chg ? `<span class="${t.chgCls} num">${t.chg}</span>` : ''}</div>
<p class="tile-p num">${t.price}${t.small ? `<small>${t.small}</small>` : ''}</p>
<dl class="tile-rows num">${t.rows.map(([dt, dd]) => `<dt>${dt}</dt><dd>${dd}</dd>`).join('')}</dl>
</div>`
    )
    .join('\n')}</div>`;
}

/* ---------- Card wrapper ---------- */
export const card = (id, heading, sub, body, extraHead = '') =>
  `<section class="card" aria-labelledby="${id}">
<div class="card-head"><div><h2 id="${id}" class="h2">${heading}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${extraHead}</div>
${body}
</section>`;

/** Weight table: rows of [label, sublabel, grams]; columns are purities, `hl` one is highlighted. */
export function weightTable({ rates, rows, caption, keys = ['22K', '24K', '18K'], hl = '22K', hideSm = ['18K'], unitWord = 'Weight', labels }) {
  const head = keys
    .map((k) => `<th scope="col" class="${[k === hl ? 'hl' : '', hideSm.includes(k) ? 'hide-sm' : ''].join(' ').trim()}">${labels ? labels[k] : k}</th>`)
    .join('');
  const body = rows
    .map(
      ([l, s, g]) =>
        `<tr><th scope="row">${l}${s ? `<small>${s}</small>` : ''}</th>${keys
          .map((k) => `<td class="num ${k === hl ? 'hl' : ''} ${hideSm.includes(k) ? 'hide-sm' : ''}">${inr(rates[k] * g)}</td>`)
          .join('')}</tr>`
    )
    .join('\n');
  return `<div class="tbl"><table class="t"><caption>${caption}</caption><thead><tr><th scope="col">${unitWord}</th>${head}</tr></thead><tbody>
${body}
</tbody></table></div>`;
}

/* ---------- City table with region chips and search ---------- */
export function cityDiff(c22, nat22) {
  const d = c22 - nat22;
  return { text: d === 0 ? 'Same' : (d > 0 ? '+₹' : '−₹') + Math.abs(d), cls: 'pill-d ' + (d === 0 ? 'd-same' : d > 0 ? 'd-more' : 'd-less'), d };
}
export const localUnit = (c) => (c.unit.id === 'sov' ? { label: `1 ${c.unit.label.toLowerCase()}`, g: 8 } : { label: '10 g', g: 10 });

export function cityTable(ctx, { id = 'c-h', heading, sub, cities, finder = true, more = true, hlCol = 'per gram' }) {
  const nat22 = ctx.rates.national['22K'].g;
  const rows = cities
    .map((c) => {
      const r = ctx.rates.cities[c.slug];
      const df = cityDiff(r['22K'], nat22);
      const lu = localUnit(c);
      return `<tr data-city="${esc((c.name + ' ' + c.state).toLowerCase())}" data-region="${c.region}"><th scope="row"><a href="${ctx.url(`/gold-rate/${c.slug}/`)}">${esc(c.name)}</a><small>${esc(c.state)}</small></th><td class="hl num">${inr(r['22K'])}</td><td class="num">${inr(r['24K'])}</td><td class="num hide-sm">${lu.label} ${inr(r['22K'] * lu.g)}</td><td class="hide-sm"><span class="${df.cls}">${df.text}</span></td></tr>`;
    })
    .join('\n');
  const chips = ['All', 'South', 'North', 'West', 'East']
    .map((r) => `<button type="button" class="chip${r === 'All' ? ' on' : ''}" aria-pressed="${r === 'All'}" data-region-btn="${r}">${r}</button>`)
    .join('');
  const n = cities.length;
  const filters = finder
    ? `<div class="filters"><div class="chips" role="group" aria-label="Region">${chips}</div><label class="sr" for="q-${id}">Find a city</label><input id="q-${id}" class="in" type="search" placeholder="Find your city" autocomplete="off" data-q></div>`
    : '';
  return `<section class="card" aria-labelledby="${id}"${finder ? ' data-finder' : ''}>
<div class="card-head"><div><h2 id="${id}" class="h2">${heading}</h2><p class="sub">${sub}${finder ? ` <span data-count aria-live="polite">Showing ${n} of ${n} cities.</span>` : ''}</p></div></div>
${filters}
<div class="tbl"><table class="t"><caption class="sr">${esc(heading)}, ${longDate(ctx.rates.date)}</caption>
<thead><tr><th scope="col">City</th><th scope="col" class="hl">22K ${hlCol}</th><th scope="col">24K ${hlCol}</th><th scope="col" class="hide-sm">Local unit, 22K</th><th scope="col" class="hide-sm">vs India</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
${finder ? `<p class="hint" data-empty hidden>We don't publish that city yet. We add a city only when we have its own local rate.</p>` : ''}
${more ? `<a class="more" href="${ctx.url('/gold-rate/')}">All cities →</a>` : ''}
</section>`;
}

/* ---------- 10-day chart ---------- */
export function trendChart(points, { label, unitWord = 'per gram', endWord = 'Today' }) {
  // points: [{date, v}]
  const s = points.map((p) => p.v);
  const n = s.length;
  const hi = Math.max(...s), lo = Math.min(...s);
  const pad = (hi - lo) * 0.18 || 10;
  const M = hi + pad, m = lo - pad;
  const cx = (i) => 16 + i * (608 / (n - 1));
  const cy = (v) => 40 + ((M - v) / (M - m)) * 180;
  const px = (v) => ((v / 640) * 100).toFixed(2) + '%';
  const py = (v) => ((v / 270) * 100).toFixed(1) + '%';
  const line = s.map((v, i) => (i ? 'L' : 'M') + cx(i).toFixed(1) + ' ' + cy(v).toFixed(1)).join(' ');
  const iHi = s.indexOf(hi), iLo = s.indexOf(lo), last = n - 1, mid = Math.floor(last / 2);
  const aria = `${label} ${unitWord} from ${dayMonth(points[0].date)} to ${longDate(points[last].date)}, ranging ${inr(lo)} to ${inr(hi)}, now ${inr(s[last])}`;
  return `<figure class="plot"><svg class="chart" viewBox="0 0 640 270" role="img" aria-label="${esc(aria)}">
<line x1="0" x2="640" y1="${cy(hi).toFixed(1)}" y2="${cy(hi).toFixed(1)}" stroke="#E2E5E0" stroke-dasharray="4 4"/>
<line x1="0" x2="640" y1="${cy(lo).toFixed(1)}" y2="${cy(lo).toFixed(1)}" stroke="#E2E5E0" stroke-dasharray="4 4"/>
<path d="${line} L${cx(last).toFixed(1)} 232 L${cx(0).toFixed(1)} 232 Z" fill="#E8B64C" fill-opacity="0.18"/>
<path d="${line}" fill="none" stroke="#9C6B12" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${cx(iHi).toFixed(1)}" cy="${cy(hi).toFixed(1)}" r="5" fill="#FFFFFF" stroke="#9C6B12" stroke-width="2.5"/>
<circle cx="${cx(iLo).toFixed(1)}" cy="${cy(lo).toFixed(1)}" r="5" fill="#FFFFFF" stroke="#9C6B12" stroke-width="2.5"/>
<circle cx="${cx(last).toFixed(1)}" cy="${cy(s[last]).toFixed(1)}" r="7" fill="#12161A" stroke="#E8B64C" stroke-width="3"/>
<line x1="0" x2="640" y1="232" y2="232" stroke="#DDE1DC"/>
</svg>
<span class="ov ov-x ov-x0" style="left: ${px(cx(0))}; top: 89%">${shortDate(points[0].date)}</span>
${mid > 0 && mid < last ? `<span class="ov ov-x" style="left: ${px(cx(mid))}; top: 89%">${shortDate(points[mid].date)}</span>` : ''}
<span class="ov ov-x ov-x9" style="left: ${px(cx(last))}; top: 89%">${shortDate(points[last].date)}</span>
<span class="ov" style="left: ${px(cx(iHi))}; top: ${py(cy(hi) - 10)}">High ${inr(hi)}</span>
<span class="ov ov-x" style="left: ${px(cx(iLo))}; top: ${py(cy(lo) + 12)}">Low ${inr(lo)}</span>
<span class="ov ov-end" style="left: ${px(cx(last) - 6)}; top: ${py(cy(s[last]) - 6)}">${endWord} ${inr(s[last])}</span>
</figure>`;
}

export function trendStats(points, words = {}) {
  const s = points.map((p) => p.v);
  const hi = Math.max(...s), lo = Math.min(...s), avg = s.reduce((a, b) => a + b, 0) / s.length, net = s.at(-1) - s[0];
  return `<div class="stats">
<div class="stat"><span>${words.high || `${s.length}-day high`}</span><b class="num">${inr(hi)}</b></div>
<div class="stat"><span>${words.low || `${s.length}-day low`}</span><b class="num">${inr(lo)}</b></div>
<div class="stat"><span>${words.avg || 'Average'}</span><b class="num">${inr(avg)}</b></div>
<div class="stat"><span>${words.since || `Since ${shortDate(points[0].date)}`}</span><b class="num ${net < 0 ? 'down' : 'up'}">${(net < 0 ? '−' : '+') + inr(Math.abs(net))}</b></div>
</div>`;
}

/** Daily table, newest first. cols: [{head, key(date row -> value), hl}] */
export function dailyTable(rows, cols, { caption, limit = rows.length, dateFmt = (d) => shortDate(d), dateHead = 'Date' }) {
  const body = rows
    .map((r, i) => {
      const tds = cols
        .map((c) => {
          const v = c.v(r), prev = i ? c.v(rows[i - 1]) : null, ch = prev === null ? null : v - prev;
          const cls = ch === null ? '' : ch > 0 ? 'up' : ch < 0 ? 'down' : 'flat';
          return `<td class="num${c.hl ? ' hl' : ''}">${inr(v)}${ch === null ? '' : `<small class="${cls}">${sgn(ch)}</small>`}</td>`;
        })
        .join('');
      return `<tr><th scope="row"><time datetime="${r.date}">${dateFmt(r.date)}</time></th>${tds}</tr>`;
    })
    .reverse()
    .slice(0, limit)
    .join('\n');
  return `<div class="tbl"><table class="t"><caption>${caption}</caption><thead><tr><th scope="col">${dateHead}</th>${cols
    .map((c) => `<th scope="col"${c.hl ? ' class="hl"' : ''}>${c.head}</th>`)
    .join('')}</tr></thead><tbody>
${body}
</tbody></table></div>`;
}

/* ---------- FAQ ---------- */
export const faqHtml = (items) =>
  items
    .map(
      (f, i) =>
        `<details class="faq"${i === 0 ? ' open' : ''}><summary>${esc(f.q)}<span class="faq-i" aria-hidden="true">+</span></summary><p>${f.a}</p></details>`
    )
    .join('\n');
export const faqLd = (items) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } }))
});
export const faqCard = (id, heading, items) => `<section class="card" aria-labelledby="${id}"><h2 id="${id}" class="h2">${heading}</h2><div>${faqHtml(items)}</div></section>`;

/* ---------- Quick links to the other rate pages ---------- */
export function quickLinks(ctx, exclude = '') {
  const N = ctx.rates.national;
  const L = [
    ['/22-carat-gold-rate/', '22 carat gold rate', inr(N['22K'].g) + ' / g'],
    ['/24-carat-gold-rate/', '24 carat gold rate', inr(N['24K'].g) + ' / g'],
    ['/18-carat-gold-rate/', '18 carat gold rate', inr(N['18K'].g) + ' / g'],
    ['/silver-rate-today/', 'Silver rate today', inr(ctx.rates.silverPerKg) + ' / kg'],
    ['/1-pavan-gold-rate/', '1 pavan gold rate', inr(N['22K'].g * 8)],
    ['/10-gram-gold-rate/', '10 gram gold rate', inr(N['22K'].g * 10)],
    ['/1-tola-gold-rate/', '1 tola gold rate', inr(N['22K'].g * TOLA)],
    ['/ibja-gold-rate/', 'IBJA gold rate', inr(ctx.rates.benchmarks.ibja.g24) + ' / g']
  ].filter((x) => x[0] !== exclude);
  return `<section class="card" aria-labelledby="q-h"><h2 id="q-h" class="h2">Check other rates</h2><div class="qlinks">${L.slice(0, 8)
    .map(([p, t, v]) => `<a class="ql" href="${ctx.url(p)}"><b>${t}</b><span class="num">${v}</span></a>`)
    .join('')}</div></section>`;
}

/* ---------- Right rail ---------- */
export function railCity(ctx) {
  return railLinks('Gold rate in your city', ctx.cities.map((c) => [ctx.url(`/gold-rate/${c.slug}/`), `Gold rate in ${esc(c.name)}`, inr(ctx.rates.cities[c.slug]['22K'])]));
}
export function railLinks(heading, links) {
  return `<div class="box"><h2>${heading}</h2><ul class="links">${links
    .map(([href, t, v, lang]) => `<li><a href="${href}"${lang ? ` lang="${lang}" hreflang="${lang}"` : ''}>${t}<span class="num">${v}</span></a></li>`)
    .join('')}</ul></div>`;
}
export const railInstall = () => ''; // home-screen card: off for now

export function popularLinks(ctx) {
  const N = ctx.rates.national, C = ctx.rates.cities;
  return railLinks('Popular searches', [
    [ctx.url('/gold-rate/chennai/'), 'Gold rate in Chennai', inr(C.chennai['22K'])],
    [ctx.url('/gold-rate/kerala/'), 'Gold rate in Kerala', inr(C.kerala['22K'])],
    [ctx.url('/gold-rate/hyderabad/'), 'Gold rate in Hyderabad', inr(C.hyderabad['22K'])],
    [ctx.url('/gold-rate/bengaluru/'), 'Gold rate in Bengaluru', inr(C.bengaluru['22K'])],
    [ctx.url('/1-pavan-gold-rate/'), '1 pavan gold rate today', inr(N['22K'].g * 8)],
    [ctx.url('/18-carat-gold-rate/'), '18 carat gold rate today', inr(N['18K'].g)]
  ]);
}

/* ---------- Your-city bar (filled in by app.js from this device's saved city) ---------- */
export const myCityBar = () => ''; // saved-city bar: off for now

/* ---------- Stamp line under the tiles ---------- */
let stampExtra = '';
// On weekends and holidays every rate stamp also says which day's IBJA rate is shown.
export const setStampExtra = (s) => { stampExtra = s || ''; };
export const stamp = (parts, sample) =>
  `<p class="stamp">${[...parts, ...(stampExtra ? [stampExtra] : [])].map((p) => `<span>${p}</span>`).join('')}${sample ? `<span class="tag">${sample}</span>` : ''}</p>`;
export const live = '<span class="live" aria-hidden="true"></span>';

export { sinr };

/* ---------- Page frames ---------- */
export const hero = ({ crumbsHtml, h1, answer, tilesHtml = '', stampHtml = '' }) =>
  `<section class="hero" aria-labelledby="h1"><div class="wrap">
${crumbsHtml}
<h1 id="h1" class="h1">${h1}</h1>
<p class="answer">${answer}</p>
${tilesHtml}
${stampHtml}
</div></section>`;

export const twoCol = (col, rail, railLabel = 'More rates') =>
  `<div class="wrap layout"><div class="col">
${col}
</div><aside class="rail" aria-label="${railLabel}">
${rail}
</aside></div>`;
