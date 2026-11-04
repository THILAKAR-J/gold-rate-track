// Post-build checks. Fails the build on any error. Run: node scripts/check.mjs [dist]
// Env: SITE_URL, BASE_PATH (same values as the build), SITE_INDEX.
// Checks: titles, descriptions, canonicals, Open Graph, robots, hreflang, JSON-LD, sitemap, robots.txt, manifest,
// headings, labels, duplicate ids, internal links and anchors, leftover template text, page size.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../' + (process.argv[2] || 'dist') + '/', import.meta.url));
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');
const SITE = (process.env.SITE_URL || 'http://localhost:4173').replace(/\/$/, '');
const RATES = JSON.parse(readFileSync(fileURLToPath(new URL('../data/rates.json', import.meta.url)), 'utf8'));
const SET = process.env.CF_PAGES_BRANCH === 'main' ? 'auto' : process.env.SITE_INDEX || 'auto';
const INDEX = SET === 'true' || (SET === 'auto' && SITE === 'https://dailygoldrateindia.com' && !RATES.sample);
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(ROOT).filter((f) => f.endsWith('.html') && !relative(ROOT, f).startsWith('admin'));
const CONTENT = (() => { try { return JSON.parse(readFileSync(fileURLToPath(new URL('../data/content.json', import.meta.url)), 'utf8')); } catch { return { pages: {} }; } })();
const hidden = (url) => !!CONTENT.pages?.[url.slice(SITE.length)]?.noindex; // pages the owner set to noindex in the admin
const pathOf = (f) => '/' + relative(ROOT, f).replace(/index\.html$/, '');
const errors = [], warnings = [];
const err = (f, m) => errors.push(`${relative(ROOT, f) || f}: ${m}`);
const warn = (f, m) => warnings.push(`${relative(ROOT, f) || f}: ${m}`);
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (h, name, attr = 'name') => { const m = h.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)">`)); return m ? decode(m[1]) : null; };
const len = (s) => [...s].length;

const pages = new Map(); // abs url -> {file, html}
for (const f of files) pages.set(SITE + pathOf(f), { file: f, html: readFileSync(f, 'utf8') });
const ids = new Map([...pages.values()].map((p) => [p.file, new Set([...p.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
const titles = new Map(), descs = new Map();

for (const [url, { file: f, html }] of pages) {
  const is404 = f.endsWith('404.html') || hidden(url);
  // ---- head ----
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!title) err(f, 'missing <title>');
  else {
    const t = decode(title), n = len(t);
    if (n < 20 || n > 78) err(f, `title is ${n} characters: "${t}"`);
    else if (n > 65) warn(f, `title is ${n} characters (may be cut in results): "${t}"`);
    if (!is404) { if (titles.has(t)) err(f, `duplicate title (also ${titles.get(t)})`); titles.set(t, relative(ROOT, f)); }
  }
  const desc = meta(html, 'description');
  if (!desc) err(f, 'missing meta description');
  else {
    const n = len(desc);
    if (n < 70 || n > 175) err(f, `description is ${n} characters`);
    if (!is404) { if (descs.has(desc)) err(f, `duplicate description (also ${descs.get(desc)})`); descs.set(desc, relative(ROOT, f)); }
  }
  const canon = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map((m) => m[1]);
  if (canon.length !== 1) err(f, `${canon.length} canonical tags`);
  else if (canon[0] !== url) err(f, `canonical ${canon[0]} should be ${url}`);
  if (meta(html, 'og:url', 'property') !== canon[0]) err(f, 'og:url does not match canonical');
  if (meta(html, 'og:title', 'property') !== decode(title || '')) err(f, 'og:title does not match title');
  if (!meta(html, 'og:image', 'property')) err(f, 'missing og:image');
  const robots = meta(html, 'robots');
  if (!robots) err(f, 'missing robots meta');
  else if (is404 ? !robots.startsWith('noindex') : INDEX ? !robots.startsWith('index') : !robots.startsWith('noindex')) err(f, `robots "${robots}" does not match SITE_INDEX=${INDEX}`);
  if (!/<meta name="viewport"/.test(html)) err(f, 'missing viewport meta');
  if (!/<html lang="(en|ta)-IN">/.test(html)) err(f, 'html lang missing or unexpected');
  if (Buffer.byteLength(html) > 160 * 1024) warn(f, `HTML is ${Math.round(Buffer.byteLength(html) / 1024)} KB`);

  // ---- hreflang ----
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => ({ lang: m[1], href: m[2] }));
  if (alts.length) {
    const lang = html.match(/<html lang="([^"]+)">/)[1];
    if (!alts.some((a) => a.href === url && a.lang === lang)) err(f, 'hreflang set does not include this page with its own language');
    if (!alts.some((a) => a.lang === 'x-default')) err(f, 'hreflang set has no x-default');
    for (const a of alts) {
      const other = pages.get(a.href);
      if (!other) { err(f, `hreflang ${a.lang} points to missing page ${a.href}`); continue; }
      if (a.lang !== 'x-default' && !other.html.includes(`hreflang="${a.lang}" href="${a.href}"`)) err(f, `hreflang ${a.lang} target does not list itself`);
      if (a.lang !== 'x-default' && !other.html.includes(`href="${url}"`)) err(f, `hreflang ${a.lang} target does not link back`);
    }
  }

  // ---- JSON-LD ----
  const faqVisible = [...html.matchAll(/<details class="faq"[^>]*><summary>([^<]*)</g)].map((m) => decode(m[1]));
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let g;
    try { g = JSON.parse(m[1]); } catch (e) { err(f, 'bad JSON-LD: ' + e.message); continue; }
    if (g['@context'] !== 'https://schema.org') err(f, 'JSON-LD @context should be https://schema.org');
    for (const n of g['@graph'] || [g]) {
      const T = n['@type'];
      if (T === 'BreadcrumbList') {
        n.itemListElement.forEach((it, i) => {
          if (it.position !== i + 1) err(f, 'breadcrumb positions out of order');
          if (!pages.has(it.item)) err(f, `breadcrumb item ${it.item} is not a page`);
        });
        if (n.itemListElement.at(-1).item !== url) err(f, 'last breadcrumb is not this page');
      } else if (T === 'FAQPage') {
        const q = n.mainEntity.map((x) => x.name);
        if (q.length !== faqVisible.length || q.some((x, i) => x !== faqVisible[i])) err(f, 'FAQPage questions do not match the visible FAQ');
        if (n.mainEntity.some((x) => !x.acceptedAnswer?.text)) err(f, 'FAQ answer missing');
      } else if (T === 'WebPage' || T === 'CollectionPage') {
        if (n.url !== url) err(f, `WebPage url ${n.url} should be ${url}`);
        if (!n.name || !n.description) err(f, 'WebPage needs name and description');
        if (n.dateModified && isNaN(Date.parse(n.dateModified))) err(f, 'WebPage dateModified is not a date');
      } else if (T === 'Dataset') {
        for (const k of ['name', 'description', 'url', 'temporalCoverage']) if (!n[k]) err(f, `Dataset missing ${k}`);
      } else if (T === 'Organization') {
        if (!n.logo || !pages.has(n.url)) err(f, 'Organization needs logo and a valid url');
        const logo = n.logo.replace(SITE, '');
        if (!existsSync(join(ROOT, logo))) err(f, `Organization logo ${logo} not found`);
      } else if (T === 'ItemList') {
        for (const it of n.itemListElement) if (!pages.has(it.url)) err(f, `ItemList url ${it.url} is not a page`);
      } else if (!['WebSite', 'WebApplication'].includes(T)) warn(f, `unchecked JSON-LD type ${T}`);
    }
  }
  if (!is404 && !/"@type":"BreadcrumbList"/.test(html) && url !== SITE + '/' && !url.endsWith('/ta/')) err(f, 'missing BreadcrumbList');
  if (faqVisible.length && !/"@type":"FAQPage"/.test(html)) err(f, 'visible FAQ without FAQPage schema');

  // ---- body ----
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(f, `${h1} <h1> elements`);
  let prev = 1;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) { const l = Number(m[1]); if (l > prev + 1) err(f, `heading skips h${prev} to h${l}`); prev = l; }
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, '');
  if (/@@|\{\{|undefined|NaN|\[object|Infinity/.test(visible)) err(f, 'template marker, undefined, NaN or Infinity in the page');
  if (/href="#"/.test(html)) err(f, 'empty href="#"');
  const all = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = all.filter((x, i) => all.indexOf(x) !== i);
  if (dup.length) err(f, 'duplicate ids: ' + [...new Set(dup)].join(', '));
  for (const m of html.matchAll(/<(input|textarea|select)\b([^>]*)>/g)) {
    const a = m[2];
    if (/type="(hidden|submit|button)"/.test(a)) continue;
    const id = (a.match(/\sid="([^"]+)"/) || [])[1];
    const before = html.slice(Math.max(0, m.index - 400), m.index);
    if (!/<label[^>]*>(?:(?!<\/label>)[\s\S])*$/.test(before) && !(id && html.includes(`for="${id}"`)) && !/aria-label=/.test(a)) err(f, `unlabelled <${m[1]}> ${id || ''}`);
  }
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(mailto:|tel:|data:)/.test(u)) continue;
    if (/^https?:/.test(u)) { if (!u.startsWith(SITE)) continue; }
    const local = u.startsWith(SITE) ? u.slice(SITE.length) || '/' : u;
    const [pq, frag] = local.split('#');
    const p = pq.split('?')[0];
    let target;
    if (p === '') target = f;
    else if (p.startsWith('/')) {
      if (BASE && !u.startsWith(SITE) && !p.startsWith(BASE)) { err(f, `link outside base path: ${u}`); continue; }
      target = join(ROOT, u.startsWith(SITE) ? p : p.slice(BASE.length));
    } else target = join(dirname(f), p);
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) { err(f, `broken link: ${u}`); continue; }
    if (frag && target.endsWith('.html') && !ids.get(target)?.has(frag)) err(f, `missing anchor: ${u}`);
  }
}

// ---- sitemap.xml ----
const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const smErr = (m) => errors.push('sitemap.xml: ' + m);
if (new Set(locs).size !== locs.length) smErr('duplicate <loc>');
for (const l of locs) {
  const p = pages.get(l);
  if (!p) smErr(`${l} is not a built page`);
  else if (/<meta name="robots" content="noindex/.test(p.html) && INDEX) smErr(`${l} is noindex but listed`);
}
for (const [url, p] of pages) if (!p.file.endsWith('404.html') && !hidden(url) && !locs.includes(url)) smErr(`${url} missing from sitemap`);
for (const m of sm.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) if (!/^\d{4}-\d{2}-\d{2}$/.test(m[1])) smErr(`bad lastmod ${m[1]}`);
for (const m of sm.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = m[1].match(/<loc>([^<]+)/)[1];
  const smAlts = [...m[1].matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((x) => x[1] + ' ' + x[2]).sort().join('|');
  const pgAlts = [...(pages.get(loc)?.html || '').matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((x) => x[1] + ' ' + x[2]).sort().join('|');
  if (smAlts !== pgAlts) smErr(`hreflang for ${loc} differs from the page`);
}

// ---- robots.txt and manifest ----
const robotsTxt = readFileSync(join(ROOT, 'robots.txt'), 'utf8');
if (!robotsTxt.includes(`Sitemap: ${SITE}/sitemap.xml`)) errors.push('robots.txt: Sitemap line missing or wrong');
if (/Disallow: \/\s*$/m.test(robotsTxt)) errors.push('robots.txt blocks the whole site');
const man = JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8'));
for (const i of man.icons) if (!existsSync(join(ROOT, i.src.split('?')[0].slice(BASE.length)))) errors.push(`manifest icon ${i.src} not found`);

console.log(`Checked ${pages.size} pages and ${locs.length} sitemap URLs for ${SITE}.`);
if (warnings.length) console.log('Warnings:\n  ' + warnings.join('\n  '));
if (errors.length) { console.error('Errors:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('All checks passed.');
