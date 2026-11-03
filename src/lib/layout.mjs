// Page shell: <head> with all SEO tags, header, footer and phone tab bar.
import { esc } from './format.mjs';

export const LOGO = `<svg width="32" height="32" viewBox="0 0 34 34" aria-hidden="true"><rect x="1" y="1" width="32" height="32" rx="9" fill="#12161A"/><path d="M9 23 L12 12 H22 L25 23 Z" fill="#E8B64C"/><path d="M6 27 H28" stroke="#E8B64C" stroke-width="1.6" stroke-linecap="round"/></svg>`;

const ICON = {
  today: '<path d="M5 18 L8 8 H16 L19 18 Z"/>',
  cities: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  history: '<path d="M4 19 L9 12 L13 15 L20 6"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'
};
export const icon = (k, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

/** Breadcrumb trail as nav > ol. items: [{name, path?}], the last item is the current page. */
export function crumbs(ctx, items, { light = false, label = 'Breadcrumb' } = {}) {
  const li = items
    .map((it, i) =>
      i === items.length - 1
        ? `<li aria-current="page">${esc(it.name)}</li>`
        : (it.path ? `<li><a href="${ctx.url(it.path)}">${esc(it.name)}</a></li>` : `<li>${esc(it.name)}</li>`) + '<li aria-hidden="true">›</li>'
    )
    .join('');
  return `<nav class="crumbs${light ? ' light' : ''}" aria-label="${esc(label)}"><ol>${li}</ol></nav>`;
}

/** BreadcrumbList for the same trail; steps without their own page are left out. */
export function breadcrumbLd(ctx, items, selfPath) {
  const steps = items
    .map((it, i) => (i === items.length - 1 ? { name: it.name, path: selfPath } : it))
    .filter((it) => it.path);
  return {
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: ctx.abs(it.path) }))
  };
}

const NAV_EN = [
  { id: 'home', name: "Today's rate", path: '/' },
  { id: 'cities', name: 'Cities', path: '/gold-rate/' },
  { id: '22k', name: '22 carat', path: '/22-carat-gold-rate/' },
  { id: '24k', name: '24 carat', path: '/24-carat-gold-rate/' },
  { id: 'silver', name: 'Silver', path: '/silver-rate-today/' },
  { id: 'history', name: 'History', path: '/gold-rate-history/' },
  { id: 'calc', name: 'Calculator', path: '/gold-price-calculator/' }
];
const NAV_TA = [
  { id: 'home', name: 'இன்றைய விலை', path: '/ta/' },
  { id: 'cities', name: 'சென்னை', path: '/ta/chennai/' }
];

function header(ctx, o) {
  const nav = (o.lang === 'ta' ? NAV_TA : NAV_EN)
    .map((n) => `<a href="${ctx.url(n.path)}"${n.id === o.active ? ' aria-current="page"' : ''}>${esc(n.name)}</a>`)
    .join('');
  const other = !ctx.site.tamil ? '' : o.lang === 'ta'
    ? `<a class="lang-btn" href="${ctx.url(o.altPath || '/')}" lang="en" hreflang="en">${icon('globe', 16)}English</a>`
    : `<a class="lang-btn" href="${ctx.url(o.altPath || '/ta/')}" lang="ta" hreflang="ta">${icon('globe', 16)}தமிழ்</a>`;
  return `<header class="hdr"><div class="wrap">
<a class="logo" href="${ctx.url(o.lang === 'ta' ? '/ta/' : '/')}" aria-label="${esc(ctx.site.name)}, ${o.lang === 'ta' ? 'முகப்பு' : 'home'}">${LOGO}<span>DailyGoldRate<em>India</em></span></a>
<nav id="site-nav" class="nav" aria-label="${o.lang === 'ta' ? 'முதன்மை' : 'Main'}">${nav}</nav>
${other}
<button type="button" class="menu-btn" aria-controls="site-nav" aria-expanded="false" aria-label="${o.lang === 'ta' ? 'பட்டியல்' : 'Menu'}" data-menu><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#12161A" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
</div></header>`;
}

function footerEn(ctx) {
  const a = (p, n, lang) => `<a href="${ctx.url(p)}"${lang ? ` lang="${lang}" hreflang="${lang}"` : ''}>${n}</a>`;
  const top = ['chennai', 'hyderabad', 'bengaluru', 'kerala', 'mumbai', 'delhi'].map((s) => a(`/gold-rate/${s}/`, esc(ctx.cityBySlug(s).name))).join('');
  const months = ctx.months.slice(-2).reverse().map((m) => a(m.path, `${m.label}`)).join('');
  return `<footer class="foot">
<div class="wrap foot-cols">
<nav aria-labelledby="fa"><h2 id="fa">Gold rates</h2>${a('/', 'Gold rate today')}${a('/22-carat-gold-rate/', '22 carat gold rate')}${a('/24-carat-gold-rate/', '24 carat gold rate')}${a('/18-carat-gold-rate/', '18 carat gold rate')}${a('/silver-rate-today/', 'Silver rate today')}${a('/ibja-gold-rate/', 'IBJA gold rate')}</nav>
<nav aria-labelledby="fb"><h2 id="fb">By weight</h2>${a('/1-gram-gold-rate/', '1 gram gold rate')}${a('/1-pavan-gold-rate/', '1 pavan gold rate')}${a('/10-gram-gold-rate/', '10 gram gold rate')}${a('/1-tola-gold-rate/', '1 tola gold rate')}${a('/gold-price-calculator/', 'Gold price calculator')}</nav>
<nav aria-labelledby="fc"><h2 id="fc">Top cities</h2>${top}</nav>
${ctx.site.tamil ? `<nav aria-labelledby="fd"><h2 id="fd">Languages</h2>${a('/ta/', 'தமிழ்', 'ta')}${a('/ta/chennai/', 'சென்னை தங்கம் விலை', 'ta')}</nav>\n` : ''}<nav aria-labelledby="fe"><h2 id="fe">History</h2>${months}${a('/gold-rate-history/', 'All history')}</nav>
</div>
<div class="wrap foot-base">
<p>Rates are indicative, before GST and making charges, and are not investment advice. © ${ctx.year} ${esc(ctx.site.name)}.</p>
<nav class="foot-legal" aria-label="Site information">${a('/privacy-policy/', 'Privacy Policy')}${a('/disclaimer/', 'Disclaimer')}</nav>
</div>
</footer>`;
}

function footerTa(ctx) {
  const a = (p, n, lang) => `<a href="${ctx.url(p)}"${lang ? ` lang="${lang}" hreflang="${lang}"` : ''}>${n}</a>`;
  return `<footer class="foot">
<div class="wrap foot-cols">
<nav aria-labelledby="fa"><h2 id="fa">தங்கம் விலை</h2>${a('/ta/', 'இன்றைய தங்கம் விலை')}${a('/ta/chennai/', 'சென்னை தங்கம் விலை')}</nav>
<nav aria-labelledby="fb"><h2 id="fb">English</h2>${a('/', 'Gold rate today', 'en')}${a('/gold-rate/chennai/', 'Gold rate in Chennai', 'en')}${a('/22-carat-gold-rate/', '22 carat gold rate', 'en')}</nav>
</div>
<div class="wrap foot-base">
<p>விலைகள் தோராயமானவை. GST, செய்கூலி சேர்க்கப்படவில்லை. இது முதலீட்டு ஆலோசனை அல்ல. © ${ctx.year} ${esc(ctx.site.name)}.</p>
<nav class="foot-legal" aria-label="தள தகவல்">${a('/about/', 'About', 'en')}${a('/contact/', 'Contact', 'en')}${a('/privacy-policy/', 'Privacy Policy', 'en')}${a('/disclaimer/', 'Disclaimer', 'en')}</nav>
</div>
</footer>`;
}

function tabbar(ctx, o) {
  const items = o.lang === 'ta'
    ? [['home', '/ta/', 'today', 'இன்று'], ['cities', '/ta/chennai/', 'cities', 'சென்னை'], ['en', '/', 'globe', 'English']]
    : [['home', '/', 'today', 'Today'], ['cities', '/gold-rate/', 'cities', 'Cities'], ['history', '/gold-rate-history/', 'history', 'History'], ['calc', '/gold-price-calculator/', 'calc', 'Calculator']];
  return `<nav class="tabbar" aria-label="${o.lang === 'ta' ? 'விரைவு இணைப்புகள்' : 'Quick links'}">${items
    .map(([id, p, ic, n]) => `<a href="${ctx.url(p)}"${id === o.active ? ' aria-current="page"' : ''}>${icon(ic)}${esc(n)}</a>`)
    .join('')}</nav>`;
}

/** An ad slot. Renders nothing until ADSENSE_CLIENT is set, so there are no empty boxes at launch. */
export function adSlot(ctx, kind) {
  if (!ctx.site.adsenseClient) return '';
  const h = { lb: 90, mr: 250, sky: 600 }[kind] || 250;
  return `<div class="ad ad-${kind}" style="min-height:${h}px"><ins class="adsbygoogle" style="display:block;min-height:${h}px" data-ad-client="${esc(ctx.site.adsenseClient)}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
}

/**
 * Full HTML document.
 * o: { path, lang ('en'|'ta'), title, description, active, main, jsonld[], pageId, data, noindex,
 *      alternates: [{lang:'en-IN'|'ta-IN', path}], altPath (the other language's page), ogType }
 */
export function page(ctx, o) {
  const lang = o.lang || 'en';
  const canonical = ctx.abs(o.path);
  const robots = o.noindex || !ctx.site.index ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1';
  const alts = o.alternates && o.alternates.length > 1
    ? o.alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${ctx.abs(a.path)}">`).join('\n') +
      `\n<link rel="alternate" hreflang="x-default" href="${ctx.abs((o.alternates.find((a) => a.lang.startsWith('en')) || o.alternates[0]).path)}">`
    : '';
  const ld = o.jsonld && o.jsonld.length
    ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': o.jsonld }).replace(/</g, '\\u003c')}</script>`
    : '';
  const data = o.data ? `<script type="application/json" id="page-data">${JSON.stringify(o.data).replace(/</g, '\\u003c')}</script>` : '';
  const tamilFont = lang === 'ta'
    ? '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400..800&display=swap">\n'
    : '';
  const ads = ctx.site.adsenseClient
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ctx.site.adsenseClient)}" crossorigin="anonymous"></script>\n`
    : '';
  return `<!doctype html>
<html lang="${lang === 'ta' ? 'ta-IN' : 'en-IN'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}">
${alts}
<meta name="theme-color" content="#0E1317">
<link rel="icon" href="${ctx.asset('favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${ctx.asset('icons/icon-180.png')}">
<link rel="manifest" href="${ctx.asset('manifest.webmanifest')}">
<link rel="preload" href="${ctx.asset('assets/fonts/inter-var.woff2')}" as="font" type="font/woff2" crossorigin>
${tamilFont}<link rel="stylesheet" href="${ctx.asset('assets/site.css')}">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="${esc(ctx.site.name)}">
<meta property="og:locale" content="${lang === 'ta' ? 'ta_IN' : 'en_IN'}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ctx.abs('/og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(ctx.site.name)}: gold rate today, city by city">
<meta name="twitter:card" content="summary_large_image">
${ld}
${ads}<script src="${ctx.asset('assets/app.js')}" defer></script>
</head>
<body data-page="${o.pageId}"${lang === 'ta' ? ' class="ta"' : ''}>
<div class="page">
<a class="skip" href="#main">${lang === 'ta' ? 'உள்ளடக்கத்திற்குச் செல்லவும்' : 'Skip to main content'}</a>
${header(ctx, { ...o, lang })}
${o.main}
${lang === 'ta' ? footerTa(ctx) : footerEn(ctx)}
${tabbar(ctx, { ...o, lang })}
</div>
${data}
<script type="application/json" id="city-data">${JSON.stringify(ctx.citySnapshot).replace(/</g, '\\u003c')}</script>
</body>
</html>
`;
}

/** Replace @@/path#frag@@ placeholders (used in static content files) with real URLs. */
export const linkify = (ctx, html) => html.replace(/@@([^@]+)@@/g, (_, p) => ctx.url(p));
