// Merges one day's rates into data/rates.json. Used by the feed (update-rates.mjs) and the GitHub form (manual-rates.mjs).
//
// day = {
//   date: 'YYYY-MM-DD', updatedAt?: ISO time,
//   national: { '24K': n, '22K': n, '18K': n },            per gram, required
//   previous?: { '24K': n, '22K': n, '18K': n },           yesterday's national rates; required when the file still holds sample data
//   silverPerKg?: n, usdInr?: n,
//   ibja24?: n,                                            IBJA 999 per gram (defaults to national 24K)
//   cities?: { slug: { '24K': n, '22K': n, '18K': n, at?: ISO } },   cities with their own local rate today (others show the national rate, labelled)
//   drivers?: [{ label, short, v }], note?: string
// }
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const FILE = fileURLToPath(new URL('../data/rates.json', import.meta.url));
const KEYS = ['24K', '22K', '18K'];
const sane = (n) => typeof n === 'number' && isFinite(n) && n > 1000 && n < 1e6;

export function mergeDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date || '')) throw new Error('date must be YYYY-MM-DD');
  for (const k of KEYS) if (!sane(day.national?.[k])) throw new Error(`national ${k} must be a per-gram price in rupees`);
  if (!(day.national['24K'] > day.national['22K'] && day.national['22K'] > day.national['18K'])) throw new Error('expected 24K > 22K > 18K');

  const old = JSON.parse(readFileSync(FILE, 'utf8'));
  for (const slug of Object.keys(day.cities || {})) if (!old.cities[slug]) throw new Error(`unknown city "${slug}": use one of ${Object.keys(old.cities).join(', ')}`);
  for (const [slug, c] of Object.entries(day.cities || {})) if (!KEYS.every((k) => sane(c[k])) || !(c['24K'] > c['22K'] && c['22K'] > c['18K'])) throw new Error(`${slug}: give 24K/22K/18K per gram, highest first`);
  const fresh = !!old.sample; // first real entry: drop every sample number
  let history = fresh ? [] : old.history.filter((h) => h.date < day.date);
  let prev;
  if (fresh) {
    if (!day.previous || !KEYS.every((k) => sane(day.previous[k]))) throw new Error("the file still holds sample data: also give yesterday's 24K, 22K and 18K rates");
    if (!(day.silverPerKg > 10000 && day.silverPerKg < 1e7)) throw new Error('the file still holds sample data: also give today\'s silver rate per kg');
    const y = new Date(day.date + 'T12:00:00Z'); y.setUTCDate(y.getUTCDate() - 1);
    prev = { date: y.toISOString().slice(0, 10), ...day.previous };
    history = [{ date: prev.date, '24K': prev['24K'], '22K': prev['22K'], '18K': prev['18K'] }];
  } else {
    const last = history.at(-1);
    prev = last ? { '24K': last['24K'], '22K': last['22K'], '18K': last['18K'] ?? old.national['18K'].g } : null;
  }
  const chg = (k) => (prev ? day.national[k] - prev[k] : 0);
  const updatedAt = day.updatedAt || `${day.date}T10:00:00+05:30`;

  const next = {
    sample: false,
    date: day.date,
    updatedAt,
    national: Object.fromEntries(KEYS.map((k) => [k, { g: day.national[k], chg: chg(k) }])),
    silverPerKg: day.silverPerKg ?? old.silverPerKg,  // sample value never survives: required on the first entry
    usdInr: day.usdInr ?? old.usdInr,
    benchmarks: {
      ibja: { label: 'IBJA benchmark', note: '999 purity, excl. GST', g24: day.ibja24 ?? day.national['24K'], at: updatedAt },
      ...(!fresh && old.benchmarks?.mcx ? { mcx: old.benchmarks.mcx } : {}),
      ...(!fresh && old.benchmarks?.board ? { board: old.benchmarks.board } : {})
    },
    drivers: Array.isArray(day.drivers) && day.drivers.length ? day.drivers : [{ label: 'Market move', short: 'Market', v: chg('24K') }],
    editorNote: {
      text: day.note || (chg('24K') === 0 ? '24K gold is unchanged from yesterday.' : `24K gold is ${chg('24K') > 0 ? 'up' : 'down'} ₹${Math.abs(chg('24K')).toLocaleString('en-IN')} per gram from yesterday.`),
      by: 'Daily Gold Rate India', at: updatedAt
    },
    watch: old.watch || [],
    festival: old.festival,
    importDuty: old.importDuty,
    history: [...history, { date: day.date, '24K': day.national['24K'], '22K': day.national['22K'], '18K': day.national['18K'] }].slice(-30),
    cities: {}
  };

  for (const [slug, c] of Object.entries(old.cities)) {
    const own = day.cities?.[slug];
    const r = {};
    if (own && KEYS.every((k) => sane(own[k]))) {
      for (const k of KEYS) r[k] = own[k];
      r.local = true;
      r.at = own.at || updatedAt;
    } else {
      for (const k of KEYS) r[k] = day.national[k]; // no local rate yet: show the national rate, labelled as such
      r.local = false;
      r.at = updatedAt;
    }
    // Yesterday's city rate: on the first real day we only know the national move, so the city moved the same.
    const cityPrev = (k, oldChg) => (fresh ? r[k] - chg(k) : old.date < day.date ? c[k] : c[k] - oldChg);
    r.chg24 = r['24K'] - cityPrev('24K', c.chg24);
    r.chg22 = r['22K'] - cityPrev('22K', c.chg22);
    next.cities[slug] = r;
  }
  writeFileSync(FILE, JSON.stringify(next, null, 2) + '\n');
  return next;
}
