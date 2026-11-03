// Home: Gold Rate Today in India. Targets: gold rate today, today gold rate, gold price today, gold price.
import { inr, sinr, esc, longDate, medDate, shortDate, clock } from '../lib/format.mjs';
import { page, crumbs, adSlot } from '../lib/layout.mjs';
import {
  PURITY, TOLA, pctOf, arrow, chgCls, tiles, card, weightTable, cityTable, trendChart, trendStats, dailyTable,
  faqCard, faqLd, quickLinks, railCity, railLinks, popularLinks, railInstall, myCityBar, stamp, live, hero, twoCol, unitCards, cityCards, noteBox, ctaBox
} from '../lib/parts.mjs';

export const HOME_TABS = [{ label: '1 gram', short: '/ gram', g: 1 }, { label: '1 pavan (8 g)', short: '/ 8 g', g: 8 }, { label: '10 grams', short: '/ 10 g', g: 10 }];

export function nationalTiles(ctx, { per = 'gram', tabs = null, foot = '' } = {}) {
  const N = ctx.rates.national;
  return tiles(['22K', '24K', '18K'].map((k) => ({
    main: k === '22K',
    k,
    sub: k === '22K' ? PURITY[k].note : PURITY[k].mark,
    chg: `${arrow(N[k].chg)} ₹${Math.abs(N[k].chg).toLocaleString('en-IN')}${k === '22K' ? ` · ${pctOf(N[k].g, N[k].chg)}` : ''}`,
    chgG: N[k].chg,
    chgCls: chgCls(N[k].chg),
    price: inr(N[k].g),
    g: N[k].g,
    small: k === '22K' ? `/ ${per}` : '',
    rows: [['8 g<span class="hide-sm"> · 1 pavan</span>', inr(N[k].g * 8)], ['10 g', inr(N[k].g * 10)]]
  })), { tabs, foot });
}

export const sessionWord = (R) => (R.carriedFrom ? 'Last IBJA rate' : R.session === 'AM' ? 'IBJA morning rate' : 'IBJA closing rate');

export function whyMoved(ctx) {
  const R = ctx.rates, h = R.history;
  const a = h.at(-2)['24K'], b = h.at(-1)['24K'];
  const d = R.drivers.map((x) => ({ ...x }));
  const sum = d.reduce((s, x) => s + x.v, 0);
  if (sum !== b - a && d.length) d[d.length - 1].v += b - a - sum;
  const box = d.map((x) => `<div class="drv"><span>${esc(x.label)}</span><b class="num ${x.v >= 0 ? 'up' : 'down'}">${sinr(x.v)}</b></div>`).join('');
  return card('why-h', 'Why gold moved today', `24K per gram went from ${inr(a)} to ${inr(b)}.`,
    `<div class="drivers" style="grid-template-columns: repeat(${Math.min(d.length, 3)}, minmax(0, 1fr))">${box}</div>
<p class="sub" style="color: #2A333B">${esc(R.editorNote.text)}</p>`,
    `<span class="${chgCls(b - a, false)} num">${sinr(b - a)}</span>`);
}

export function homePage(ctx) {
  const R = ctx.rates, N = R.national, date = R.date, hist = R.history;
  const g22 = N['22K'].g, g24 = N['24K'].g;
  const month = ctx.months.at(-1);

  const weights = `<section class="sec" aria-labelledby="w-h"><h2 id="w-h" class="h2">Gold price by weight today</h2>
${unitCards(ctx, [
    { name: '1 gram', g: 1, path: '/1-gram-gold-rate/' },
    { name: '1 pavan', note: '8 g', g: 8, path: '/1-pavan-gold-rate/' },
    { name: '10 grams', g: 10, path: '/10-gram-gold-rate/' },
    { name: '1 tola', note: '11.66 g', g: TOLA, path: '/1-tola-gold-rate/' }
  ])}
</section>`;

  const pts = hist.map((x) => ({ date: x.date, v: x['24K'] }));
  const p10 = pts.slice(-10);
  const lo = Math.min(...pts.map((p) => p.v)), hi = Math.max(...pts.map((p) => p.v));
  const net = pts.at(-1).v - pts[0].v;
  const trend = card('t-h', `24K gold is ${net < 0 ? 'down' : 'up'} ${inr(Math.abs(net))} in ${pts.length} trading days`,
    `Per gram, IBJA closing rate, ${shortDate(pts[0].date)} to ${longDate(pts.at(-1).date)}. High ${inr(hi)}, low ${inr(lo)}.`,
    `<div data-range="30">${trendChart(pts, { label: '24K gold rate' })}</div>
<div data-range="10" hidden>${trendChart(p10, { label: '24K gold rate' })}</div>`,
    `<div class="rtabs" role="group" aria-label="Chart range"><button type="button" class="rtab" aria-pressed="false" data-rtab="10">10 days</button><button type="button" class="rtab on" aria-pressed="true" data-rtab="30">${pts.length} days</button></div>`);

  const daily = card('d-h', 'Last 10 days, per gram', '',
    `${dailyTable(hist, [{ head: '22K', v: (r) => r['22K'], hl: true }, { head: '24K', v: (r) => r['24K'] }], { caption: 'Gold rate in India per gram, IBJA closing rate, newest first', limit: 10 })}
<a class="more" href="${ctx.url(month.path)}">Full gold rate history</a>`);

  const faqs = [
    { q: 'What is the gold rate today in India?', a: `On ${longDate(date)}, 22 carat gold is ${inr(g22)} per gram and 24 carat is ${inr(g24)} per gram, before 3% GST and making charges.` },
    { q: 'What is the 1 pavan gold rate today?', a: `One pavan (sovereign) is 8 grams: ${inr(g22 * 8)} for 22K and ${inr(g24 * 8)} for 24K today.` },
    { q: 'What is the 10 gram gold rate today?', a: `${inr(g22 * 10)} for 22K and ${inr(g24 * 10)} for 24K.` },
    { q: "Why is my jeweller's rate higher?", a: `This is the IBJA wholesale benchmark. Shop boards add local costs, so they are usually 1 to 2% higher, and your bill adds 3% GST and a making charge. The <a href="${ctx.url('/gold-price-calculator/')}">gold price calculator</a> adds them for your piece.` },
    { q: 'When is the rate updated?', a: 'After the IBJA morning and evening rates, Monday to Friday. On weekends and market holidays the last IBJA rate stays, and the page says which day it is from.' },
    { q: 'What is the difference between 22K and 24K?', a: '24K (999) is pure gold, used for coins and bars. 22K (916) is 91.6% gold and is the usual purity for jewellery.' }
  ];

  const rail = [
    noteBox('Why shops quote a little more', 'Our rate is the IBJA wholesale benchmark. Shop boards add local costs, so they are usually 1 to 2% higher. Your bill also adds 3% GST and making charges.'),
    ctaBox('What will my bill be?', "Add making charge and GST to today's rate.", ctx.url('/gold-price-calculator/'), 'Open the calculator'),
    railLinks('Popular today', [
      [ctx.url('/22-carat-gold-rate/'), '22 carat gold rate', inr(g22)],
      [ctx.url('/18-carat-gold-rate/'), '18 carat gold rate', inr(N['18K'].g)],
      [ctx.url('/ibja-gold-rate/'), 'IBJA gold rate', inr(R.benchmarks.ibja.g24)],
      [ctx.url('/silver-rate-today/'), 'Silver rate today', inr(R.silverPerKg / 1000)]
    ]),
    adSlot(ctx, 'mr')
  ].join('\n');

  const main = `<main id="main">
${hero({
    crumbsHtml: '',
    h1: 'Gold Rate Today in India',
    answer: `22 carat gold is <strong class="num">${inr(g22)}</strong> per gram and 24 carat is <strong class="num">${inr(g24)}</strong>, ${N['22K'].chg === 0 && N['24K'].chg === 0 ? 'unchanged from yesterday' : `${N['22K'].chg >= 0 ? 'up' : 'down'} ₹${Math.abs(N['22K'].chg)} and ₹${Math.abs(N['24K'].chg)} from yesterday`}.`,
    tilesHtml: nationalTiles(ctx, {
      tabs: HOME_TABS,
      foot: `<a class="tiles-foot" href="${ctx.url('/silver-rate-today/')}"><span>Silver</span><b class="num">${inr(R.silverPerKg / 1000)} / g · ${inr(R.silverPerKg)} / kg</b></a>`
    }),
    stampHtml: stamp([`${live}${sessionWord(R)} · <time datetime="${R.updatedAt}">${clock(R.updatedAt)} IST</time>`, 'Before 3% GST and making charges'], R.sample ? 'Sample rates' : '')
  })}
<div class="wrap" style="padding-top: var(--sec)">${weights}</div>
${twoCol([trend, cityCards(ctx, ctx.cities, { heading: 'Gold rate today in your city', sub: Object.values(R.cities).some((x) => x.local) ? '' : 'National IBJA rate, in the unit each city\'s shops use.' }), adSlot(ctx, 'lb'), daily, faqCard('f-h', 'Questions people ask', faqs)].join('\n'), rail)}
</main>`;

  const title = `Gold Rate Today in India (${medDate(date)}): 22K ${inr(g22)}, 24K ${inr(g24)}`;
  const description = `Today's gold rate in India: 22 carat ${inr(g22)} and 24 carat ${inr(g24)} per gram (${medDate(date)}). City rates, 1 pavan and 10 gram prices, and daily price history.`;
  return {
    path: '/',
    lastmod: R.updatedAt,
    html: page(ctx, {
      path: '/', title, description, active: 'home', pageId: 'home', main,
      alternates: ctx.site.tamil ? [{ lang: 'en-IN', path: '/' }, { lang: 'ta-IN', path: '/ta/' }] : undefined, altPath: ctx.site.tamil ? '/ta/' : undefined,
      jsonld: [
        { '@type': 'Organization', '@id': ctx.abs('/') + '#org', name: ctx.site.name, url: ctx.abs('/'), logo: ctx.abs('/icons/icon-512.png') },
        { '@type': 'WebSite', '@id': ctx.abs('/') + '#site', name: ctx.site.name, url: ctx.abs('/'), inLanguage: 'en-IN', publisher: { '@id': ctx.abs('/') + '#org' } },
        ctx.webPage('/', title, description),
        faqLd(faqs)
      ]
    })
  };
}
