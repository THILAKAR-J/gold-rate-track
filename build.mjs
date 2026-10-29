#!/usr/bin/env node
// Static site build: data/*.json + src/ templates -> dist/ (or dist-flat/ with --flat).
// No dependencies. Usage:
//   node build.mjs                 build for http://localhost:4173 (base "/")
//   SITE_URL=https://example.com BASE_PATH=/repo node build.mjs
//   node build.mjs --flat          single-folder build with relative links (for previews)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './src/config.mjs';
import { homePage } from './src/pages/home.mjs';
import { cityPage, citiesHub } from './src/pages/city.mjs';
import { calculatorPage } from './src/pages/calculator.mjs';
import { LEGAL, legalPage, notFoundPage } from './src/pages/legal.mjs';

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
const versions = { 'assets/kanak.css': hash('assets/kanak.css'), 'assets/app.js': hash('assets/app.js') };

const flatName = (pathname) => {
  if (pathname === '/' || pathname === '') return 'index.html';
  if (pathname.endsWith('.html')) return pathname.replace(/^\//, '');
  return pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') + '.html';
};

const ctx = {
  site,
  rates,
  cities,
  base,
  year: new Date(rates.date).getFullYear(),
  url(p) {
    if (p.startsWith('#') || /^https?:/.test(p)) return p;
    const [pathname, frag] = p.split('#');
    const h = frag ? '#' + frag : '';
    return FLAT ? flatName(pathname) + h : base + pathname + h;
  },
  abs: (p) => siteUrl + (p === '/' ? '/' : p),
  asset: (p) => (FLAT ? '' : base + '/') + p + (versions[p] ? '?v=' + versions[p] : '')
};

const pages = [
  homePage(ctx),
  citiesHub(ctx),
  ...cities.map((c) => cityPage(ctx, c)),
  calculatorPage(ctx),
  ...LEGAL.map((L) => legalPage(ctx, L)),
  notFoundPage(ctx)
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'public'), OUT, { recursive: true });

for (const p of pages) {
  const file = FLAT ? flatName(p.path) : p.path.endsWith('.html') ? p.path.slice(1) : join(p.path, 'index.html');
  const dest = join(OUT, file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, p.html);
}

// sitemap.xml and robots.txt
const today = new Date().toISOString().slice(0, 10);
const ratePaths = new Set(['/', '/gold-rate/', ...cities.map((c) => `/gold-rate/${c.slug}/`), '/gold-price-calculator/']);
const urls = pages
  .filter((p) => p.path !== '/404.html')
  .map((p) => `  <url><loc>${ctx.abs(p.path)}</loc><lastmod>${ratePaths.has(p.path) ? rates.date : today}</lastmod></url>`)
  .join('\n');
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ctx.abs('/sitemap.xml')}\n`);
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(`Built ${pages.length} pages into ${OUT.replace(ROOT + '/', '')}/ (base "${base || '/'}", ${site.index ? 'indexable' : 'noindex preview'})`);

function validate(r, cs) {
  const fail = (m) => { console.error('data error: ' + m); process.exit(1); };
  for (const k of ['24K', '22K', '18K']) if (!(r.national?.[k]?.g > 0)) fail(`national.${k}.g missing`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) fail('date must be YYYY-MM-DD');
  if (!Array.isArray(r.history) || r.history.length < 3) fail('history needs at least 3 days');
  const last = r.history[r.history.length - 1];
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
