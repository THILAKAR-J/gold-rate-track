// City pages (/gold-rate/{slug}/) and the cities hub (/gold-rate/).
import { inr, esc, longDate, medDate, clock } from '../lib/format.mjs';
import { crumbs, adSlot } from '../lib/layout.mjs';
import {
  TOLA, pctOf, arrow, chgCls, tiles, card, weightTable, cityTable, faqCard, quickLinks, railLinks, railInstall,
  myCityBar, stamp, live, hero, twoCol, localUnit, cityDiff
} from '../lib/parts.mjs';
import { pageOut } from './rates.mjs';

export function cityPage(ctx, c) {
  const R = ctx.rates, N = R.national, r = R.cities[c.slug], date = R.date;
  const sov = c.unit.id === 'sov';
  const uw = c.unit.label.toLowerCase(); // sovereign | pavan | 10 g
  const lu = localUnit(c);
  const path = `/gold-rate/${c.slug}/`;
  const hasTa = !!c.ta;
  const df = cityDiff(r['22K'], N['22K'].g);
  const vsIndia = df.d === 0 ? 'The rate is the same as the national rate.' : `That is ${inr(Math.abs(df.d))} per gram ${df.d > 0 ? 'above' : 'below'} the national rate.`;

  const t = tiles([
    { main: true, k: '22K', sub: lu.label, chg: `${arrow(r.chg22)} ₹${Math.abs(r.chg22 * lu.g).toLocaleString('en-IN')} · ${pctOf(r['22K'], r.chg22)}`, chgCls: chgCls(r.chg22), price: inr(r['22K'] * lu.g), small: `/ ${lu.g} g`, rows: [['1 gram', inr(r['22K'])], [sov ? '10 grams' : '1 tola', inr(r['22K'] * (sov ? 10 : TOLA))]] },
    { k: '24K', sub: lu.label, chg: `${arrow(r.chg24)} ₹${Math.abs(r.chg24 * lu.g).toLocaleString('en-IN')} · ${pctOf(r['24K'], r.chg24)}`, chgCls: chgCls(r.chg24), price: inr(r['24K'] * lu.g), small: `/ ${lu.g} g`, rows: [['1 gram', inr(r['24K'])], [sov ? '10 grams' : '1 tola', inr(r['24K'] * (sov ? 10 : TOLA))]] },
    { k: '18K', sub: '1 gram', price: inr(r['18K']), small: '/ gram', rows: [[lu.label, inr(r['18K'] * lu.g)], ['vs India', r['18K'] === N['18K'].g ? 'Same' : (r['18K'] > N['18K'].g ? '+₹' : '−₹') + Math.abs(r['18K'] - N['18K'].g)]] }
  ]);

  const W = sov
    ? [['1 gram', '', 1], [`1 ${uw}`, '8 grams', 8], [`2 ${c.unit.plural}`, '16 grams', 16], [`5 ${c.unit.plural}`, '40 grams', 40], [`10 ${c.unit.plural}`, '80 grams', 80], ['10 grams', '', 10]]
    : [['1 gram', '', 1], ['8 grams', '1 pavan / sovereign', 8], ['10 grams', '', 10], ['1 tola', '11.66 grams', TOLA], ['50 grams', '', 50], ['100 grams', '', 100]];
  const weights = card('w-h', sov ? `${c.name} gold rate per ${uw} and gram` : `${c.name} gold rate per 10 grams and gram`,
    sov ? `${c.name} shops price jewellery by the ${uw}, which is 8 grams.` : `${c.name} shops usually quote per 10 grams; one tola is 11.66 grams.`,
    weightTable({ rates: { '22K': r['22K'], '24K': r['24K'], '18K': r['18K'] }, rows: W, caption: `Gold rate in ${c.name} on ${longDate(date)}, in rupees, before GST` }));

  // Budget example at today's rate: ₹3,00,000, 12% making, 3% GST.
  const budget = 300000, mk = 0.12, perGram = r['22K'] * (1 + mk) * 1.03, grams = budget / perGram;
  const planner = card('p-h', sov ? `How many ${c.unit.plural} can ₹3 lakh buy?` : 'How much gold can ₹3 lakh buy?', `22K jewellery at today's ${c.name} rate with a 12% making charge and 3% GST.`,
    `<div class="drivers">
<div class="drv"><span>All-in price per ${sov ? uw : 'gram'}</span><b class="num">${inr(perGram * (sov ? 8 : 1))}</b></div>
<div class="drv"><span>You can buy about</span><b class="num" style="color: #845A0E">${sov ? (grams / 8).toFixed(1) : grams.toFixed(1)}</b><span>${sov ? c.unit.plural : 'grams'}</span></div>
<div class="drv"><span>Gold weight</span><b class="num">${grams.toFixed(1)} g</b></div>
</div>
<a class="more" href="${ctx.url('/gold-price-calculator/')}">Try your own budget in the calculator →</a>`);

  const near = c.near.map((s) => ctx.cityBySlug(s));
  const nearRows = near.map((n) => {
    const nr = R.cities[n.slug], nl = localUnit(n);
    return `<tr><th scope="row"><a href="${ctx.url(`/gold-rate/${n.slug}/`)}">${esc(n.name)}</a><small>${esc(n.state)}</small></th><td class="hl num">${inr(nr['22K'])}</td><td class="num">${nl.label} ${inr(nr['22K'] * nl.g)}</td></tr>`;
  }).join('\n');
  const nearby = card('n-h', `Gold rate near ${c.name}`, 'Each city page uses its own local board.',
    `<div class="tbl"><table class="t"><caption class="sr">22K gold rate in cities near ${esc(c.name)} on ${longDate(date)}</caption><thead><tr><th scope="col">City</th><th scope="col" class="hl">22K / gram</th><th scope="col">Local unit, 22K</th></tr></thead><tbody>
${nearRows}
</tbody></table></div>
<a class="more" href="${ctx.url('/gold-rate/')}">All cities →</a>`);

  const faqs = sov
    ? [
        { q: `What is the 1 ${uw} gold rate in ${c.name} today?`, a: `${inr(r['22K'] * 8)} for 22K and ${inr(r['24K'] * 8)} for 24K on ${longDate(date)}, before GST and making charges.` },
        { q: `What is the 1 gram gold rate in ${c.name} today?`, a: `${inr(r['22K'])} for 22K (916) and ${inr(r['24K'])} for 24K.` },
        { q: `Why do ${c.name} shops quote per ${uw}?`, a: `A ${uw} is 8 grams and is the usual unit for jewellery in ${c.state === 'State rate' ? c.name : c.state}.` },
        { q: `When is the ${c.name} gold rate updated?`, a: `The ${c.name} board is usually announced in the morning, and again if the market moves sharply. The time is shown above the rate.` }
      ]
    : [
        { q: `What is the 10 gram gold rate in ${c.name} today?`, a: `${inr(r['22K'] * 10)} for 22K and ${inr(r['24K'] * 10)} for 24K on ${longDate(date)}, before GST and making charges.` },
        { q: `What is the 1 gram gold rate in ${c.name} today?`, a: `${inr(r['22K'])} for 22K (916) and ${inr(r['24K'])} for 24K.` },
        { q: `Why is the ${c.name} rate different from the national rate?`, a: 'Transport, the local association rate and demand add small premiums. The table on this page shows the difference.' },
        { q: `When is the ${c.name} gold rate updated?`, a: `The ${c.name} rate is usually updated in the morning, and again if the market moves sharply.` }
      ];

  const vs = `<div class="box"><h2>${esc(c.name)} vs India</h2><div class="tbl"><table class="t"><caption class="sr">${esc(c.name)} and national gold rate per gram</caption><thead><tr><th scope="col">Per gram</th><th scope="col">${esc(c.name)}</th><th scope="col">India</th></tr></thead><tbody>${['24K', '22K', '18K']
    .map((k) => `<tr><th scope="row">${k}</th><td class="num">${inr(r[k])}</td><td class="num">${inr(N[k].g)}</td></tr>`).join('')}</tbody></table></div></div>`;
  const save = `<div class="box"><h2>Check ${esc(c.name)} daily?</h2><p class="hint">Save it as your city. The home page will then open with ${esc(c.name)}'s rate on top.</p><button type="button" class="btn btn-dark" data-save-city="${c.slug}">Make ${esc(c.name)} my city</button></div>`;
  const railMore = railLinks('More rates', [
    ...(hasTa ? [[ctx.url(`/ta/${c.slug}/`), esc(c.ta.name) + ' தங்கம் விலை', 'தமிழ்', 'ta']] : []),
    [ctx.url('/1-pavan-gold-rate/'), '1 pavan gold rate today', inr(N['22K'].g * 8)],
    [ctx.url('/22-carat-gold-rate/'), '22 carat gold rate', inr(N['22K'].g)],
    [ctx.url('/silver-rate-today/'), 'Silver rate today', inr(R.silverPerKg / 1000)]
  ]);

  const crumbList = [{ name: 'Home', path: '/' }, { name: 'Cities', path: '/gold-rate/' }, { name: c.name }];
  const main = `<main id="main">
${hero({
    crumbsHtml: crumbs(ctx, crumbList),
    h1: `Gold Rate Today in ${esc(c.name)}`,
    answer: `Today, <time datetime="${date}">${longDate(date)}</time>, ${sov ? `1 ${uw} (8 g)` : '10 grams'} of 22 carat gold in ${esc(c.name)} is <strong class="num">${inr(r['22K'] * lu.g)}</strong> and 1 gram is <strong class="num">${inr(r['22K'])}</strong>, ${r.chg22 >= 0 ? 'up' : 'down'} ₹${Math.abs(r.chg22 * lu.g).toLocaleString('en-IN')} per ${sov ? uw : '10 grams'} from yesterday. ${vsIndia}`,
    tilesHtml: t,
    stampHtml: stamp(r.local === false
      ? [`${live}Updated <time datetime="${r.at}">${clock(r.at)} IST</time>`, `National rate: ${esc(c.name)}'s local board rate is not yet available`, 'Before 3% GST and making charges']
      : [`${live}${esc(c.name)} board <time datetime="${r.at}">${clock(r.at)} IST</time>`, (/^\[/.test(c.source) ? `Local ${esc(c.name)} rate` : `Source: ${esc(c.source)}`), 'Before 3% GST and making charges'], ctx.rates.sample ? 'Sample rates' : '')
  })}
${myCityBar()}
${twoCol([weights, planner, adSlot(ctx, 'lb'), nearby, quickLinks(ctx), faqCard('f-h', `${esc(c.name)} gold rate questions`, faqs)].join('\n'),
    [vs, save, adSlot(ctx, 'mr'), railMore, railInstall(), adSlot(ctx, 'sky')].join('\n'))}
</main>`;

  const title = sov
    ? `Gold Rate Today in ${c.name} (${medDate(date)}): 22K ${c.unit.label} ${inr(r['22K'] * 8)}`
    : `Gold Rate Today in ${c.name} (${medDate(date)}): 22K 10 Gram ${inr(r['22K'] * 10)}`;
  const description = `Gold rate today in ${c.name}: 22K ${inr(r['22K'])} and 24K ${inr(r['24K'])} per gram${sov ? `, ${inr(r['22K'] * 8)} per ${uw}` : `, ${inr(r['22K'] * 10)} per 10 grams`} (${medDate(date)}). Compare with the national rate.`;
  return {
    ...pageOut(ctx, {
      path, title, description, active: 'cities', main, faqs, crumbsList: crumbList, pageId: 'city',
      alternates: hasTa ? [{ lang: 'en-IN', path }, { lang: 'ta-IN', path: `/ta/${c.slug}/` }] : undefined,
      altPath: hasTa ? `/ta/${c.slug}/` : undefined,
      extraLd: []
    }),
    lastmod: r.at
  };
}

export function citiesHub(ctx) {
  const R = ctx.rates, N = R.national, date = R.date, path = '/gold-rate/';
  const crumbList = [{ name: 'Home', path: '/' }, { name: 'Cities' }];
  const main = `<main id="main">
${hero({
    crumbsHtml: crumbs(ctx, crumbList),
    h1: 'Gold Rate Today in Indian Cities',
    answer: `22K and 24K gold rates for ${ctx.cities.length} cities on <time datetime="${date}">${longDate(date)}</time>, each from its own local board and compared with the national 22K rate of <strong class="num">${inr(N['22K'].g)}</strong> per gram.`,
    stampHtml: stamp([`${live}Updated <time datetime="${R.updatedAt}">${clock(R.updatedAt)} IST</time>`, 'Before 3% GST and making charges'], R.sample ? 'Sample rates' : '')
  })}
${myCityBar()}
${twoCol([cityTable(ctx, { id: 'find-h', heading: 'Find your city', sub: "Per gram, with each city's usual unit.", cities: ctx.cities, more: false }), adSlot(ctx, 'lb'), quickLinks(ctx)].join('\n'),
    [railLinks('By weight', [[ctx.url('/1-pavan-gold-rate/'), '1 pavan gold rate', inr(N['22K'].g * 8)], [ctx.url('/10-gram-gold-rate/'), '10 gram gold rate', inr(N['22K'].g * 10)], [ctx.url('/1-tola-gold-rate/'), '1 tola gold rate', inr(N['22K'].g * TOLA)]]), adSlot(ctx, 'mr'), railInstall()].join('\n'))}
</main>`;
  const title = `Gold Rate Today in Indian Cities (${medDate(date)}): 22K and 24K`;
  const description = `Today's 22K and 24K gold rate in Chennai, Mumbai, Delhi, Bengaluru, Hyderabad, Kolkata, Kerala and more, each compared with the national rate.`;
  return pageOut(ctx, {
    path, title, description, active: 'cities', main, crumbsList: crumbList, pageId: 'hub',
    extraLd: [{ '@type': 'ItemList', name: 'Gold rate by city', itemListElement: ctx.cities.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `Gold rate in ${c.name}`, url: ctx.abs(`/gold-rate/${c.slug}/`) })) }]
  });
}
