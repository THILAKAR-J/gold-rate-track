// Post-build checks: internal links and anchors resolve, one H1, no heading skips,
// valid JSON-LD, unique ids, every input labelled, no leftover template markers.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../' + (process.argv[2] || 'dist') + '/', import.meta.url));
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const pages = walk(ROOT).filter((f) => f.endsWith('.html'));
const ids = new Map(pages.map((f) => [f, new Set([...readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
const errors = [];
const err = (f, m) => errors.push(`${relative(ROOT, f)}: ${m}`);

for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(f, `${h1} <h1> elements`);
  let prev = 1;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const lvl = Number(m[1]);
    if (lvl > prev + 1) err(f, `heading skips from h${prev} to h${lvl}`);
    prev = lvl;
  }
  if (/@@|\{\{|undefined|NaN|\[object/.test(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ''))) err(f, 'template marker, undefined or NaN in output');
  if (/href="#"/.test(html)) err(f, 'empty href="#"');
  const all = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = all.filter((x, i) => all.indexOf(x) !== i);
  if (dup.length) err(f, 'duplicate ids: ' + [...new Set(dup)].join(', '));
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { err(f, 'bad JSON-LD: ' + e.message); }
  }
  for (const m of html.matchAll(/<(input|textarea|select)\b([^>]*)>/g)) {
    const attrs = m[2];
    if (/type="(hidden|submit|button)"/.test(attrs)) continue;
    const id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
    const before = html.slice(Math.max(0, m.index - 400), m.index);
    const wrapped = /<label[^>]*>(?:(?!<\/label>)[\s\S])*$/.test(before);
    if (!wrapped && !(id && html.includes(`for="${id}"`)) && !/aria-label=/.test(attrs)) err(f, `unlabelled <${m[1]}> ${id || ''}`);
  }
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let u = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(u)) continue;
    const [pathq, frag] = u.split('#');
    const path = pathq.split('?')[0];
    let target;
    if (path === '') target = f;
    else if (path.startsWith('/')) {
      if (BASE && !path.startsWith(BASE)) { err(f, `link outside base: ${u}`); continue; }
      target = join(ROOT, path.slice(BASE.length));
    } else target = join(dirname(f), path);
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) { err(f, `broken link: ${u}`); continue; }
    if (frag && target.endsWith('.html') && !ids.get(target)?.has(frag)) err(f, `missing anchor: ${u}`);
  }
}
console.log(`Checked ${pages.length} pages.`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('All checks passed.');
