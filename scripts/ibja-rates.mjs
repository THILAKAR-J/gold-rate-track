#!/usr/bin/env node
// Daily rates from the IBJA website (ibjarates.com), run by the GitHub workflow.
//
// What the page gives us:
//   HdnGold / HdnSilver   hidden JSON with ~85 trading days of closing (PM) rates: 999 and 916 per 10 g, silver per kg
//   lblGold999_AM / _PM   today's session rates per 10 g (also 995, 916, 750, 585, Silver999)
//
// Rules:
//   24K = 999, 22K = 916, 18K = 750, per gram = per 10 g / 10, rounded. IBJA rates exclude GST.
//   IBJA publishes Monday to Friday only. On weekends and holidays the site keeps the last IBJA rate,
//   dated today, with change 0 and a note saying which day the rate is from.
//
// Usage: node scripts/ibja-rates.mjs [saved-page.html]   (no argument: fetch https://ibjarates.com/)
import { readFileSync, writeFileSync } from 'node:fs';
import { FILE } from './merge-rates.mjs';

const URL_IBJA = 'https://ibjarates.com/';
const dec = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
const toIso = (dmy) => { const [d, m, y] = dmy.split('/'); return `${y}-${m}-${d}`; };
const g = (per10) => Math.round(per10 / 10);
const sane10 = (n) => Number.isFinite(n) && n > 10000 && n < 1e7;

export function parseIbja(html) {
  const hidden = (id) => {
    const m = html.match(new RegExp(`id="${id}" value="([^"]*)"`));
    if (!m) throw new Error(`IBJA page has no ${id}`);
    return JSON.parse(dec(m[1]));
  };
  const lbl = (id) => {
    const m = html.match(new RegExp(`id="${id}">\\s*([\\d.,]*)\\s*<`));
    const n = m ? Number(m[1].replace(/,/g, '')) : NaN;
    return sane10(n) ? n : null;
  };
  const gold = hidden('HdnGold'), silver = hidden('HdnSilver');
  if (!gold.labels?.length || gold.labels.length !== gold.purity999?.length || gold.labels.length !== gold.purity916?.length) throw new Error('IBJA gold history is malformed');
  const silverBy = Object.fromEntries((silver.labels || []).map((l, i) => [toIso(l), silver.silverRate?.[i]]));
  const history = gold.labels.map((l, i) => {
    const date = toIso(l), p999 = Number(gold.purity999[i]), p916 = Number(gold.purity916[i]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !sane10(p999) || !sane10(p916)) throw new Error(`IBJA history row ${l} is malformed`);
    return { date, p999, p916, p750: Math.round(p999 * 0.75), silver: Number(silverBy[date]) || null };
  }).sort((a, b) => a.date.localeCompare(b.date));
  const session = (s) => ({ p999: lbl(`lblGold999_${s}`), p916: lbl(`lblGold916_${s}`), p750: lbl(`lblGold750_${s}`), silver: lbl(`lblSilver999_${s}`) });
  return { history, am: session('AM'), pm: session('PM') };
}

// Decide today's rate from the parsed page. `now` is a Date; dates are compared in IST.
export function ibjaDay({ history, am, pm }, now = new Date()) {
  const ist = new Date(now.getTime() + 5.5 * 3600e3);
  const today = ist.toISOString().slice(0, 10);
  const weekday = ist.getUTCDay() >= 1 && ist.getUTCDay() <= 5;
  const closes = history.filter((h) => h.date <= today);
  const last = closes.at(-1);
  if (!last) throw new Error('IBJA history has no rates up to today');
  const full = (s) => s.p999 && s.p916 && s.p750;

  let cur, prev, session, carried = null;
  if (last.date === today) {
    cur = last; prev = closes.at(-2); session = 'PM';
  } else if (weekday && full(pm) && pm.p999 !== last.p999) {
    cur = { date: today, ...pm, silver: pm.silver || last.silver }; prev = last; session = 'PM';
  } else if (weekday && full(am) && !pm.p999) {
    cur = { date: today, ...am, silver: am.silver || last.silver }; prev = last; session = 'AM';
  } else {
    cur = { ...last, date: today }; prev = last; session = 'carried'; carried = last.date;
  }
  if (!(cur.p999 > cur.p916 && cur.p916 > cur.p750)) throw new Error('IBJA rates do not add up (999 > 916 > 750)');
  if (prev && Math.abs(cur.p999 - prev.p999) / prev.p999 > 0.1) throw new Error('IBJA 999 moved more than 10% in a day: refusing');
  return { today, cur, prev, session, carried, history: closes };
}

const longDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

export function buildRates(day, old, now = new Date()) {
  const { today, cur, prev, session, carried } = day;
  const n = { '24K': g(cur.p999), '22K': g(cur.p916), '18K': g(cur.p750) };
  const p = carried ? n : { '24K': g(prev.p999), '22K': g(prev.p916), '18K': g(prev.p750) };
  const chg = (k) => n[k] - p[k];
  const at = now.toISOString().replace(/\.\d+Z$/, 'Z');
  const word = (v) => (v === 0 ? 'unchanged' : `${v > 0 ? 'up' : 'down'} ₹${Math.abs(v).toLocaleString('en-IN')} per gram`);
  const note = carried
    ? `IBJA does not publish rates on weekends and market holidays, so today's rate is the last IBJA rate, from ${longDate(carried)}.`
    : session === 'AM'
      ? `IBJA morning rate. 24K gold is ${word(chg('24K'))} from the last closing rate; the evening rate follows around 6 PM.`
      : `IBJA closing rate. 24K gold is ${word(chg('24K'))} from the previous trading day.`;
  let history = day.history.slice(-30).map((h) => ({ date: h.date, '24K': g(h.p999), '22K': g(h.p916), '18K': g(h.p750) }));
  if (!carried && history.at(-1)?.date !== today) history = [...history.slice(-29), { date: today, ...n }];

  const out = {
    sample: false,
    source: 'IBJA',
    session,
    carriedFrom: carried,
    date: today,
    updatedAt: at,
    national: Object.fromEntries(Object.keys(n).map((k) => [k, { g: n[k], chg: chg(k) }])),
    silverPerKg: cur.silver || old.silverPerKg,
    usdInr: old.usdInr,
    benchmarks: { ibja: { label: 'IBJA benchmark', note: '999 purity, excl. GST', g24: n['24K'], at } },
    drivers: [{ label: 'IBJA move', short: 'IBJA', v: chg('24K') }],
    editorNote: { text: note, by: 'Daily Gold Rate India', at },
    watch: old.watch || [],
    festival: old.festival,
    importDuty: old.importDuty,
    history,
    cities: {}
  };
  for (const slug of Object.keys(old.cities)) {
    // No city publishes its own rate here yet: every city shows the national IBJA rate, labelled as such.
    out.cities[slug] = { '24K': n['24K'], '22K': n['22K'], '18K': n['18K'], local: false, at, chg24: chg('24K'), chg22: chg('22K') };
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    let html;
    if (process.argv[2]) html = readFileSync(process.argv[2], 'utf8');
    else {
      const res = await fetch(URL_IBJA, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyGoldRateIndia/1.0)', Accept: 'text/html' } });
      if (!res.ok) throw new Error(`ibjarates.com returned ${res.status}`);
      html = await res.text();
    }
    const old = JSON.parse(readFileSync(FILE, 'utf8'));
    const day = ibjaDay(parseIbja(html), process.env.NOW ? new Date(process.env.NOW) : new Date());
    const out = buildRates(day, old);
    writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n');
    console.log(`IBJA ${out.session}${out.carriedFrom ? ` (rate of ${out.carriedFrom})` : ''} for ${out.date}: 24K ₹${out.national['24K'].g}, 22K ₹${out.national['22K'].g}, 18K ₹${out.national['18K'].g}, silver ₹${out.silverPerKg}/kg; ${out.history.length} days of history.`);
  } catch (e) {
    // Keep yesterday's file and still rebuild: a failed fetch must not take the site down.
    console.error('::warning::IBJA rates not updated: ' + e.message);
  }
}
