// Keyword pages for carats, silver, IBJA and units.
import { inr, esc, longDate, medDate, shortDate, clock, sinr } from '../lib/format.mjs';
import { page, crumbs, breadcrumbLd, adSlot } from '../lib/layout.mjs';
import {
  PURITY, TOLA, pctOf, arrow, chgCls, tiles, card, trendChart, trendStats, dailyTable, faqCard, faqLd,
  quickLinks, railLinks, popularLinks, railInstall, myCityBar, stamp, live, hero, twoCol, localUnit
} from '../lib/parts.mjs';

const sampleTag = (ctx) => (ctx.rates.sample ? 'Sample rates' : '');

/* ---------- Carat pages: 22K, 24K, 18K ---------- */
export function caratPage(ctx, k) {
  const R = ctx.rates, N = R.national, P = PURITY[k], date = R.date;
  const g = N[k].g, c = N[k].chg, y = g - c;
  const path = P.path;
  const hasHist = R.history[0][k] !== undefined;

  const t = tiles([
    { main: true, k, sub: '1 gram', chg: `${arrow(c)} ₹${Math.abs(c)} · ${pctOf(g, c)}`, chgCls: chgCls(c), price: inr(g), rows: [['Yesterday', inr(y)], ['Hallmark', P.mark]] },
    { k, sub: '8 grams', chg: `${arrow(c)} ₹${Math.abs(c * 8)}`, chgCls: chgCls(c), price: inr(g * 8), rows: [['Yesterday', inr(y * 8)], ['Same as', '1 pavan']] },
    { k, sub: '10 grams', chg: `${arrow(c)} ₹${Math.abs(c * 10)}`, chgCls: chgCls(c), price: inr(g * 10), rows: [['Yesterday', inr(y * 10)], ['1 tola', inr(g * TOLA)]] }
  ]);

  const W = [['1 gram', '', 1], ['2 grams', '', 2], ['4 grams', '', 4], ['8 grams', '1 pavan / sovereign', 8], ['10 grams', '', 10], ['1 tola', '11.66 grams', TOLA], ['100 grams', '', 100]];
  const wrows = W.map(([l, s, w]) => `<tr><th scope="row">${l}${s ? `<small>${s}</small>` : ''}</th><td class="hl num">${inr(g * w)}</td><td class="num">${inr(y * w)}</td><td class="num ${c >= 0 ? 'up' : 'down'}">${sinr(c * w)}</td></tr>`).join('\n');
  const weights = card('w-h', `${P.carat} gold price by weight`, `Today's ${k} rate per gram × weight, before GST.`,
    `<div class="tbl"><table class="t"><caption>${P.carat} gold rate in India on ${longDate(date)}, in rupees</caption><thead><tr><th scope="col">Weight</th><th scope="col" class="hl">Today</th><th scope="col">Yesterday</th><th scope="col">Change</th></tr></thead><tbody>
${wrows}
</tbody></table></div>`);

  const crow = ctx.cities.map((ci) => {
    const r = R.cities[ci.slug], lu = localUnit(ci);
    return `<tr><th scope="row"><a href="${ctx.url(`/gold-rate/${ci.slug}/`)}">${esc(ci.name)}</a><small>${esc(ci.state)}</small></th><td class="hl num">${inr(r[k])}</td><td class="num">${lu.label} ${inr(r[k] * lu.g)}</td></tr>`;
  }).join('\n');
  const cities = card('c-h', `${P.carat} gold rate in cities today`, "Per gram and in each city's usual unit.",
    `<div class="tbl"><table class="t"><caption class="sr">${P.carat} gold rate in Indian cities on ${longDate(date)}</caption><thead><tr><th scope="col">City</th><th scope="col" class="hl">1 gram</th><th scope="col">Local unit</th></tr></thead><tbody>
${crow}
</tbody></table></div>
<a class="more" href="${ctx.url('/gold-rate/')}">All cities →</a>`);

  const cmp = card('k-h', '22 carat vs 24 carat vs 18 carat', 'The higher the carat, the more gold in every gram.',
    `<div class="tbl"><table class="t"><caption class="sr">Gold purities compared on ${longDate(date)}</caption><thead><tr><th scope="col">Carat</th><th scope="col">Hallmark</th><th scope="col">Gold content</th><th scope="col" class="hl">Rate / gram</th><th scope="col" class="hide-sm">Used for</th></tr></thead><tbody>
${['24K', '22K', '18K'].map((x) => `<tr><th scope="row">${x === k ? PURITY[x].carat : `<a href="${ctx.url(PURITY[x].path)}">${PURITY[x].carat}</a>`}</th><td>${PURITY[x].mark}</td><td class="num">${PURITY[x].pct}</td><td class="hl num">${inr(N[x].g)}</td><td class="hide-sm" style="text-align: left">${PURITY[x].use}</td></tr>`).join('\n')}
</tbody></table></div>`);

  let trend = '';
  if (hasHist) {
    const pts = R.history.map((h) => ({ date: h.date, v: h[k] }));
    const net = pts.at(-1).v - pts[0].v;
    trend = card('t-h', `${P.carat} gold rate, last ${pts.length} days`,
      `Per gram, India. ${net < 0 ? 'Down' : 'Up'} ${inr(Math.abs(net))} since ${shortDate(pts[0].date)}.`,
      `${trendChart(pts, { label: `${k} gold rate` })}
${trendStats(pts)}
<a class="more" href="${ctx.url(ctx.months.at(-1).path)}">${ctx.months.at(-1).label} daily history →</a>`);
  }

  const faqs = [
    { q: `What is the ${P.carat} gold rate today?`, a: `${inr(g)} per gram, ${inr(g * 8)} for 8 grams and ${inr(g * 10)} for 10 grams on ${longDate(date)}, before GST and making charges.` },
    k === '22K'
      ? { q: 'Is 916 gold the same as 22 carat?', a: 'Yes. 916 means 91.6% gold, which is 22 carat. Look for the BIS hallmark and a six-digit HUID on the piece.' }
      : k === '24K'
        ? { q: 'Can I make jewellery from 24 carat gold?', a: '24 carat gold is 99.9% pure and too soft for most jewellery, so it is sold mainly as coins and bars.' }
        : { q: 'Why is 18 carat used for diamond jewellery?', a: '18 carat is 75% gold. The harder alloy holds stones more securely than 22 carat.' },
    { q: `How is the ${P.carat} rate different from 22 carat and 24 carat?`, a: `Today 24K is ${inr(N['24K'].g)}, 22K is ${inr(N['22K'].g)} and 18K is ${inr(N['18K'].g)} per gram. The difference comes from the gold content: 99.9%, 91.6% and 75%.` }
  ];

  const other = ['24K', '22K', '18K'].filter((x) => x !== k);
  const main = `<main id="main">
${hero({
    crumbsHtml: crumbs(ctx, [{ name: 'Home', path: '/' }, { name: `${P.carat} gold rate` }]),
    h1: `${P.carat[0].toUpperCase() + P.carat.slice(1).replace('carat', 'Carat')} Gold Rate Today`,
    answer: `Today, <time datetime="${date}">${longDate(date)}</time>, ${P.carat} (${P.mark}) gold in India is <strong class="num">${inr(g)}</strong> per gram, <strong class="num">${inr(g * 8)}</strong> for 8 grams and <strong class="num">${inr(g * 10)}</strong> for 10 grams, ${c >= 0 ? 'up' : 'down'} ₹${Math.abs(c)} per gram from yesterday.`,
    tilesHtml: t,
    stampHtml: stamp([`${live}Updated <time datetime="${R.updatedAt}">${clock(R.updatedAt)} IST</time>`, `${P.mark} hallmark, ${P.pct} pure gold`, 'Before 3% GST and making charges'], sampleTag(ctx))
  })}
${myCityBar()}
${twoCol(
    [weights, cities, adSlot(ctx, 'lb'), cmp, trend, quickLinks(ctx, path), faqCard('f-h', `${P.carat} gold questions`, faqs)].join('\n'),
    [railLinks('Other carats today', [...other.map((x) => [ctx.url(PURITY[x].path), `${PURITY[x].carat} gold rate`, inr(N[x].g)]), [ctx.url('/silver-rate-today/'), 'Silver rate today', inr(R.silverPerKg / 1000)]]), adSlot(ctx, 'mr'),
      railLinks(`${k} by unit`, [[ctx.url('/1-gram-gold-rate/'), `1 gram ${k} gold rate`, inr(g)], [ctx.url('/1-pavan-gold-rate/'), `1 pavan ${k} gold rate`, inr(g * 8)], [ctx.url('/10-gram-gold-rate/'), `10 gram ${k} gold rate`, inr(g * 10)], [ctx.url('/1-tola-gold-rate/'), `1 tola ${k} gold rate`, inr(g * TOLA)]]), railInstall(), adSlot(ctx, 'sky')].join('\n')
  )}
</main>`;

  const title = `${P.carat.replace('carat', 'Carat')} Gold Rate Today (${medDate(date)}): ${inr(g)} per Gram`.replace(/^./, (m) => m.toUpperCase());
  const description = `${P.carat.replace(/^./, (m) => m.toUpperCase())} (${P.mark}) gold rate today in India is ${inr(g)} per gram, ${inr(g * 8)} for 8 grams and ${inr(g * 10)} for 10 grams. City rates and daily history.`;
  return pageOut(ctx, { path, title, description, active: k.toLowerCase(), main, faqs, crumbsList: [{ name: 'Home', path: '/' }, { name: `${P.carat} gold rate` }] });
}

/* ---------- Silver ---------- */
export function silverPage(ctx) {
  const R = ctx.rates, kg = R.silverPerKg, g = kg / 1000, date = R.date, path = '/silver-rate-today/';
  const t = tiles([
    { main: true, k: 'Silver', sub: '1 gram', price: inr(g), rows: [['10 grams', inr(g * 10)], ['100 grams', inr(g * 100)]] },
    { k: 'Silver', sub: '1 kg', price: inr(kg), rows: [['Purity', '999'], ['GST', '3% extra']] },
    { k: 'Silver', sub: '1 tola', price: inr(g * TOLA), rows: [['Tola', '11.66 g'], ['500 grams', inr(g * 500)]] }
  ]);
  const W = [['1 gram', 1], ['10 grams', 10], ['50 grams', 50], ['100 grams', 100], ['500 grams', 500], ['1 kilogram', 1000]];
  const body = `<div class="tbl"><table class="t"><caption>Silver rate in India on ${longDate(date)}, in rupees, before GST</caption><thead><tr><th scope="col">Weight</th><th scope="col" class="hl">Silver 999</th></tr></thead><tbody>
${W.map(([l, w]) => `<tr><th scope="row">${l}</th><td class="hl num">${inr(g * w)}</td></tr>`).join('\n')}
</tbody></table></div>`;
  const faqs = [
    { q: 'What is the silver rate today in India?', a: `${inr(g)} per gram and ${inr(kg)} per kilogram on ${longDate(date)}, before 3% GST.` },
    { q: 'What is the price of 1 kg silver today?', a: `${inr(kg)} for 999 silver, before GST and making charges.` },
    { q: 'Is GST charged on silver?', a: 'Yes. A jeweller adds 3% GST to the value of silver, plus making charges for articles and jewellery.' }
  ];
  const main = `<main id="main">
${hero({
    crumbsHtml: crumbs(ctx, [{ name: 'Home', path: '/' }, { name: 'Silver rate today' }]),
    h1: 'Silver Rate Today in India',
    answer: `Today, <time datetime="${date}">${longDate(date)}</time>, silver (999) in India is <strong class="num">${inr(g)}</strong> per gram and <strong class="num">${inr(kg)}</strong> per kilogram, before 3% GST.`,
    tilesHtml: t,
    stampHtml: stamp([`${live}Updated <time datetime="${R.updatedAt}">${clock(R.updatedAt)} IST</time>`, 'Before 3% GST and making charges'], sampleTag(ctx))
  })}
${myCityBar()}
${twoCol([card('w-h', 'Silver price by weight today', 'Per gram rate × weight.', body), adSlot(ctx, 'lb'), quickLinks(ctx, path), faqCard('f-h', 'Silver rate questions', faqs)].join('\n'),
    [popularLinks(ctx), adSlot(ctx, 'mr'), railInstall()].join('\n'))}
</main>`;
  const title = `Silver Rate Today in India (${medDate(date)}): ${inr(kg)} per kg`;
  const description = `Silver rate today in India is ${inr(g)} per gram and ${inr(kg)} per kilogram (${medDate(date)}), before GST. Prices for 10 g, 100 g, 500 g and 1 kg.`;
  return pageOut(ctx, { path, title, description, active: 'silver', main, faqs, crumbsList: [{ name: 'Home', path: '/' }, { name: 'Silver rate today' }] });
}

/* ---------- IBJA ---------- */
export function ibjaPage(ctx) {
  const R = ctx.rates, B = R.benchmarks, date = R.date, path = '/ibja-gold-rate/';
  const ib = B.ibja, prem = B.board ? B.board.g24 - ib.g24 : null;
  const t = tiles([
    { main: true, k: 'IBJA', sub: '999 gold, 1 gram', price: inr(ib.g24), rows: [['Published', `${clock(ib.at)}`], ['10 grams', inr(ib.g24 * 10)]] },
    B.mcx ? { k: 'MCX', sub: 'futures, 1 gram', price: inr(B.mcx.g24), rows: [['Live at', clock(B.mcx.at)], ['vs IBJA', sinr(B.mcx.g24 - ib.g24)]] } : null,
    B.board ? { k: 'Shops', sub: `${B.board.note} board, 24K`, price: inr(B.board.g24), rows: [['Announced', clock(B.board.at)], ['vs IBJA', sinr(prem)]] } : null,
    { k: '22K', sub: 'national, 1 gram', price: inr(R.national['22K'].g), rows: [['8 grams', inr(R.national['22K'].g * 8)], ['10 grams', inr(R.national['22K'].g * 10)]] }
  ].filter(Boolean).slice(0, 3));
  const body = `<div class="tbl"><table class="t"><caption>24 carat gold per gram on ${longDate(date)}</caption><thead><tr><th scope="col">Rate</th><th scope="col">What it is</th><th scope="col" class="hl">Per gram</th><th scope="col">Time</th></tr></thead><tbody>
<tr><th scope="row">${esc(ib.label)}</th><td style="text-align: left">${esc(ib.note)}</td><td class="hl num">${inr(ib.g24)}</td><td class="num">${clock(ib.at)}</td></tr>
${['mcx', 'board'].filter((x) => B[x]).map((x) => `<tr><th scope="row">${esc(B[x].label)}</th><td style="text-align: left">${esc(B[x].note)}</td><td class="hl num">${inr(B[x].g24)}</td><td class="num">${clock(B[x].at)}</td></tr>`).join('\n')}
</tbody></table></div>`;
  const explain = card('e-h', 'What the IBJA rate is', '', `<div class="prose">
<p>The India Bullion and Jewellers Association (IBJA) publishes a benchmark gold rate on business days, once around noon and again in the evening. Banks, jewellers and gold loan companies use it as a reference.</p>
<p>The IBJA rate excludes GST and is for 999 gold. Shop boards are usually a little higher because they add local costs and margins.${prem === null ? '' : ` Today the shop board is ${inr(Math.abs(prem))} per gram ${prem >= 0 ? 'above' : 'below'} the IBJA rate.`}</p>
</div>`);
  const faqs = [
    { q: 'What is the IBJA gold rate today?', a: `${inr(ib.g24)} per gram for 999 gold, published at ${clock(ib.at)} on ${longDate(date)}, excluding GST.` },
    { q: 'Why is my jeweller\'s rate different from IBJA?', a: 'Shops add transport, local association rates and their margin. So a shop\'s board is often a little higher than IBJA.' },
    { q: 'When is the IBJA rate published?', a: 'Around noon and again in the evening on business days. On holidays the last published rate stands.' }
  ];
  const main = `<main id="main">
${hero({
    crumbsHtml: crumbs(ctx, [{ name: 'Home', path: '/' }, { name: 'IBJA gold rate' }]),
    h1: 'IBJA Gold Rate Today',
    answer: `Today, <time datetime="${date}">${longDate(date)}</time>, the IBJA benchmark for 999 gold is <strong class="num">${inr(ib.g24)}</strong> per gram, published at ${clock(ib.at)} IST, excluding GST.`,
    tilesHtml: t,
    stampHtml: stamp([`${live}IBJA ${R.session === 'AM' ? 'morning' : 'closing'} rate, updated <time datetime="${ib.at}">${clock(ib.at)} IST</time>`, 'Excludes GST'], sampleTag(ctx))
  })}
${myCityBar()}
${twoCol([card('b-h', B.mcx || B.board ? 'IBJA, MCX and shop rates side by side' : 'IBJA benchmark today', '24 carat, per gram.', body), explain, adSlot(ctx, 'lb'), quickLinks(ctx, path), faqCard('f-h', 'IBJA rate questions', faqs)].join('\n'),
    [popularLinks(ctx), adSlot(ctx, 'mr'), railInstall()].join('\n'))}
</main>`;
  const title = `IBJA Gold Rate Today (${medDate(date)}): 999 Gold ${inr(ib.g24)} per Gram`;
  const description = `IBJA gold rate today: ${inr(ib.g24)} per gram for 999 gold (${medDate(date)}, ${R.session === "AM" ? "morning" : "closing"} rate). What the IBJA benchmark is and why shop rates differ.`;
  return pageOut(ctx, { path, title, description, active: '', main, faqs, crumbsList: [{ name: 'Home', path: '/' }, { name: 'IBJA gold rate' }] });
}

/* ---------- Unit pages ---------- */
export const UNITS = [
  { slug: '1-gram-gold-rate', g: 1, name: '1 gram', title: '1 Gram', h1: '1 Gram Gold Rate Today' },
  { slug: '1-pavan-gold-rate', g: 8, name: '1 pavan', title: '1 Pavan', h1: '1 Pavan Gold Rate Today', also: '1 sovereign, 8 grams' },
  { slug: '10-gram-gold-rate', g: 10, name: '10 gram', title: '10 Gram', h1: '10 Gram Gold Rate Today' },
  { slug: '1-tola-gold-rate', g: TOLA, name: '1 tola', title: '1 Tola', h1: '1 Tola Gold Rate Today', also: '11.66 grams' }
];

export function unitPage(ctx, u) {
  const R = ctx.rates, N = R.national, date = R.date, path = `/${u.slug}/`;
  const t = tiles(['22K', '24K', '18K'].map((k) => ({
    main: k === '22K', k, sub: u.name, chg: `${arrow(N[k].chg)} ₹${Math.round(Math.abs(N[k].chg * u.g)).toLocaleString('en-IN')}`, chgCls: chgCls(N[k].chg),
    price: inr(N[k].g * u.g), rows: [['Yesterday', inr((N[k].g - N[k].chg) * u.g)], ['Per gram', inr(N[k].g)]]
  })));
  const crow = ctx.cities.map((ci) => {
    const r = R.cities[ci.slug];
    return `<tr><th scope="row"><a href="${ctx.url(`/gold-rate/${ci.slug}/`)}">${esc(ci.name)}</a><small>${esc(ci.state)}</small></th><td class="hl num">${inr(r['22K'] * u.g)}</td><td class="num">${inr(r['24K'] * u.g)}</td></tr>`;
  }).join('\n');
  const cities = card('c-h', `${u.name} gold rate in cities today`, '22K and 24K for the same weight in each city.',
    `<div class="tbl"><table class="t"><caption class="sr">${u.name} gold rate in Indian cities on ${longDate(date)}</caption><thead><tr><th scope="col">City</th><th scope="col" class="hl">22K</th><th scope="col">24K</th></tr></thead><tbody>
${crow}
</tbody></table></div>`);
  const hist = card('d-h', `${u.name} gold rate, last ${R.history.length} days`, `22K and 24K for ${u.name}${u.also ? ` (${u.also})` : ''}, newest first.`,
    dailyTable(R.history, [{ head: '22K', v: (r) => Math.round(r['22K'] * u.g), hl: true }, { head: '24K', v: (r) => Math.round(r['24K'] * u.g) }], { caption: `${u.name} gold rate in India, newest first` }));
  const faqs = [
    { q: `What is the ${u.name} gold rate today?`, a: `${inr(N['22K'].g * u.g)} for 22K and ${inr(N['24K'].g * u.g)} for 24K on ${longDate(date)}, before GST and making charges.` },
    u.g === 8 ? { q: 'How many grams is 1 pavan?', a: 'One pavan (sovereign) is 8 grams. It is the usual unit for jewellery in Tamil Nadu and Kerala.' }
      : u.g === TOLA ? { q: 'How many grams is 1 tola?', a: 'One tola is 11.66 grams (11.6638 g). Some shops in North and West India still quote by the tola.' }
        : { q: `How is the ${u.name} rate worked out?`, a: `It is the per gram rate times the weight. Shops then add 3% GST and a making charge.` },
    { q: `What is the 18 carat ${u.name} gold rate today?`, a: `${inr(N['18K'].g * u.g)} for 18K gold on ${longDate(date)}.` }
  ];
  const main = `<main id="main">
${hero({
    crumbsHtml: crumbs(ctx, [{ name: 'Home', path: '/' }, { name: `${u.name} gold rate` }]),
    h1: u.h1,
    answer: `Today, <time datetime="${date}">${longDate(date)}</time>, ${u.name}${u.also ? ` (${u.also})` : ''} of 22 carat gold in India is <strong class="num">${inr(N['22K'].g * u.g)}</strong> and 24 carat is <strong class="num">${inr(N['24K'].g * u.g)}</strong>, before GST and making charges.`,
    tilesHtml: t,
    stampHtml: stamp([`${live}Updated <time datetime="${R.updatedAt}">${clock(R.updatedAt)} IST</time>`, 'Before 3% GST and making charges'], sampleTag(ctx))
  })}
${myCityBar()}
${twoCol([cities, adSlot(ctx, 'lb'), hist, quickLinks(ctx, path), faqCard('f-h', `${u.name} gold rate questions`, faqs)].join('\n'),
    [railLinks('Other weights', UNITS.filter((x) => x !== u).map((x) => [ctx.url(`/${x.slug}/`), `${x.name} gold rate`, inr(N['22K'].g * x.g)])), adSlot(ctx, 'mr'), popularLinks(ctx), railInstall()].join('\n'))}
</main>`;
  const title = `${u.title} Gold Rate Today (${medDate(date)}): 22K ${inr(N['22K'].g * u.g)}`;
  const description = `${u.name}${u.also ? ` (${u.also})` : ''} gold rate today in India: 22K ${inr(N['22K'].g * u.g)}, 24K ${inr(N['24K'].g * u.g)} and 18K ${inr(N['18K'].g * u.g)} (${medDate(date)}). City rates and daily price history.`;
  return pageOut(ctx, { path, title, description, active: '', main, faqs, crumbsList: [{ name: 'Home', path: '/' }, { name: `${u.name} gold rate` }] });
}

/* ---------- shared output ---------- */
export function pageOut(ctx, { path, title, description, active, main, faqs, crumbsList, extraLd = [], alternates, altPath, lang, pageId = 'rate' }) {
  return {
    path,
    lastmod: ctx.rates.updatedAt,
    html: page(ctx, {
      path, title, description, active, pageId, main, alternates, altPath, lang,
      jsonld: [breadcrumbLd(ctx, crumbsList, path), ctx.webPage(path, title, description, lang), ...(faqs ? [faqLd(faqs)] : []), ...extraLd]
    })
  };
}
