// Home: Gold Rate Today in India.
import { inr, sinr, sgn, esc, longDate, medDate, shortDate, dayMonth, weekday, clock, daysBetween } from '../lib/format.mjs';
import { page, crumbs } from '../lib/layout.mjs';
import { PURITY, wcell, toolCard, faqHtml, faqLd, cityFinder, art } from '../lib/parts.mjs';

export const UNITS = [
  { id: '1g', label: '1 gram', short: '1 g', g: 1 },
  { id: '8g', label: '8 grams (1 pavan)', short: 'Pavan · 8 g', g: 8 },
  { id: '10g', label: '10 grams', short: '10 g', g: 10 },
  { id: 'tola', label: '1 tola (11.66 g)', short: 'Tola', g: 11.6638 }
];

const pctChange = (g, chg) => ((chg / (g - chg)) * 100).toFixed(2) + '%';
export const chgText = (g, chg, mult = 1) =>
  (chg >= 0 ? '▲ ' : '▼ ') + inr(Math.abs(chg) * mult) + ' (' + pctChange(g, Math.abs(chg)) + ')';

/* ---------- Charts ---------- */
function rangeMeter(label, series, now) {
  const hi = Math.max(...series), lo = Math.min(...series);
  const pos = hi === lo ? 50 : ((now - lo) / (hi - lo)) * 100;
  const where = pos < 34 ? 'near the low end of' : pos > 66 ? 'near the high end of' : 'in the middle of';
  return `<div class="meter">
<div class="meter-top"><span>${label} · ${series.length}-day range</span><strong class="num">${inr(now)}</strong></div>
<div class="track" role="img" aria-label="${label} is ${inr(now)}, ${where} its ${series.length}-day range of ${inr(lo)} to ${inr(hi)}"><span class="dot" style="left: ${pos.toFixed(1)}%"></span></div>
<div class="meter-ends num"><span>Low ${inr(lo)}</span><span>High ${inr(hi)}</span></div>
</div>`;
}

function sparkline(hist) {
  const s = hist.map((h) => h['24K']);
  const hi = Math.max(...s), lo = Math.min(...s);
  const x = (i) => 2 + i * (296 / (s.length - 1));
  const y = (v) => 6 + ((hi - v) / (hi - lo || 1)) * 48;
  const line = s.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
  const iHi = s.indexOf(hi), iLo = s.indexOf(lo);
  const aria = `24K over the last ${s.length} days: high ${inr(hi)} on ${dayMonth(hist[iHi].date)}, low ${inr(lo)} on ${dayMonth(hist[iLo].date)}, now ${inr(s[s.length - 1])}`;
  return `<div style="display: flex; flex-direction: column; gap: 6px">
<svg viewBox="0 0 300 64" preserveAspectRatio="none" role="img" aria-label="${aria}" style="width: 100%; height: 64px"><path d="${line} L298 64 L2 64 Z" fill="#E8B64C" fill-opacity="0.16"/><path d="${line}" fill="none" stroke="#E8B64C" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
<div class="spark-cap"><span>24K · ${shortDate(hist[0].date)}</span><span>${shortDate(hist[hist.length - 1].date)}</span></div>
</div>`;
}

function bridgeChart(rates) {
  const h = rates.history;
  const base = h[h.length - 2]['24K'], top = h[h.length - 1]['24K'];
  const drivers = rates.drivers.map((x) => ({ ...x }));
  const sum = drivers.reduce((a, b) => a + b.v, 0);
  if (sum !== top - base) {
    console.warn(`  ! drivers add up to ${sum} but 24K moved ${top - base}; balancing the last driver`);
    drivers[drivers.length - 1].v += top - base - sum;
  }
  const steps = [
    { label: 'Yesterday', short: shortDate(h[h.length - 2].date), v: base, total: true },
    ...drivers,
    { label: 'Today', short: shortDate(h[h.length - 1].date), v: top, total: true }
  ];
  let run = base;
  const levels = [base];
  drivers.forEach((d) => levels.push((run += d.v)));
  const lo = Math.min(...levels) - 12, hi = Math.max(...levels) + 8;
  const Y = (v) => 34 + ((hi - v) / (hi - lo)) * 140;
  const n = steps.length, bw = 84, gap = (600 - n * bw) / (n - 1);
  const pc = (v, of) => ((v / of) * 100).toFixed(2) + '%';
  run = base;
  let rects = '', labels = '';
  steps.forEach((st, i) => {
    const x = 20 + i * (bw + gap);
    let y1, y2, fill, val;
    if (st.total) {
      y1 = Y(st.v) - 3; y2 = y1 + 6; fill = '#12161A'; val = inr(st.v); run = st.v;
    } else {
      const a = run, b = run + st.v;
      y1 = Y(Math.max(a, b)); y2 = Y(Math.min(a, b));
      fill = st.v >= 0 ? '#0B7A55' : '#B4400A'; val = sinr(st.v); run = b;
    }
    const hgt = Math.max(6, y2 - y1);
    const cy = Y(run).toFixed(1);
    const cx2 = i < n - 1 ? x + bw + gap : x + bw;
    rects += `<rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${bw}" height="${hgt.toFixed(1)}" rx="5" fill="${fill}"/>`;
    if (i < n - 1) rects += `<line x1="${(x + bw).toFixed(1)}" x2="${cx2.toFixed(1)}" y1="${cy}" y2="${cy}" stroke="#9AA3AB" stroke-dasharray="3 3"/>`;
    labels += `<span class="ov" style="left: ${pc(x + bw / 2, 640)}; top: ${pc(y1 - 6, 220)}; color: ${fill}">${val}</span>`;
    labels += `<span class="ov ov-x" style="left: ${pc(x + bw / 2, 640)}; top: ${pc(194, 220)}"><span class="only-lg">${esc(st.label)}</span><span class="only-sm">${esc(st.short)}</span></span>`;
  });
  const parts = drivers.map((d) => `${d.label.toLowerCase()} ${d.v >= 0 ? 'added' : 'took off'} ${inr(Math.abs(d.v))}`).join(', ');
  const aria = `24K ${top >= base ? 'rose' : 'fell'} from ${inr(base)} to ${inr(top)}: ${parts}`;
  return { html: `<figure class="plot"><svg class="bridge" viewBox="0 0 640 220" role="img" aria-label="${esc(aria)}"><line x1="20" x2="620" y1="186" y2="186" stroke="#DDE1DC"/>${rects}</svg>${labels}</figure>`, net: top - base };
}

function trendChart(hist, key) {
  const ser = hist.map((h) => h[key]);
  const n = ser.length;
  const sHi = Math.max(...ser), sLo = Math.min(...ser);
  const pad = (sHi - sLo) * 0.18 || 10;
  const cMax = sHi + pad, cMin = sLo - pad;
  const cx = (i) => 16 + i * (608 / (n - 1));
  const cy = (v) => 44 + ((cMax - v) / (cMax - cMin)) * 204;
  const px = (v) => ((v / 640) * 100).toFixed(2) + '%';
  const py = (v) => ((v / 300) * 100).toFixed(2) + '%';
  const line = ser.map((v, i) => (i ? 'L' : 'M') + cx(i).toFixed(1) + ' ' + cy(v).toFixed(1)).join(' ');
  const iHi = ser.indexOf(sHi), iLo = ser.indexOf(sLo), last = n - 1, mid = Math.floor((n - 1) / 2);
  const net = ser[last] - ser[0];
  const avg = ser.reduce((a, b) => a + b, 0) / n;
  const from = dayMonth(hist[0].date);
  const summary = `${key} per gram ranged ${inr(sLo)} to ${inr(sHi)} and is ${net < 0 ? 'down' : 'up'} ${inr(Math.abs(net))} since ${from}.`;
  const aria = `${key} gold rate per gram from ${dayMonth(hist[0].date)} to ${longDate(hist[last].date)}, ranging ${inr(sLo)} to ${inr(sHi)}, now ${inr(ser[last])}`;
  const fig = `<figure class="plot"><svg class="chart" viewBox="0 0 640 300" role="img" aria-label="${aria}">
<line x1="0" x2="640" y1="${cy(sHi).toFixed(1)}" y2="${cy(sHi).toFixed(1)}" stroke="#E2E5E0" stroke-dasharray="4 4"/>
<line x1="0" x2="640" y1="${cy(sLo).toFixed(1)}" y2="${cy(sLo).toFixed(1)}" stroke="#E2E5E0" stroke-dasharray="4 4"/>
<path d="${line} L${cx(last).toFixed(1)} 268 L${cx(0).toFixed(1)} 268 Z" fill="#E8B64C" fill-opacity="0.18"/>
<path d="${line}" fill="none" stroke="#9C6B12" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${cx(iHi).toFixed(1)}" cy="${cy(sHi).toFixed(1)}" r="5" fill="#FFFFFF" stroke="#9C6B12" stroke-width="2.5"/>
<circle cx="${cx(iLo).toFixed(1)}" cy="${cy(sLo).toFixed(1)}" r="5" fill="#FFFFFF" stroke="#9C6B12" stroke-width="2.5"/>
<circle cx="${cx(last).toFixed(1)}" cy="${cy(ser[last]).toFixed(1)}" r="7" fill="#12161A" stroke="#E8B64C" stroke-width="3"/>
<line x1="0" x2="640" y1="268" y2="268" stroke="#DDE1DC"/>
</svg>
<span class="ov ov-x ov-x0" style="left: ${px(cx(0))}; top: 91%">${shortDate(hist[0].date)}</span>
<span class="ov ov-x" style="left: ${px(cx(mid))}; top: 91%">${shortDate(hist[mid].date)}</span>
<span class="ov ov-x ov-x9" style="left: ${px(cx(last))}; top: 91%">${shortDate(hist[last].date)}</span>
<span class="ov ov-hi" style="left: ${px(cx(iHi))}; top: ${py(cy(sHi) - 10)}">High ${inr(sHi)}</span>
<span class="ov ov-lo" style="left: ${px(cx(iLo))}; top: ${py(cy(sLo) + 12)}">Low ${inr(sLo)}</span>
<span class="ov ov-end" style="left: ${px(cx(last) - 6)}; top: ${py(cy(ser[last]) - 6)}">Today ${inr(ser[last])}</span>
</figure>`;
  const stats = `<div class="stats">
<div class="stat"><span>${n}-day high</span><b class="num">${inr(sHi)}</b></div>
<div class="stat"><span>${n}-day low</span><b class="num">${inr(sLo)}</b></div>
<div class="stat"><span>Average</span><b class="num">${inr(avg)}</b></div>
<div class="stat"><span>Since ${shortDate(hist[0].date)}</span><b class="num ${net < 0 ? 'down' : 'up'}">${(net < 0 ? '−' : '+') + inr(Math.abs(net))}</b></div>
</div>`;
  return { fig, stats, summary };
}

/* ---------- Page ---------- */
export function homePage(ctx) {
  const R = ctx.rates;
  const N = R.national;
  const date = R.date;
  const hist = R.history;
  const g22 = N['22K'].g, g24 = N['24K'].g;
  const P0 = '22K';
  const p0 = N[P0];

  // Hero board
  const pills = ['24K', '22K', '18K']
    .map((k) => `<button type="button" class="pill${k === P0 ? ' on' : ''}" aria-pressed="${k === P0}" data-purity="${k}">${k}</button>`)
    .join('');
  const unitPills = UNITS.map(
    (u, i) => `<button type="button" class="pill${i === 0 ? ' on' : ''}" aria-pressed="${i === 0}" data-unit="${u.id}">${esc(u.short)}</button>`
  ).join('');
  const upDown = (c) => (c >= 0 ? 'up' : 'down');

  // Glance
  const b = R.benchmarks;
  const prem = b.board.g24 - b.ibja.g24;
  const rates3 = ['ibja', 'mcx', 'board']
    .map((k) => `<li><span class="n">${esc(b[k].label)}</span><span class="s">${esc(b[k].note)} · <time datetime="${b[k].at}">${clock(b[k].at)}</time></span><span class="v num">${inr(b[k].g24)}</span></li>`)
    .join('');

  // Festival
  const fest = R.festival;
  const days = fest ? daysBetween(date, fest.date) : -1;
  const festHtml =
    days > 0 && days <= 45
      ? `<section class="fest" aria-labelledby="fest-h">
<div class="count" aria-hidden="true"><b class="num">${days}</b><span>${days === 1 ? 'day' : 'days'}</span></div>
<div class="fest-art">
<svg width="72" height="56" viewBox="0 0 72 56" aria-hidden="true"><path d="M36 30 C29 22 33 12 36 4 C39 12 43 22 36 30 Z" fill="#F2C766" stroke="#B4400A" stroke-width="1.5"/><path d="M36 26 C33 22 34 17 36 13 C38 17 39 22 36 26 Z" fill="#B4400A" fill-opacity="0.55"/><path d="M12 32 Q36 62 60 32 Z" fill="#E8B64C" stroke="#9C6B12" stroke-width="2" stroke-linejoin="round"/><path d="M26 50 H46" stroke="#9C6B12" stroke-width="2" stroke-linecap="round"/><circle cx="6" cy="18" r="2.5" fill="#E8B64C"/><circle cx="66" cy="12" r="2.5" fill="#E8B64C"/></svg>
<div style="display: flex; flex-direction: column; gap: 4px">
<h2 id="fest-h" class="h3">${esc(fest.name)} is on ${weekday(fest.date)}, <time datetime="${fest.date}">${dayMonth(fest.date)}</time>: ${days} ${days === 1 ? 'day' : 'days'} away</h2>
<p class="sub">Set a price alert, check the hallmark and compare making charges before the festival rush.</p>
</div>
</div>
<div class="acts"><a class="btn btn-dark" href="#alerts">Set a price alert</a><a class="btn btn-line" href="${ctx.url('/gold-rate/chennai/#guide-h')}">Buying checklist</a></div>
</section>`
      : '';

  const bridge = bridgeChart(R);
  const ed = R.editorNote;
  const watch = R.watch
    .map(
      (w) =>
        `<li style="display: flex; gap: 12px; align-items: center; font-size: 15px"><span class="num watch-t">${esc(w.when)}</span><span>${esc(w.what)}</span></li>`
    )
    .join('');

  // Weights
  const W = [
    ['coin', '1 gram', 'Small coin', 1],
    ['coin8', '8 grams', '1 pavan / sovereign', 8],
    ['bar10', '10 grams', 'Small bar', 10],
    ['tola', '1 tola', '11.66 grams', 11.6638],
    ['bar100', '100 grams', 'Investment bar', 100]
  ];
  const ks = ['24K', '22K', '18K'];
  const hl = (k) => (k === P0 ? 'hl' : '');
  const wrows = W.map(
    ([ic, l, s, g]) =>
      `<tr><th scope="row">${wcell(ic, l, s)}</th>${ks.map((k) => `<td class="num ${hl(k)}" data-col="${k}">${inr(N[k].g * g)}</td>`).join('')}</tr>`
  ).join('\n');
  const purCards = ks
    .map((k) => {
      const p = PURITY[k];
      return `<div class="pur${k === P0 ? ' on' : ''}" data-pur="${k}"><div class="pur-top"><b>${p.name}</b><span class="num">${p.pct} gold</span></div><div class="pur-bar" aria-hidden="true"><i style="width: ${p.pct}"></i></div><small>${p.use}</small></div>`;
    })
    .join('');

  // Trend
  const t24 = trendChart(hist, '24K'), t22 = trendChart(hist, '22K');
  const dayRows = hist
    .map((h, i) => {
      const c24 = i ? h['24K'] - hist[i - 1]['24K'] : null;
      const c22 = i ? h['22K'] - hist[i - 1]['22K'] : null;
      const cls = (c) => (c === null ? '' : c > 0 ? 'up' : c < 0 ? 'down' : 'flat');
      const sm = (c) => (c === null ? '' : `<small class="${cls(c)}">${sgn(c)}</small>`);
      return `<tr><th scope="row"><time datetime="${h.date}">${shortDate(h.date)}</time></th><td class="num">${inr(h['24K'])}${sm(c24)}</td><td class="num">${inr(h['22K'])}${sm(c22)}</td></tr>`;
    })
    .reverse()
    .join('\n');

  // Build-up
  const duty = R.importDuty.rate;
  // Round each line first so the rows add up exactly to the total shown.
  const world = Math.round(g22 / (1 + duty)), dutyAmt = g22 - world;
  const making = Math.round(g22 * 0.12), gst = Math.round((g22 + making) * 0.03), total = g22 + making + gst;
  const w = (v) => ((v / total) * 100).toFixed(1) + '%';
  const l = (v) => ((v / total) * 100).toFixed(1) + '%';
  const row = (lab, sub, bars, val, extra = '') =>
    `<div class="build-row${extra}"><div class="lab"><b>${lab}</b><span>${sub}</span></div><div class="build-bar" aria-hidden="true">${bars}</div><span class="val num">${val}</span></div>`;
  const bar = (left, width, color) => `<i style="left: ${left}; width: ${width}; background: ${color}"></i>`;
  const build = [
    row('World gold price', 'Converted to rupees', bar('0', w(world), '#9AA3AB'), inr(world)),
    row('+ Import duty', `About ${Math.round(duty * 100)}% since ${esc(R.importDuty.since)}`, bar(l(world), w(dutyAmt), '#B4400A'), inr(dutyAmt)),
    row("= Today's 22K rate", 'What this site shows', bar('0', w(g22), '#E8B64C'), inr(g22)),
    row('+ Making charge', '12% in this example', bar(l(g22), w(making), '#9C6B12'), inr(making)),
    row('+ GST', '3% of gold and making', bar(l(g22 + making), w(gst), '#12161A'), inr(gst)),
    row('= Your bill', 'Before any old-gold exchange', bar('0', w(g22), '#E8B64C') + bar(l(g22), w(making), '#9C6B12') + bar(l(g22 + making), w(gst), '#12161A'), inr(total), ' build-total')
  ].join('\n');

  const faqs = [
    { q: 'What is the gold rate today in India?', a: `On ${longDate(date)}, 22 carat gold is ${inr(g22)} per gram and 24 carat is ${inr(g24)} per gram, before GST and making charges.` },
    { q: 'Why is the shop price higher than this rate?', a: `These rates are before 3% GST, making charges and the jeweller's margin. Use the <a href="${ctx.url('/gold-price-calculator/')}">calculator</a> to add them for your piece.` },
    { q: 'When does the rate change?', a: 'The IBJA benchmark is published around 12:05 PM and 5:05 PM on business days. On weekends and holidays we show the last published rate and say so.' },
    { q: "Why is my city's rate different?", a: 'Transport, local association rates and demand add small premiums. Each city card shows its difference from the national rate.' },
    { q: 'What is 916 gold?', a: '916 means 22 carat: 91.6% gold. It is the usual purity for jewellery.' },
    { q: 'How many grams is one pavan or one tola?', a: 'One pavan (sovereign) is 8 grams. One tola is 11.66 grams.' },
    { q: 'Is this investment advice?', a: `No. ${esc(ctx.site.name)} shows rates and explains them. We do not tell you when to buy or sell. <a href="${ctx.url('/disclaimer/')}">Read our disclaimer</a>.` }
  ];

  const main = `<main id="main">
<section class="hero" aria-labelledby="h1">
<svg class="hero-pat" aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 640"><defs><pattern id="jaali" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M24 4 L44 24 L24 44 L4 24 Z" fill="none" stroke="#E8B64C" stroke-opacity="0.07" stroke-width="1"/><circle cx="24" cy="24" r="2" fill="#E8B64C" fill-opacity="0.09"/></pattern><radialGradient id="glow" cx="30%" cy="40%" r="60%"><stop offset="0" stop-color="#E8B64C" stop-opacity="0.12"/><stop offset="1" stop-color="#E8B64C" stop-opacity="0"/></radialGradient></defs><rect width="1440" height="640" fill="url(#jaali)"/><rect width="1440" height="640" fill="url(#glow)"/></svg>
<div class="wrap hero-in">
<div class="hero-main">
${crumbs(ctx, [{ name: 'Home', path: '/' }, { name: 'Gold rate today' }])}
<h1 id="h1" class="title">Gold Rate Today in India</h1>
<p class="lead">22 carat gold is <strong class="num">${inr(g22)}</strong> per gram and 24 carat is <strong class="num">${inr(g24)}</strong> on <time datetime="${date}">${longDate(date)}</time>, ${N['22K'].chg >= 0 ? 'up' : 'down'} ${inr(Math.abs(N['22K'].chg))} and ${inr(Math.abs(N['24K'].chg))} from yesterday.</p>
<div class="board" data-board>
<div class="board-top">
<div class="pills" role="group" aria-label="Purity">${pills}</div>
<p class="stamp"><span class="live" aria-hidden="true"></span>Updated <time datetime="${R.updatedAt}">${clock(R.updatedAt)} IST</time></p>
</div>
<div style="display: flex; flex-direction: column; gap: 10px">
<p class="price-cap" data-b-cap>${P0} gold · ${PURITY[P0].note} · ${UNITS[0].label}</p>
<p class="price num" aria-live="polite" data-b-val>${inr(p0.g)}</p>
<p class="price-row"><span class="chg chg-${upDown(p0.chg)} num" data-b-chg>${chgText(p0.g, p0.chg)}</span><span data-b-since>since yesterday · ${inr(p0.g)} per gram</span></p>
</div>
<div class="pills" role="group" aria-label="Weight">${unitPills}</div>
<div class="board-foot">
<p class="note-d">Indicative rate before 3% GST and making charges.</p>
<div style="display: flex; gap: 8px; flex-wrap: wrap"><a class="btn btn-gold" href="${ctx.url('/gold-price-calculator/')}">Work out my shop price</a><a class="btn btn-dline" href="#alerts">Set an alert</a></div>
</div>
</div>
</div>
<aside class="glance" aria-labelledby="glance-h">
<h2 id="glance-h">Today at a glance</h2>
${rangeMeter('24K', hist.map((h) => h['24K']), g24)}
${rangeMeter('22K', hist.map((h) => h['22K']), g22)}
${sparkline(hist)}
<div style="display: flex; flex-direction: column; gap: 12px">
<h3 class="glance-h3">Three rates, one view · 24K per gram</h3>
<ul class="rates3">${rates3}</ul>
</div>
<p class="insight"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8B64C" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg><span>Shop boards are <strong class="num">${inr(Math.abs(prem))} (${((Math.abs(prem) / b.ibja.g24) * 100).toFixed(1)}%)</strong> ${prem >= 0 ? 'above' : 'below'} the IBJA benchmark today. <a href="${ctx.url('/disclaimer/#rates')}" class="on-dark">How we source rates</a></span></p>
</aside>
</div>
</section>

<div class="wrap main">
${festHtml}

<section aria-labelledby="why-h" class="grid-7-5">
<div class="card stack">
<div class="sec-head">
<div><h2 id="why-h" class="h2">Why gold moved today</h2><p class="sub">24K per gram, yesterday to today</p></div>
<span class="chg chg-${bridge.net >= 0 ? 'up' : 'down'}-l num" style="font-size: 16px">${sinr(bridge.net)}</span>
</div>
${bridge.html}
<div class="legend"><span><i class="sw" style="background: #0B7A55"></i>Pushed price up</span><span><i class="sw" style="background: #B4400A"></i>Pulled price down</span><span><i class="sw" style="background: #12161A"></i>Rate on the day</span><span>Zoomed in to show small moves</span></div>
</div>
<div class="card stack">
<h3 class="h3">Editor's note</h3>
<div class="editor">
<div class="avatar" aria-hidden="true">ED</div>
<div><p>${esc(ed.text)}</p><p class="by"><span class="ph">${esc(ed.by)}</span> · <time datetime="${ed.at}">${clock(ed.at)}</time></p></div>
</div>
<h3 class="h3" style="margin-top: 4px">What to watch next</h3>
<ul class="watch">${watch}</ul>
</div>
</section>

<section aria-labelledby="weights-h" class="card stack">
<div class="sec-head"><div><h2 id="weights-h" class="h2">Gold price by weight today</h2><p class="sub">Rate per gram × weight, before GST. The highlighted column follows the purity you picked above.</p></div></div>
<div class="purity">${purCards}</div>
<div class="tbl-box">
<table class="t" data-wtable>
<caption>Gold rate in India on ${longDate(date)} for common weights, in rupees</caption>
<thead><tr><th scope="col">Weight</th>${ks.map((k) => `<th scope="col" class="${hl(k)}" data-col="${k}">${k} (${PURITY[k].fine})</th>`).join('')}</tr></thead>
<tbody>
${wrows}
</tbody>
</table>
</div>
</section>

<section aria-labelledby="trend-h" class="grid-7-5">
<div class="card stack" data-trend>
<div class="sec-head">
<div><h2 id="trend-h" class="h2">Last ${hist.length} days</h2><p class="sub"><span data-series="24K">${t24.summary}</span><span data-series="22K" hidden>${t22.summary}</span></p></div>
<div class="seg" role="group" aria-label="Chart purity"><button type="button" class="on" aria-pressed="true" data-series-btn="24K">24K</button><button type="button" aria-pressed="false" data-series-btn="22K">22K</button></div>
</div>
<div data-series="24K">${t24.fig}</div>
<div data-series="22K" hidden>${t22.fig}</div>
<div data-series="24K">${t24.stats}</div>
<div data-series="22K" hidden>${t22.stats}</div>
</div>
<div class="card stack">
<h3 class="h3">Daily rate per gram</h3>
<div class="tbl-box">
<table class="t">
<caption>Gold rate in India per gram, newest first</caption>
<thead><tr><th scope="col">Date</th><th scope="col">24K</th><th scope="col">22K</th></tr></thead>
<tbody>
${dayRows}
</tbody>
</table>
</div>
<p class="hint" style="margin: 0">Changes are against the previous day's rate.</p>
</div>
</section>

${cityFinder(ctx, { headingId: 'cities-h', heading: 'Gold rate in your city' })}

<section aria-labelledby="tools-h" class="stack">
<div class="sec-head"><div><h2 id="tools-h" class="h2">Before you buy or sell</h2><p class="sub">Free tools that turn today's rate into your real number.</p></div></div>
<div class="tools">
${toolCard(ctx, { href: '/gold-price-calculator/', art: 'receipt', eyebrow: 'Calculator', title: 'What will I actually pay?', text: 'Weight, purity, making charge and GST in one bill.' })}
${toolCard(ctx, { href: '/gold-price-calculator/', art: 'scale', eyebrow: 'Converter', title: 'Pavan, tola and grams', text: '1 pavan = 8 g. 1 tola = 11.66 g. The calculator takes any unit.' })}
${toolCard(ctx, { href: '/gold-rate/chennai/#plan-h', art: 'coins', eyebrow: 'Planner', title: 'How many sovereigns can I buy?', text: 'Slide your budget and making charge to see it in coins.' })}
${toolCard(ctx, { href: '/gold-rate/chennai/#guide-h', art: 'huid', eyebrow: 'Checklist', title: 'Before you pay', text: 'Hallmark, HUID and bill checks for festival buying.' })}
</div>
</section>

<section aria-labelledby="build-h" class="card stack">
<div class="sec-head">
<div><h2 id="build-h" class="h2">From world price to your bill</h2><p class="sub">Example: 1 gram of 22K jewellery today with a 12% making charge.</p></div>
<span class="chg num" style="font-size: 16px; background: #FBF5E6; color: #845A0E">You pay about ${inr(total)}</span>
</div>
<div class="build">
${build}
</div>
<p class="hint" style="margin: 0">Simplified example. World price is today's rate less duty; jewellers' margins and rounding vary. <a href="${ctx.url('/gold-price-calculator/')}">Use the calculator for your piece</a>.</p>
</section>

<section aria-labelledby="faq-h" class="grid-5-7">
<div class="stack">
<h2 id="faq-h" class="h2">Questions people ask</h2>
<p class="sub">Short answers, checked by our editor. Updated <time datetime="${date}">${longDate(date)}</time>.</p>
<div class="help">
${art('question')}
<b style="font-size: 17px">Not sure what you'll pay?</b>
<p class="sub">Add making, wastage and GST to today's rate in under a minute.</p>
<a class="btn btn-dark" href="${ctx.url('/gold-price-calculator/')}" style="align-self: flex-start">Open the calculator</a>
</div>
</div>
<div>
${faqHtml(faqs)}
</div>
</section>

<section id="alerts" class="alert-band" aria-labelledby="alerts-h">
<div class="stack" style="gap: 8px">
<h2 id="alerts-h" class="h2">Don't check every day. We'll tell you.</h2>
<p class="sub">Get the morning rate on WhatsApp, or an alert when gold crosses your price.</p>
</div>
<form class="alert-form" aria-labelledby="alerts-h" data-form="alert" data-endpoint="${esc(ctx.site.formEndpoint)}" novalidate>
<div class="field"><label class="l" for="al-p">22K below (₹ per gram)</label><input id="al-p" name="price" class="in num" inputmode="numeric" placeholder="${inr(Math.floor((g22 - 100) / 100) * 100).slice(1)}" required></div>
<div class="field"><label class="l" for="al-n">WhatsApp number</label><input id="al-n" name="phone" class="in" type="tel" autocomplete="tel" placeholder="+91" required></div>
<label class="consent consent-d span2"><input type="checkbox" name="consent" required><span>I agree to get the daily rate and price alerts on WhatsApp. Reply STOP to unsubscribe. See our <a href="${ctx.url('/privacy-policy/')}">Privacy Policy</a>.</span></label>
<button type="submit" class="btn btn-gold span2">Set alert</button>
<p class="form-msg span2" role="status" aria-live="polite" data-msg></p>
</form>
<svg class="phone" viewBox="0 0 200 230" aria-hidden="true" style="width: 100%; height: auto"><rect x="24" y="4" width="152" height="222" rx="24" fill="#161D23" stroke="#3A434B" stroke-width="2"/><rect x="36" y="20" width="128" height="192" rx="14" fill="#F3F4F1"/><rect x="44" y="34" width="112" height="64" rx="10" fill="#FFFFFF"/><text x="52" y="52" font-size="9" font-weight="800" fill="#845A0E" font-family="Inter, sans-serif">${esc(ctx.site.name.toUpperCase())} · 9:00 AM</text><text x="52" y="70" font-size="13" font-weight="800" fill="#12161A" font-family="Inter, sans-serif">22K ${inr(g22)}/g</text><text x="52" y="86" font-size="10" font-weight="700" fill="${N['22K'].chg >= 0 ? '#0B7A55' : '#B4400A'}" font-family="Inter, sans-serif">${N['22K'].chg >= 0 ? '▲' : '▼'} ${inr(Math.abs(N['22K'].chg))} today</text><rect x="44" y="106" width="112" height="52" rx="10" fill="#FFFFFF"/><text x="52" y="124" font-size="9" font-weight="800" fill="#B4400A" font-family="Inter, sans-serif">PRICE ALERT</text><text x="52" y="142" font-size="11.5" font-weight="800" fill="#12161A" font-family="Inter, sans-serif">22K under ${inr(Math.floor((g22 - 100) / 1000) * 1000)}</text><rect x="44" y="166" width="70" height="30" rx="10" fill="#E8B64C"/><text x="79" y="185" text-anchor="middle" font-size="10" font-weight="800" fill="#16120A" font-family="Inter, sans-serif">View rate</text><circle cx="160" cy="26" r="13" fill="#E8B64C"/><path d="M154.5 30 V25.5 a5.5 5.5 0 0 1 11 0 V30 l1.5 1.5 H153 Z" fill="#16120A"/></svg>
</section>
</div>
</main>`;

  const title = `Gold Rate Today in India (${medDate(date)}): 22K and 24K per gram`;
  const description = `22K gold is ${inr(g22)} and 24K is ${inr(g24)} per gram in India today, ${longDate(date)}. City rates, ${hist.length}-day trend, price by weight and a making-charge calculator.`;
  return {
    path: '/',
    html: page(ctx, {
      path: '/',
      title,
      description,
      active: 'home',
      pageId: 'home',
      main,
      data: { rates: { '24K': N['24K'], '22K': N['22K'], '18K': N['18K'] }, units: UNITS, notes: Object.fromEntries(ks.map((k) => [k, PURITY[k].note])) },
      jsonld: [
        { '@type': 'Organization', '@id': ctx.abs('/') + '#org', name: ctx.site.name, url: ctx.abs('/'), logo: ctx.abs('/favicon.svg') },
        { '@type': 'WebSite', '@id': ctx.abs('/') + '#site', name: ctx.site.name, url: ctx.abs('/'), inLanguage: 'en-IN', publisher: { '@id': ctx.abs('/') + '#org' } },
        { '@type': 'WebPage', name: title, url: ctx.abs('/'), description, dateModified: R.updatedAt, isPartOf: { '@id': ctx.abs('/') + '#site' } },
        faqLd(faqs)
      ]
    })
  };
}
