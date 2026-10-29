// City pages (/gold-rate/{slug}/) and the cities hub (/gold-rate/).
import { inr, esc, longDate, medDate, clock, shortDate } from '../lib/format.mjs';
import { page, crumbs, breadcrumbLd } from '../lib/layout.mjs';
import { wcell, toolCard, faqHtml, faqLd, cityFinder, cityDiff } from '../lib/parts.mjs';
import { chgText } from './home.mjs';

const SKYLINE = {
  chennai: `<path d="M0 92 H400" stroke="#3A434B" stroke-width="2"/><path d="M40 92 V74 H104 V92 M46 74 L52 58 H92 L98 74 M56 58 L60 44 H88 L92 58 M64 44 L66 32 H82 L84 44 M68 32 Q74 18 80 32" fill="none" stroke="#E8B64C" stroke-width="2" stroke-linejoin="round"/><path d="M300 92 L306 34 H318 L324 92 M302 66 H322 M304 50 H320 M306 34 L312 22 L318 34" fill="none" stroke="#C9C3B6" stroke-width="2" stroke-linejoin="round"/><path d="M326 26 L344 19 M326 31 L346 31" stroke="#E8B64C" stroke-width="2.5" stroke-linecap="round"/><path d="M140 84 Q150 78 160 84 T180 84 T200 84 M190 90 Q200 84 210 90 T230 90" fill="none" stroke="#5B6670" stroke-width="2" stroke-linecap="round"/><circle cx="236" cy="30" r="12" fill="#E8B64C" fill-opacity="0.85"/>`,
  city: `<path d="M0 92 H400" stroke="#3A434B" stroke-width="2"/><path d="M30 92 V60 H58 V92 M64 92 V40 H96 V92 M70 50 H90 M70 62 H90 M70 74 H90 M102 92 V70 H124 V92" fill="none" stroke="#C9C3B6" stroke-width="2" stroke-linejoin="round"/><path d="M150 92 V58 Q176 30 202 58 V92 M150 58 H202 M168 92 V74 Q176 66 184 74 V92 M176 36 V26" fill="none" stroke="#E8B64C" stroke-width="2" stroke-linejoin="round"/><path d="M232 92 V48 H262 V92 M270 92 V28 H300 V92 M276 38 H294 M276 52 H294 M276 66 H294 M310 92 V64 H346 V92" fill="none" stroke="#C9C3B6" stroke-width="2" stroke-linejoin="round"/><circle cx="360" cy="28" r="12" fill="#E8B64C" fill-opacity="0.85"/>`
};

function unitsFor(c) {
  const g = { id: 'g', label: 'Gram', name: 'per gram', g: 1 };
  const g10 = { id: '10g', label: '10 g', name: 'per 10 grams', g: 10 };
  if (c.unit.id === 'sov') return [{ id: 'sov', label: c.unit.label, name: `per ${c.unit.label.toLowerCase()} (8 g)`, g: 8 }, g, g10];
  return [g10, g, { id: 'tola', label: 'Tola', name: 'per tola (11.66 g)', g: 11.6638 }];
}

export function cityPage(ctx, c) {
  const R = ctx.rates;
  const r = R.cities[c.slug];
  const N = R.national;
  const date = R.date;
  const units = unitsFor(c);
  const u0 = units[0];
  const sov = c.unit.id === 'sov';
  const uName = c.unit.label.toLowerCase();
  const path = `/gold-rate/${c.slug}/`;

  const pills = units
    .map((u, i) => `<button type="button" class="pill${i === 0 ? ' on' : ''}" aria-pressed="${i === 0}" data-unit="${u.id}">${esc(u.label)}</button>`)
    .join('');
  const tile = (k, cls, label) =>
    `<div class="tile"><span class="k">${label} · <span data-u-name>${esc(u0.name)}</span></span><p class="p ${cls} num" data-tile="${k}">${inr(r[k] * u0.g)}</p><span><span class="chg chg-${r['chg' + k.slice(0, 2)] >= 0 ? 'up' : 'down'} num" data-tile-chg="${k}">${chgText(r[k], r['chg' + k.slice(0, 2)], u0.g).replace(/ \(.*\)$/, '')} since yesterday</span></span></div>`;

  const cmpRow = (k) => {
    const d = r[k] - N[k].g;
    return `<tr><th scope="row">${k}</th><td class="num">${inr(r[k])}</td><td class="num">${inr(N[k].g)}</td><td class="num"${d ? ` style="color: ${d > 0 ? '#FF9B73' : '#5FD3A6'}"` : ''}>${d === 0 ? 'Same' : (d > 0 ? '+₹' : '−₹') + Math.abs(d)}</td></tr>`;
  };
  const df = cityDiff(r['22K'], N['22K'].g);
  const sameText = df.d === 0 ? 'the same as the national rate' : `${inr(Math.abs(df.d))} per gram ${df.d > 0 ? 'above' : 'below'} the national rate`;

  // Weight table
  const W = sov
    ? [['coin', '1 gram', 'Small coin', 1], ['sov1', `1 ${uName}`, '8 grams', 8], ['sov2', `2 ${c.unit.plural}`, '16 grams', 16], ['bar10', '10 grams', 'Small bar', 10], ['sov5', `5 ${c.unit.plural}`, '40 grams', 40]]
    : [['coin', '1 gram', 'Small coin', 1], ['coin8', '8 grams', '1 pavan / sovereign', 8], ['bar10', '10 grams', 'Small bar', 10], ['tola', '1 tola', '11.66 grams', 11.6638], ['bar100', '100 grams', 'Investment bar', 100]];
  const wrows = W.map(([ic, l, s, g]) => `<tr><th scope="row">${wcell(ic, l, s)}</th><td class="hl num">${inr(r['22K'] * g)}</td><td class="num">${inr(r['24K'] * g)}</td><td class="num">${inr(r['18K'] * g)}</td></tr>`).join('\n');

  // Planner (server-rendered at budget 3,00,000 and 12% making)
  const budget = 300000, mk = 12;
  const perGram = r['22K'] * (1 + mk / 100) * 1.03;
  const grams = budget / perGram;
  const planUnit = sov ? 8 : 1;
  const count = grams / planUnit;
  // One coin per sovereign (or per gram in 10 g cities), capped at 40 with a "+N" tag.
  const coins = (n) => {
    const whole = Math.floor(n), part = n - whole;
    let s = '<span class="coin"></span>'.repeat(Math.min(whole, 40));
    if (part > 0.05 && whole < 40) s += `<span class="coin" style="background: conic-gradient(#E8B64C ${Math.round(part * 360)}deg, #2A333B 0deg); box-shadow: none"></span>`;
    if (whole > 40) s += `<span class="coin-more num">+${whole - 40}</span>`;
    return s;
  };
  const planLabel = sov ? c.unit.plural : 'grams';
  const bigNum = sov ? count.toFixed(1) : grams.toFixed(1);
  const planDetail = sov
    ? `${grams.toFixed(1)} g of 22K gold · ${inr(perGram * 8)} per ${uName}, all in`
    : `${inr(perGram)} per gram, all in · each coin is 1 g`;

  const near = c.near
    .map((s) => {
      const n = ctx.cities.find((x) => x.slug === s);
      return `<a href="${ctx.url(`/gold-rate/${s}/`)}"><b>${esc(n.name)}</b><span class="num near-r">22K ${inr(R.cities[s]['22K'])} per gram</span><span>View today's rate →</span></a>`;
    })
    .join('');

  const faqs = sov
    ? [
        { q: `What is the 1 ${uName} gold rate in ${c.name} today?`, a: `${inr(r['22K'] * 8)} for 22K and ${inr(r['24K'] * 8)} for 24K on ${longDate(date)}, before GST and making charges.` },
        { q: `Why do ${c.name} shops quote per ${uName}?`, a: `A ${uName} (sovereign) is 8 grams and is the usual unit for jewellery in ${c.state === 'State rate' ? c.name : c.state}. We show both ${uName} and gram prices.` },
        { q: `Is the ${c.name} rate different from other cities?`, a: 'Usually by a small amount. Each city page shows its own board and its difference from the national rate.' },
        { q: `When is the ${c.name} board updated?`, a: 'Usually once in the morning, and again if the market moves sharply. The time of the latest board is shown above the rate.' }
      ]
    : [
        { q: `What is the 10 gram gold rate in ${c.name} today?`, a: `${inr(r['22K'] * 10)} for 22K and ${inr(r['24K'] * 10)} for 24K on ${longDate(date)}, before GST and making charges.` },
        { q: `Why is the ${c.name} rate different from the national rate?`, a: 'Transport, the local association rate and demand add small premiums. The table above shows the difference for each purity.' },
        { q: 'How many grams is one tola?', a: 'One tola is 11.66 grams. Many shops in the north and west still quote by the tola or by 10 grams.' },
        { q: `When is the ${c.name} rate updated?`, a: 'Usually once in the morning, and again if the market moves sharply. The time of the latest board is shown above the rate.' }
      ];

  const crumbItems = [{ name: 'Home', path: '/' }, { name: 'Cities', path: '/gold-rate/' }, { name: c.name }];

  const main = `<main id="main">
<section class="hero" aria-labelledby="h1">
<svg class="hero-pat" aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 640"><defs><pattern id="jaali-c" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M24 4 L44 24 L24 44 L4 24 Z" fill="none" stroke="#E8B64C" stroke-opacity="0.07" stroke-width="1"/><circle cx="24" cy="24" r="2" fill="#E8B64C" fill-opacity="0.09"/></pattern><radialGradient id="glow-c" cx="30%" cy="40%" r="60%"><stop offset="0" stop-color="#E8B64C" stop-opacity="0.12"/><stop offset="1" stop-color="#E8B64C" stop-opacity="0"/></radialGradient></defs><rect width="1440" height="640" fill="url(#jaali-c)"/><rect width="1440" height="640" fill="url(#glow-c)"/></svg>
<div class="wrap hero-in">
<div class="hero-main">
${crumbs(ctx, crumbItems)}
<h1 id="h1" class="title">Gold Rate Today in ${esc(c.name)}</h1>
<p class="lead">${sov ? `One ${uName} (8 g)` : '10 grams'} of 22 carat gold is <strong class="num">${inr(r['22K'] * (sov ? 8 : 10))}</strong> in ${esc(c.name)} on <time datetime="${date}">${longDate(date)}</time>, ${sameText}.</p>
<div class="board" data-city-board>
<div class="board-top">
<div class="pills" role="group" aria-label="Show price for">${pills}</div>
<p class="stamp"><span class="live" aria-hidden="true"></span>${esc(c.name)} board · <time datetime="${r.at}">${clock(r.at)} IST</time></p>
</div>
<div class="tiles" aria-live="polite">
${tile('22K', 'gold', '22K · 916 jewellery gold')}
${tile('24K', 'white', '24K · 999 pure gold')}
</div>
<div class="board-foot">
<p class="note-d">Before 3% GST and making charges. 18K is ${inr(r['18K'])} per gram in ${esc(c.name)}.</p>
<a class="btn btn-gold" href="${ctx.url('/gold-price-calculator/')}">Work out my shop price</a>
</div>
</div>
</div>
<aside class="glance" aria-labelledby="cmp-h">
<svg viewBox="0 0 400 96" aria-hidden="true" style="width: 100%; height: auto">${SKYLINE[c.art] || SKYLINE.city}</svg>
<h2 id="cmp-h">${esc(c.name)} vs India today</h2>
<div class="tbl-box">
<table class="t tdark">
<caption class="sr">${esc(c.name)} and national gold rate per gram on ${longDate(date)}</caption>
<thead><tr><th scope="col">Purity</th><th scope="col">${esc(c.name)}</th><th scope="col">India</th><th scope="col">Difference</th></tr></thead>
<tbody>${cmpRow('24K')}${cmpRow('22K')}${cmpRow('18K')}</tbody>
</table>
</div>
<div class="src-box">
<h3 class="glance-h3">Where this rate comes from</h3>
<dl class="src">
<dt>Source</dt><dd><span class="ph">${esc(c.source)}</span></dd>
<dt>Collected</dt><dd><time datetime="${r.at}">${shortDate(date)}, ${clock(r.at)}</time></dd>
<dt>Checked</dt><dd>Against IBJA AM benchmark, within tolerance</dd>
<dt>Editor</dt><dd><span class="ph">${esc(R.editorNote.by)}</span></dd>
</dl>
<a class="more on-dark" href="${ctx.url('/disclaimer/#rates')}">Read our methodology →</a>
</div>
</aside>
</div>
</section>

<div class="wrap main">
<section aria-labelledby="w-h" class="card stack">
<div class="sec-head"><div><h2 id="w-h" class="h2">${esc(c.name)} gold price by weight</h2><p class="sub">${
    sov ? `${esc(c.name)} shops price jewellery by the ${uName}, which is 8 grams.` : `${esc(c.name)} shops usually quote per 10 grams; one tola is 11.66 grams.`
  }</p></div></div>
<div class="tbl-box">
<table class="t">
<caption>Gold rate in ${esc(c.name)} on ${longDate(date)}, in rupees, before GST</caption>
<thead><tr><th scope="col">Weight</th><th scope="col" class="hl">22K (916)</th><th scope="col">24K (999)</th><th scope="col">18K (750)</th></tr></thead>
<tbody>
${wrows}
</tbody>
</table>
</div>
</section>

<section aria-labelledby="plan-h" class="stack" data-planner>
<div class="sec-head"><div><h2 id="plan-h" class="h2">${sov ? `How many ${c.unit.plural} can I buy?` : 'How much gold can my budget buy?'}</h2><p class="sub">22K jewellery at today's ${esc(c.name)} rate, with your making charge and 3% GST.</p></div></div>
<div class="planner">
<div class="planner-in">
<div class="range">
<div class="range-top"><label class="label" for="c-b">Budget</label><output class="num" for="c-b" data-o-budget>${inr(budget)}</output></div>
<input id="c-b" type="range" min="50000" max="1000000" step="10000" value="${budget}" aria-valuetext="${inr(budget)}" data-budget>
<div class="range-ends num"><span>₹50,000</span><span>₹10,00,000</span></div>
</div>
<div class="range">
<div class="range-top"><label class="label" for="c-m">Making charge</label><output class="num" for="c-m" data-o-making>${mk}%</output></div>
<input id="c-m" type="range" min="0" max="25" step="1" value="${mk}" aria-valuetext="${mk}%" data-making>
<div class="range-ends"><span>0% (coins)</span><span>25% (detailed work)</span></div>
</div>
<p class="hint" style="margin: 0">Ask your jeweller for the exact making charge. Some shops quote wastage or value addition instead.</p>
</div>
<div class="planner-out" aria-live="polite">
<p class="plan-cap">Your budget buys about</p>
<p class="big-out"><b class="num" data-o-count>${bigNum}</b><span>${esc(planLabel)}</span></p>
<div class="coins" aria-hidden="true" data-coins>${coins(count)}</div>
<p class="num plan-detail" data-o-detail>${planDetail}</p>
<a class="btn btn-gold" href="${ctx.url('/gold-price-calculator/')}" style="align-self: flex-start">Get a full bill breakdown</a>
</div>
</div>
</section>

<section aria-labelledby="near-h" class="stack">
<div class="sec-head"><div><h2 id="near-h" class="h2">Gold rate in nearby cities</h2><p class="sub">Each city page uses its own local board.</p></div><a class="more" href="${ctx.url('/gold-rate/')}">All cities →</a></div>
<div class="near">${near}</div>
</section>

<section aria-labelledby="guide-h" class="stack">
<div class="sec-head"><div><h2 id="guide-h" class="h2">Buying gold in ${esc(c.name)}</h2><p class="sub">Three checks before you pay.</p></div></div>
<div class="tools tools-3">
${toolCard(ctx, { art: 'huid', eyebrow: 'Checklist', title: 'Check the HUID before you pay', text: 'Every hallmarked piece carries a six-digit HUID. Check it in the BIS CARE app and make sure it is printed on your bill.' })}
${toolCard(ctx, { art: 'making', eyebrow: 'Explainer', title: 'Making charge and wastage', text: 'Ask for both as separate lines. A 12% making charge on 8 g of 22K adds about ' + inr(r['22K'] * 8 * 0.12) + ' before GST.' })}
${toolCard(ctx, { art: 'lamp', eyebrow: 'Festival', title: R.festival ? `${esc(R.festival.name)}, ${shortDate(R.festival.date)}` : 'Festival buying', text: 'Book a price in advance only with a written receipt, and compare two shops on the same day.' })}
</div>
</section>

<section aria-labelledby="faq-h" class="grid-5-7">
<div class="stack">
<h2 id="faq-h" class="h2">${esc(c.name)} gold rate questions</h2>
<p class="sub">Checked by our editor. Updated <time datetime="${date}">${longDate(date)}</time>.</p>
<div class="help">
<b style="font-size: 17px">Get ${esc(c.name)}'s rate every morning</b>
<p class="sub">One WhatsApp message at 9 AM with the ${sov ? uName : '10 gram'} rate.</p>
<a class="btn btn-dark" href="${ctx.url('/#alerts')}" style="align-self: flex-start">Set up alerts</a>
</div>
</div>
<div>
${faqHtml(faqs)}
</div>
</section>
</div>
</main>`;

  const title = sov
    ? `Gold Rate Today in ${c.name} (${medDate(date)}): 22K and 24K per ${c.unit.label.toLowerCase()}`
    : `Gold Rate Today in ${c.name} (${medDate(date)}): 22K and 24K per 10 grams`;
  const description = `22K gold in ${c.name} is ${inr(r['22K'])} per gram${sov ? ` and ${inr(r['22K'] * 8)} per ${uName}` : ` and ${inr(r['22K'] * 10)} per 10 g`} on ${longDate(date)}. Compare with the national rate, see prices by weight and plan your budget.`;
  return {
    path,
    html: page(ctx, {
      path,
      title,
      description,
      active: 'cities',
      pageId: 'city',
      ticker: [
        { k: `${c.name} 22K`, v: inr(r['22K']), u: (r.chg22 >= 0 ? '▲' : '▼') + Math.abs(r.chg22) },
        { k: '24K', v: inr(r['24K']), u: (r.chg24 >= 0 ? '▲' : '▼') + Math.abs(r.chg24) },
        { k: `${sov ? c.unit.label : '10 g'} 22K`, v: inr(r['22K'] * (sov ? 8 : 10)) },
        { k: 'Silver', v: inr(R.silverPerKg) + '/kg' }
      ],
      main,
      data: { r: { '22K': r['22K'], '24K': r['24K'], chg22: r.chg22, chg24: r.chg24 }, units, planUnit, sov, unitName: uName },
      jsonld: [
        breadcrumbLd(ctx, crumbItems.map((x, i) => (i === crumbItems.length - 1 ? { name: x.name, path } : x))),
        { '@type': 'WebPage', name: title, url: ctx.abs(path), description, dateModified: R.updatedAt, about: { '@type': 'City', name: c.name } },
        faqLd(faqs)
      ]
    })
  };
}

export function citiesHub(ctx) {
  const R = ctx.rates, N = R.national, date = R.date;
  const path = '/gold-rate/';
  const rows = ctx.cities
    .map((c) => {
      const r = R.cities[c.slug];
      const df = cityDiff(r['22K'], N['22K'].g);
      return `<tr><th scope="row"><a href="${ctx.url(`/gold-rate/${c.slug}/`)}">${esc(c.name)}</a></th><td class="num">${inr(r['22K'])}</td><td class="num">${inr(r['24K'])}</td><td class="num">${inr(r['18K'])}</td><td><span class="${df.cls}">${df.text}</span></td></tr>`;
    })
    .join('\n');
  const crumbItems = [{ name: 'Home', path: '/' }, { name: 'Cities' }];
  const main = `<main id="main" class="wrap main" style="padding-top: 20px">
<div class="stack" style="gap: 10px">
${crumbs(ctx, crumbItems)}
<h1 class="title">Gold Rate Today in Indian Cities</h1>
<p class="lead">22K and 24K gold rates for ${ctx.cities.length} cities on <time datetime="${date}">${longDate(date)}</time>, each from its own local board and compared with the national rate of <strong class="num">${inr(N['22K'].g)}</strong> for 22K.</p>
</div>
${cityFinder(ctx, { headingId: 'find-h', heading: 'Find your city' })}
<section aria-labelledby="tbl-h" class="card stack">
<h2 id="tbl-h" class="h2">All cities in one table</h2>
<div class="tbl-box">
<table class="t">
<caption>Gold rate per gram in Indian cities on ${longDate(date)}, before GST</caption>
<thead><tr><th scope="col">City</th><th scope="col" class="hl">22K</th><th scope="col">24K</th><th scope="col">18K</th><th scope="col">vs India (22K)</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</div>
<p class="hint" style="margin: 0">We add a city only when we have a local rate source. <a href="${ctx.url('/grievance-redressal/')}">Ask for your city</a>.</p>
</section>
</main>`;
  const title = `Gold Rate Today in Indian Cities (${medDate(date)}): 22K and 24K`;
  const description = `Today's 22K and 24K gold rate in Chennai, Mumbai, Delhi, Bengaluru, Hyderabad, Kolkata and more, compared with the national rate.`;
  return {
    path,
    html: page(ctx, {
      path, title, description, active: 'cities', pageId: 'hub', main,
      jsonld: [breadcrumbLd(ctx, [{ name: 'Home', path: '/' }, { name: 'Cities', path }]), { '@type': 'CollectionPage', name: title, url: ctx.abs(path), dateModified: R.updatedAt }]
    })
  };
}
