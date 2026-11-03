#!/usr/bin/env node
// Static site build: data/*.json + src/ templates -> dist/ (or dist-flat/ with --flat). No dependencies.
//   node build.mjs                                   local build for http://localhost:4173
//   SITE_URL=https://goldratetrack.com node build.mjs  production build on the real domain
//   SITE_URL=https://user.github.io/repo BASE_PATH=/repo node build.mjs   GitHub Pages review build
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './src/config.mjs';
import { homePage } from './src/pages/home.mjs';
import { caratPage, silverPage, ibjaPage, unitPage, UNITS } from './src/pages/rates.mjs';
import { cityPage, citiesHub } from './src/pages/city.mjs';
import { calculatorPage } from './src/pages/calculator.mjs';
import { monthsOf, monthPage, historyHub } from './src/pages/history.mjs';
import { taHome, taCity } from './src/pages/ta.mjs';
import { aboutPage, contactPage, privacyPage, disclaimerPage, notFoundPage } from './src/pages/info.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const FLAT = process.argv.includes('--flat');
const OUT = join(ROOT, FLAT ? 'dist-flat' : 'dist');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const rates = JSON.parse(read('data/rates.json'));
const cities = JSON.parse(read('data/cities.json'));
validate(rates, cities);

const base = FLAT ? '' : (process.env.BASE_PATH || '').replace(/\/$/, '');
const siteUrl = (process.env.SITE_URL || 'http://localhost:4173').replace(/\/$/, '');
const hash = (p) => createHash('sha256').update(readFileSync(join(ROOT, 'public', p))).digest('hex').slice(0, 10);
const versions = Object.fromEntries(['assets/site.css', 'assets/app.js'].map((p) => [p, hash(p)]));
const flatName = (p) => (p === '/' ? 'index.html' : p.endsWith('.html') ? p.slice(1) : p.replace(/^\/|\/$/g, '').replace(/\//g, '-') + '.html');

const ctx = {
  site, rates, cities, base,
  year: Number(rates.date.slice(0, 4)),
  buildDate: new Date().toISOString().slice(0, 10),
  months: monthsOf(rates.history),
  cityBySlug: (s) => cities.find((c) => c.slug === s),
  url(p) {
    if (p.startsWith('#') || /^(https?:|mailto:)/.test(p)) return p;
    const [pathname, frag] = p.split('#');
    return (FLAT ? flatName(pathname) : base + pathname) + (frag ? '#' + frag : '');
  },
  abs: (p) => siteUrl + p,
  asset: (p) => (FLAT ? '' : base + '/') + p + (versions[p] ? '?v=' + versions[p] : ''),
  webPage(path, name, description, lang = 'en') {
    return {
      '@type': 'WebPage', '@id': siteUrl + path + '#webpage', url: siteUrl + path, name, description,
      inLanguage: lang === 'ta' ? 'ta-IN' : 'en-IN', dateModified: rates.updatedAt,
      isPartOf: { '@type': 'WebSite', '@id': siteUrl + '/#site', name: site.name, url: siteUrl + '/' }
    };
  }
};

// Small per-city snapshot for the "your city" bar (read by app.js on every page).
ctx.citySnapshot = {
  date: rates.date,
  cities: Object.fromEntries(cities.map((c) => {
    const sov = c.unit.id === 'sov';
    return [c.slug, { name: c.name, ta: c.ta ? c.ta.name : null, path: ctx.url(`/gold-rate/${c.slug}/`), taPath: c.ta ? ctx.url(`/ta/${c.slug}/`) : null,
      unit: sov ? `1 ${c.unit.label.toLowerCase()}` : '10 g', grams: sov ? 8 : 10, r22: rates.cities[c.slug]['22K'] }];
  }))
};

const pages = [
  homePage(ctx),
  ...['22K', '24K', '18K'].map((k) => caratPage(ctx, k)),
  silverPage(ctx),
  ibjaPage(ctx),
  ...UNITS.map((u) => unitPage(ctx, u)),
  citiesHub(ctx),
  ...cities.map((c) => cityPage(ctx, c)),
  historyHub(ctx),
  ...ctx.months.map((m, i) => monthPage(ctx, m, i)),
  calculatorPage(ctx),
  taHome(ctx),
  ...cities.filter((c) => c.ta).map((c) => taCity(ctx, c)),
  aboutPage(ctx), contactPage(ctx), privacyPage(ctx), disclaimerPage(ctx),
  notFoundPage(ctx)
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'public'), OUT, { recursive: true });

const seen = new Set();
for (const p of pages) {
  if (seen.has(p.path)) throw new Error('duplicate page path ' + p.path);
  seen.add(p.path);
  const file = FLAT ? flatName(p.path) : p.path.endsWith('.html') ? p.path.slice(1) : join(p.path, 'index.html');
  mkdirSync(dirname(join(OUT, file)), { recursive: true });
  writeFileSync(join(OUT, file), p.html);
}

// Sitemap with hreflang alternates, read back from each page's own <link rel="alternate"> tags.
const indexable = pages.filter((p) => !p.noindex);
const urls = indexable.map((p) => {
  const alts = [...p.html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
    .map((m) => `    <xhtml:link rel="alternate" hreflang="${m[1]}" href="${m[2]}"/>`).join('\n');
  const lastmod = String(p.lastmod || rates.updatedAt).slice(0, 10);
  return `  <url>\n    <loc>${ctx.abs(p.path)}</loc>\n    <lastmod>${lastmod}</lastmod>${alts ? '\n' + alts : ''}\n  </url>`;
}).join('\n');
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ctx.abs('/sitemap.xml')}\n`);
writeFileSync(join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: site.name, short_name: site.shortName, lang: 'en-IN', start_url: ctx.url('/'), scope: (FLAT ? './' : base + '/'),
  display: 'standalone', background_color: '#F3F4F1', theme_color: '#0E1317',
  description: "Today's gold rate in India and your city.",
  icons: [192, 512].map((s) => ({ src: ctx.asset(`icons/icon-${s}.png`), sizes: `${s}x${s}`, type: 'image/png', purpose: 'any' }))
    .concat([{ src: ctx.asset('icons/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' }])
}, null, 2));
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(`Built ${pages.length} pages (${indexable.length} in sitemap) into ${OUT.replace(ROOT + '/', '')}/ for ${siteUrl}${base ? ' (base ' + base + ')' : ''}, ${site.index ? 'indexable' : 'noindex preview'}${site.adsenseClient ? ', ads on' : ', ads off'}`);

function validate(r, cs) {
  const fail = (m) => { console.error('data error: ' + m); process.exit(1); };
  for (const k of ['24K', '22K', '18K']) if (!(r.national?.[k]?.g > 0)) fail(`national.${k}.g missing`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) fail('date must be YYYY-MM-DD');
  if (!Array.isArray(r.history) || r.history.length < 3) fail('history needs at least 3 days');
  const last = r.history.at(-1);
  if (last.date !== r.date) fail(`last history day (${last.date}) must equal date (${r.date})`);
  if (last['24K'] !== r.national['24K'].g || last['22K'] !== r.national['22K'].g) fail('last history day must match national rates');
  for (const c of cs) {
    const x = r.cities[c.slug];
    if (!x) fail(`no rates for city "${c.slug}"`);
    for (const k of ['24K', '22K', '18K']) if (!(x[k] > 0)) fail(`${c.slug}.${k} missing`);
    for (const n of c.near) if (!cs.find((y) => y.slug === n)) fail(`${c.slug} lists unknown nearby city "${n}"`);
  }
  if (!existsSync(join(ROOT, 'public/assets/fonts/inter-var.woff2'))) fail('font file missing');
}
