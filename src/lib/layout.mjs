// Page shell: <head>, ticker, header, footer, phone tab bar and cookie banner.
import { esc, inr } from './format.mjs';

export const LOGO = `<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect x="1" y="1" width="32" height="32" rx="9" fill="#12161A"/><path d="M9 23 L12 12 H22 L25 23 Z" fill="#E8B64C"/><path d="M12 12 L14 9 H20 L22 12" fill="none" stroke="#E8B64C" stroke-width="1.6"/></svg>`;

const ICON = {
  rates: '<path d="M5 18 L8 8 H16 L19 18 Z"/>',
  cities: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
};
const icon = (k) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

/** Breadcrumb trail, rendered as nav > ol. items: [{name, path?}] (last item is the current page). */
export function crumbs(ctx, items) {
  const li = items
    .map((it, i) =>
      i === items.length - 1
        ? `<li aria-current="page">${esc(it.name)}</li>`
        : `<li><a href="${ctx.url(it.path)}">${esc(it.name)}</a></li><li aria-hidden="true">›</li>`
    )
    .join('');
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${li}</ol></nav>`;
}

export function breadcrumbLd(ctx, items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.path ? { item: ctx.abs(it.path) } : {})
    }))
  };
}

function ticker(ctx, items) {
  if (!items) return '';
  const li = items
    .map((t) => `<li><span>${esc(t.k)}</span> <b class="num">${esc(t.v)}</b>${t.u ? ` <span class="u num">${esc(t.u)}</span>` : ''}</li>`)
    .join('');
  return `<div class="ticker" role="region" aria-label="Today's rates at a glance"><div class="wrap"><ul>${li}</ul><div class="meta">${
    ctx.rates.sample ? '<span class="tag-sample">Sample rates</span>' : ''
  }</div></div></div>`;
}

export function defaultTicker(ctx) {
  const n = ctx.rates.national;
  return [
    { k: '24K', v: inr(n['24K'].g), u: (n['24K'].chg >= 0 ? '▲' : '▼') + Math.abs(n['24K'].chg) },
    { k: '22K', v: inr(n['22K'].g), u: (n['22K'].chg >= 0 ? '▲' : '▼') + Math.abs(n['22K'].chg) },
    { k: '18K', v: inr(n['18K'].g), u: (n['18K'].chg >= 0 ? '▲' : '▼') + Math.abs(n['18K'].chg) },
    { k: 'Silver', v: inr(ctx.rates.silverPerKg) + '/kg' },
    { k: 'USD/INR', v: '₹' + ctx.rates.usdInr.toFixed(2) }
  ];
}

const NAV = [
  { id: 'home', name: 'Gold rate', path: '/' },
  { id: 'cities', name: 'Cities', path: '/gold-rate/' },
  { id: 'calc', name: 'Calculator', path: '/gold-price-calculator/' },
  { id: 'contact', name: 'Contact', path: '/grievance-redressal/' }
];

function header(ctx, active) {
  const links = NAV.map(
    (n) => `<a href="${ctx.url(n.path)}"${n.id === active ? ' aria-current="page"' : ''}>${n.name}</a>`
  ).join('');
  return `<header class="hdr"><div class="wrap">
<a class="logo" href="${ctx.url('/')}" aria-label="${esc(ctx.site.name)}, home">${LOGO}<span>${esc(ctx.site.name)}</span></a>
<nav id="site-nav" class="nav" aria-label="Main">${links}</nav>
<button type="button" class="menu-btn" aria-controls="site-nav" aria-expanded="false" aria-label="Menu" data-menu><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#12161A" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
<a class="btn btn-dark cta" href="${ctx.url('/#alerts')}">Get rate alerts</a>
</div></header>`;
}

function footer(ctx) {
  const a = (path, name) => `<a href="${ctx.url(path)}">${name}</a>`;
  const city = (slug) => {
    const c = ctx.cities.find((x) => x.slug === slug);
    return a(`/gold-rate/${slug}/`, c.name);
  };
  return `<footer class="foot">
<div class="wrap foot-cols">
<nav aria-labelledby="f1"><h2 id="f1">Rates</h2>${a('/', 'Gold rate today')}${a('/#weights-h', 'Price by weight')}${a('/#trend-h', 'Last 10 days')}${a('/gold-rate/', 'All cities')}</nav>
<nav aria-labelledby="f2"><h2 id="f2">Cities</h2>${['chennai', 'mumbai', 'delhi', 'bengaluru', 'hyderabad'].map(city).join('')}</nav>
<nav aria-labelledby="f3"><h2 id="f3">Tools</h2>${a('/gold-price-calculator/', 'Price calculator')}${a('/gold-rate/chennai/#plan-h', 'Sovereign planner')}${a('/#alerts', 'Rate alerts')}</nav>
<nav aria-labelledby="f4"><h2 id="f4">${esc(ctx.site.name)}</h2>${a('/disclaimer/#rates', 'How we source rates')}${a('/disclaimer/#editorial', 'Editorial policy')}${a('/disclaimer/#corrections', 'Corrections')}${a('/grievance-redressal/', 'Contact')}</nav>
<nav aria-labelledby="f5"><h2 id="f5">Legal</h2>${a('/privacy-policy/', 'Privacy Policy')}${a('/terms-of-use/', 'Terms of Use')}${a('/disclaimer/', 'Disclaimer')}${a('/grievance-redressal/', 'Grievance redressal')}<button type="button" class="linkbtn" data-cookie-open>Cookie settings</button></nav>
</div>
<div class="wrap foot-base">
<p>Rates are indicative and exclude GST, making charges and other levies. They are information, not investment advice. ${esc(ctx.site.name)} is not affiliated with IBJA, MCX or any jeweller. <a href="${ctx.url('/disclaimer/')}">Read the full disclaimer</a>.</p>
<p>© ${ctx.year} <span class="ph">${esc(ctx.site.legalName)}</span></p>
</div>
</footer>`;
}

function tabbar(ctx, active) {
  const t = (id, path, ic, name) =>
    `<a href="${ctx.url(path)}"${id === active ? ' aria-current="page"' : ''}>${icon(ic)}${name}</a>`;
  return `<nav class="tabbar" aria-label="Quick links">${t('home', '/', 'rates', 'Rates')}${t('cities', '/gold-rate/', 'cities', 'Cities')}${t(
    'calc',
    '/gold-price-calculator/',
    'calc',
    'Calculate'
  )}${t('alerts', '/#alerts', 'bell', 'Alerts')}</nav>`;
}

function cookie(ctx) {
  return `<div class="cookie" role="region" aria-label="Cookie choices" data-cookie hidden>
<div class="cookie-box">
<div class="cookie-row">
<div class="cookie-txt"><b>Your choice on cookies</b><p>Essential cookies run this site. Analytics and advertising cookies stay off unless you allow them. Change this any time from Cookie settings in the footer. <a href="${ctx.url(
    '/privacy-policy/#cookies'
  )}">How we use cookies</a></p></div>
<div class="cookie-acts">
<button type="button" class="btn btn-line" data-cookie-act="reject">Reject all</button>
<button type="button" class="btn btn-line" data-cookie-act="custom" aria-expanded="false" aria-controls="cookie-prefs">Customise</button>
<button type="button" class="btn btn-line" data-cookie-act="accept">Accept all</button>
</div>
</div>
<fieldset class="cookie-prefs" id="cookie-prefs" hidden>
<legend class="sr">Cookie categories</legend>
<label class="consent"><input type="checkbox" checked disabled><span><b>Essential</b> · always on. Security and remembering this choice.</span></label>
<label class="consent"><input type="checkbox" data-pref="analytics"><span><b>Analytics</b>. Counts visits so we can improve the site.</span></label>
<label class="consent"><input type="checkbox" data-pref="ads"><span><b>Advertising</b>. Lets ad partners show and measure ads.</span></label>
<button type="button" class="btn btn-dark" data-cookie-act="save">Save choices</button>
</fieldset>
</div>
</div>`;
}

/**
 * Full HTML document.
 * opts: { path, title, description, active, main (html), jsonld (array), ticker (array|null),
 *         pageId, data (object for app.js), noindex, ogType }
 */
export function page(ctx, o) {
  const canonical = ctx.abs(o.path);
  const robots = o.noindex || !ctx.site.index ? 'noindex,follow' : 'index,follow,max-image-preview:large';
  const ld = o.jsonld && o.jsonld.length
    ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': o.jsonld }).replace(/</g, '\\u003c')}</script>`
    : '';
  const data = o.data ? `<script type="application/json" id="page-data">${JSON.stringify(o.data).replace(/</g, '\\u003c')}</script>` : '';
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#0E1317">
<link rel="icon" href="${ctx.asset('favicon.svg')}" type="image/svg+xml">
<link rel="preload" href="${ctx.asset('assets/fonts/inter-var.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${ctx.asset('assets/kanak.css')}">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="${esc(ctx.site.name)}">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ctx.abs('/og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${ld}
<script src="${ctx.asset('assets/app.js')}" defer></script>
</head>
<body data-page="${o.pageId}" data-base="${ctx.base}">
<div class="page">
<a class="skip" href="#main">Skip to main content</a>
${ticker(ctx, o.ticker === undefined ? defaultTicker(ctx) : o.ticker)}
${header(ctx, o.active)}
${o.main}
${footer(ctx)}
${tabbar(ctx, o.active)}
${cookie(ctx)}
</div>
${data}
</body>
</html>
`;
}

/** Replace @@/path#frag@@ placeholders (used in static content files) with real URLs. */
export const linkify = (ctx, html) => html.replace(/@@([^@]+)@@/g, (_, p) => ctx.url(p));
