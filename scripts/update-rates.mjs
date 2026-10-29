#!/usr/bin/env node
// Daily rate update. Reads a JSON feed (RATES_FEED_URL) and merges it into data/rates.json.
// With no feed configured it does nothing, so the scheduled build simply republishes the site.
//
// Expected feed shape (only "date" and "national" are required; prices are rupees per gram):
// {
//   "date": "2026-10-28", "updatedAt": "2026-10-28T12:10:00+05:30",
//   "national": { "24K": 14400, "22K": 13200, "18K": 10800 },
//   "cities": { "chennai": { "24K": 14400, "22K": 13200, "18K": 10795, "at": "2026-10-28T09:30:00+05:30" } },
//   "silverPerKg": 221000, "usdInr": 95.2,
//   "benchmarks": { "ibja": { "g24": 14290, "at": "..." }, "mcx": { "g24": 14350, "at": "..." }, "board": { "g24": 14400, "at": "..." } },
//   "drivers": [ { "label": "Global price", "short": "Global", "v": 40 }, ... ],
//   "editorNote": { "text": "...", "by": "...", "at": "..." }
// }
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../data/rates.json', import.meta.url));
const url = process.env.RATES_FEED_URL;
if (!url) {
  console.log('No RATES_FEED_URL set: keeping data/rates.json as it is.');
  process.exit(0);
}

const headers = { Accept: 'application/json' };
if (process.env.RATES_FEED_TOKEN) headers.Authorization = `Bearer ${process.env.RATES_FEED_TOKEN}`;
const res = await fetch(url, { headers });
if (!res.ok) { console.error(`Feed returned ${res.status}`); process.exit(1); }
const feed = await res.json();

const ok = (n) => typeof n === 'number' && isFinite(n) && n > 1000 && n < 1e6;
if (!/^\d{4}-\d{2}-\d{2}$/.test(feed.date || '')) { console.error('Feed has no valid "date"'); process.exit(1); }
for (const k of ['24K', '22K', '18K']) if (!ok(feed.national?.[k])) { console.error(`Feed national.${k} is not a sane per-gram price`); process.exit(1); }

const old = JSON.parse(readFileSync(FILE, 'utf8'));
const hist = old.history.filter((h) => h.date < feed.date);
// "Yesterday" for change figures: today's old rate if this is a new day, or the day before if re-running a day.
const newDay = old.date < feed.date;
const base = (k) => (newDay ? old.national[k].g : old.national[k].g - old.national[k].chg);

const next = {
  ...old,
  sample: false,
  date: feed.date,
  updatedAt: feed.updatedAt || `${feed.date}T12:10:00+05:30`,
  national: {
    '24K': { g: feed.national['24K'], chg: feed.national['24K'] - base('24K') },
    '22K': { g: feed.national['22K'], chg: feed.national['22K'] - base('22K') },
    '18K': { g: feed.national['18K'], chg: feed.national['18K'] - base('18K') }
  },
  silverPerKg: feed.silverPerKg ?? old.silverPerKg,
  usdInr: feed.usdInr ?? old.usdInr,
  history: [...hist, { date: feed.date, '24K': feed.national['24K'], '22K': feed.national['22K'] }].slice(-10)
};

const move = feed.national['24K'] - base('24K');
next.drivers = Array.isArray(feed.drivers) && feed.drivers.length ? feed.drivers : [{ label: 'Market move', short: 'Market', v: move }];
next.editorNote = feed.editorNote || {
  text: `24K gold is ${move >= 0 ? 'up' : 'down'} ₹${Math.abs(move).toLocaleString('en-IN')} per gram since the last update. This note was generated automatically.`,
  by: 'Automated update',
  at: next.updatedAt
};
if (feed.benchmarks) for (const k of Object.keys(feed.benchmarks)) next.benchmarks[k] = { ...old.benchmarks[k], ...feed.benchmarks[k] };

// Cities: use the feed's city rate when present, otherwise follow the national move.
next.cities = {};
for (const [slug, c] of Object.entries(old.cities)) {
  const f = feed.cities?.[slug];
  const r = {};
  for (const k of ['24K', '22K', '18K']) r[k] = ok(f?.[k]) ? f[k] : c[k] + (feed.national[k] - old.national[k].g);
  r.chg24 = r['24K'] - (newDay ? c['24K'] : c['24K'] - c.chg24);
  r.chg22 = r['22K'] - (newDay ? c['22K'] : c['22K'] - c.chg22);
  r.at = f?.at || next.updatedAt;
  next.cities[slug] = r;
}

writeFileSync(FILE, JSON.stringify(next, null, 2) + '\n');
console.log(`Updated rates to ${feed.date}: 22K ₹${feed.national['22K']} · 24K ₹${feed.national['24K']}`);
