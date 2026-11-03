// Home: Gold Rate Today in India. Targets: gold rate today, today gold rate, gold price today, gold price.
import { inr, sinr, esc, longDate, medDate, shortDate, clock } from '../lib/format.mjs';
import { page, crumbs, adSlot } from '../lib/layout.mjs';
import {
  PURITY, TOLA, pctOf, arrow, chgCls, tiles, card, weightTable, cityTable, trendChart, trendStats, dailyTable,
  faqCard, faqLd, quickLinks, railCity, popularLinks, railInstall, myCityBar, stamp, live, hero, twoCol
} from '../lib/parts.mjs';

export function nationalTiles(ctx, { per = 'gram' } = {}) {
  const N = ctx.rates.national;
  return tiles(['22K', '24K', '18K'].map((k) => ({
    main: k === '22K',
    k,
    sub: PURITY[k].note,
    chg: `${arrow(N[k].chg)} ₹${Math.abs(N[k].chg)} · ${pctOf(N[k].g, N[k].chg)}`,
    chgCls: chgCls(N[k].chg),
    price: inr(N[k].g),
    small: `/ ${per}`,
    rows: [['8 g<span class="hide-sm"> · 1 pavan</span>', inr(N[k].g * 8)], ['10 g', inr(N[k].g * 10)]]
  })));
}

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

  const weights = card('w-h', 'Gold price by weight today', 'Per gram rate × weight, before GST and making charges.',
    weightTable({
      rates: { '22K': g22, '24K': g24, '18K': N['18K'].g },
      caption: `Gold rate in India on ${longDate(date)}, in rupees`,
      rows: [['1 gram', '', 1], ['8 grams', '1 pavan / sovereign', 8], ['10 grams', '', 10], ['1 tola', '11.66 grams', TOLA], ['100 grams', '', 100]]
    }));

  const pts24 = hist.map((x) => ({ date: x.date, v: x['24K'] }));
  const net = pts24.at(-1).v - pts24[0].v;
  const trend = card('t-h', `Gold rate in the last ${hist.length} days`,
    `24K per gram ranged ${inr(Math.min(...pts24.map((p) => p.v)))} to ${inr(Math.max(...pts24.map((p) => p.v)))} and is ${net < 0 ? 'down' : 'up'} ${inr(Math.abs(net))} since ${shortDate(pts24[0].date)}.`,
    `${trendChart(pts24, { label: '24K gold rate' })}
${trendStats(pts24)}
${dailyTable(hist, [{ head: '22K', v: (r) => r['22K'], hl: true }, { head: '24K', v: (r) => r['24K'] }], { caption: 'Gold rate in India per gram, newest first', limit: 5 })}
<a class="more" href="${ctx.url(month.path)}">Full ${month.label} history →</a>`);

  const faqs = [
    { q: 'What is the gold rate today in India?', a: `On ${longDate(date)}, 22 carat gold is ${inr(g22)} per gram and 24 carat is ${inr(g24)} per gram, before 3% GST and making charges.` },
    { q: 'What is the 1 pavan gold rate today?', a: `One pavan (sovereign) is 8 grams: ${inr(g22 * 8)} for 22K and ${inr(g24 * 8)} for 24K today.` },
    { q: 'What is the 10 gram gold rate today?', a: `${inr(g22 * 10)} for 22K and ${inr(g24 * 10)} for 24K.` },
    { q: 'Why is the shop price higher than this rate?', a: `Shops add 3% GST, a making charge and sometimes wastage. The <a href="${ctx.url('/gold-price-calculator/')}">gold price calculator</a> adds them for your piece.` },
    { q: 'What is 916 gold?', a: '916 means 22 carat, which is 91.6% pure gold. It is the usual purity for jewellery.' },
    { q: 'When does the gold rate change?', a: 'City boards usually update in the morning, and IBJA publishes its benchmark at noon and in the evening on business days. Every rate on this site shows its update time.' }
  ];

  const main = `<main id="main">
${hero({
    crumbsHtml: '',
    h1: 'Gold Rate Today in India',
    answer: `Today, <time datetime="${date}">${longDate(date)}</time>, 22 carat gold is <strong class="num">${inr(g22)}</strong> per gram and 24 carat is <strong class="num">${inr(g24)}</strong> per gram, ${N['22K'].chg >= 0 ? 'up' : 'down'} ₹${Math.abs(N['22K'].chg)} and ₹${Math.abs(N['24K'].chg)} from yesterday.`,
    tilesHtml: nationalTiles(ctx),
    stampHtml: stamp([`${live}Updated <time datetime="${R.updatedAt}">${clock(R.updatedAt)} IST</time>`, 'IBJA benchmark, before 3% GST and making charges', `Silver ${inr(R.silverPerKg / 1000)} / gram`], R.sample ? 'Sample rates' : '')
  })}
${myCityBar()}
${twoCol(
    [weights, cityTable(ctx, { heading: 'Gold rate today in major cities', sub: Object.values(ctx.rates.cities).some((x) => x.local) ? "Each city's own board, with the unit its shops use." : "National IBJA rate, in the unit each city's shops use.", cities: ctx.cities }), adSlot(ctx, 'lb'), whyMoved(ctx), trend, quickLinks(ctx), faqCard('f-h', 'Gold rate questions', faqs)].join('\n'),
    [railCity(ctx), adSlot(ctx, 'mr'), popularLinks(ctx), railInstall(), adSlot(ctx, 'sky')].join('\n')
  )}
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
