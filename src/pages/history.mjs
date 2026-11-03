// History: hub (/gold-rate-history/) and one page per month with data.
import { inr, longDate, medDate, shortDate, dayMonth, weekday } from '../lib/format.mjs';
import { crumbs, adSlot } from '../lib/layout.mjs';
import { tiles, card, trendChart, trendStats, dailyTable, railLinks, railInstall, stamp, hero, twoCol, quickLinks } from '../lib/parts.mjs';
import { pageOut } from './rates.mjs';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/** Group history rows by month: [{y, m, key, label, path, rows}] oldest first. */
export function monthsOf(history) {
  const out = [];
  for (const h of history) {
    const y = Number(h.date.slice(0, 4)), m = Number(h.date.slice(5, 7));
    let g = out.find((x) => x.y === y && x.m === m);
    if (!g) {
      g = { y, m, key: `${y}-${String(m).padStart(2, '0')}`, label: `${cap(MONTHS.at(m - 1))} ${y}`, path: `/gold-rate-history/${y}/${MONTHS.at(m - 1)}/`, rows: [] };
      out.push(g);
    }
    g.rows.push(h);
  }
  return out;
}

const stats = (rows, k) => {
  const v = rows.map((r) => r[k]);
  const hi = Math.max(...v), lo = Math.min(...v);
  return { hi, lo, hiDate: rows[v.indexOf(hi)].date, loDate: rows[v.indexOf(lo)].date, avg: v.reduce((a, b) => a + b, 0) / v.length, first: v[0], last: v.at(-1) };
};

export function monthPage(ctx, mo, idx) {
  const rows = mo.rows, s22 = stats(rows, '22K'), s24 = stats(rows, '24K');
  let big = { d: 0, date: rows[0].date, d22: 0 };
  rows.forEach((r, i) => { if (i) { const d = r['24K'] - rows[i - 1]['24K']; if (Math.abs(d) > Math.abs(big.d)) big = { d, date: r.date, d22: r['22K'] - rows[i - 1]['22K'] }; } });
  const prev = ctx.months[idx - 1], next = ctx.months[idx + 1];
  const partial = rows.length < new Date(mo.y, mo.m, 0).getDate();
  const span = `${shortDate(rows[0].date)} to ${shortDate(rows.at(-1).date)}`;
  const t = tiles([
    { main: true, k: '22K', sub: 'per gram', chg: `${s22.last - s22.first < 0 ? '▼' : '▲'} ₹${Math.abs(s22.last - s22.first)} since ${shortDate(rows[0].date)}`, chgCls: s22.last - s22.first < 0 ? 'chg chg-down' : 'chg chg-up', price: inr(s22.last), small: `on ${shortDate(rows.at(-1).date)}`, rows: [[`High, ${shortDate(s22.hiDate)}`, inr(s22.hi)], [`Low, ${shortDate(s22.loDate)}`, inr(s22.lo)]] },
    { k: '24K', sub: 'per gram', chg: `${s24.last - s24.first < 0 ? '▼' : '▲'} ₹${Math.abs(s24.last - s24.first)} since ${shortDate(rows[0].date)}`, chgCls: s24.last - s24.first < 0 ? 'chg chg-down' : 'chg chg-up', price: inr(s24.last), small: `on ${shortDate(rows.at(-1).date)}`, rows: [[`High, ${shortDate(s24.hiDate)}`, inr(s24.hi)], [`Low, ${shortDate(s24.loDate)}`, inr(s24.lo)]] },
    { k: 'Biggest daily move', sub: shortDate(big.date), price: (big.d < 0 ? '−₹' : '+₹') + Math.abs(big.d), small: '24K / g', rows: [['22K that day', (big.d22 < 0 ? '−₹' : '+₹') + Math.abs(big.d22)], ['Average 22K', inr(s22.avg)]] }
  ]);
  const pts = rows.map((r) => ({ date: r.date, v: r['24K'] }));
  const chart = card('t-h', `24 carat gold rate chart, ${mo.label}`, `Per gram, India, ${span}.`, `${trendChart(pts, { label: '24K gold rate', endWord: shortDate(rows.at(-1).date) })}${trendStats(pts, { high: 'High', low: 'Low', since: `Change since ${shortDate(rows[0].date)}` })}`);
  const daily = card('d-h', `Daily gold rate, ${mo.label}`, 'Per gram in India, newest first. The small figure is the change from the day before.',
    `${dailyTable(rows, [{ head: '22K', v: (r) => r['22K'], hl: true }, { head: '24K', v: (r) => r['24K'] }], { caption: `Daily 22K and 24K gold rate per gram, ${mo.label}`, dateFmt: (d) => `${shortDate(d)}, ${weekday(d).slice(0, 3)}` })}
${partial ? `<p class="hint">This month has rates from ${span}. Days are added as each day's rate is published.</p>` : ''}`);
  const nav = railLinks('Other months', [
    ...(next ? [[ctx.url(next.path), next.label, 'Next']] : []),
    ...(prev ? [[ctx.url(prev.path), prev.label, 'Before']] : []),
    [ctx.url('/gold-rate-history/'), 'All history', 'View']
  ]);
  const crumbList = [{ name: 'Home', path: '/' }, { name: 'Gold rate history', path: '/gold-rate-history/' }, { name: mo.label }];
  const main = `<main id="main">
${hero({
    crumbsHtml: crumbs(ctx, crumbList),
    h1: `Gold Rate in ${mo.label}`,
    answer: `In ${mo.label}, 22 carat gold in India ranged from <strong class="num">${inr(s22.lo)}</strong> to <strong class="num">${inr(s22.hi)}</strong> per gram and 24 carat from <strong class="num">${inr(s24.lo)}</strong> to <strong class="num">${inr(s24.hi)}</strong>. On ${dayMonth(rows.at(-1).date)}, 22K was ${inr(s22.last)}.`,
    tilesHtml: t,
    stampHtml: stamp([`Rates for ${span}`, 'IBJA-based national rate, before GST'], ctx.rates.sample ? 'Sample data' : '')
  })}
${twoCol([chart, daily, adSlot(ctx, 'lb'), quickLinks(ctx)].join('\n'), [nav, adSlot(ctx, 'mr'), railInstall()].join('\n'), 'More history')}
</main>`;
  const title = `Gold Rate in ${mo.label}: Daily 22K and 24K Rates in India`;
  const description = `Gold rate in ${mo.label}: 22K ranged ${inr(s22.lo)} to ${inr(s22.hi)} and 24K ${inr(s24.lo)} to ${inr(s24.hi)} per gram. Daily table, chart, high, low and average.`;
  const dataset = {
    '@type': 'Dataset', name: `Gold rate in India, ${mo.label}`, description: `Daily 22K and 24K gold rate per gram in India, ${span}.`,
    url: ctx.abs(mo.path), creator: { '@type': 'Organization', name: ctx.site.name }, temporalCoverage: `${rows[0].date}/${rows.at(-1).date}`,
    spatialCoverage: 'India', variableMeasured: ['22 carat gold rate per gram (INR)', '24 carat gold rate per gram (INR)'], isAccessibleForFree: true
  };
  return { ...pageOut(ctx, { path: mo.path, title, description, active: 'history', main, crumbsList: crumbList, extraLd: [dataset], pageId: 'month' }), lastmod: rows.at(-1).date };
}

export function historyHub(ctx) {
  const path = '/gold-rate-history/';
  const rowsHtml = ctx.months.slice().reverse().map((mo) => {
    const a = stats(mo.rows, '22K'), b = stats(mo.rows, '24K');
    return `<tr><th scope="row"><a href="${ctx.url(mo.path)}">${mo.label}</a><small>${mo.rows.length} days</small></th><td class="hl num">${inr(a.avg)}</td><td class="num">${inr(a.lo)} to ${inr(a.hi)}</td><td class="num hide-sm">${inr(b.avg)}</td></tr>`;
  }).join('\n');
  const tbl = card('m-h', 'Gold rate by month', 'Average and range of the per gram rate in India.',
    `<div class="tbl"><table class="t"><caption class="sr">Monthly gold rate summary</caption><thead><tr><th scope="col">Month</th><th scope="col" class="hl">22K average</th><th scope="col">22K range</th><th scope="col" class="hide-sm">24K average</th></tr></thead><tbody>
${rowsHtml}
</tbody></table></div>
<p class="hint">Year pages from 2000 onward are added as soon as the full historical data is loaded.</p>`);
  const crumbList = [{ name: 'Home', path: '/' }, { name: 'Gold rate history' }];
  const latest = ctx.months.at(-1);
  const main = `<main id="main">
${hero({
    crumbsHtml: crumbs(ctx, crumbList),
    h1: 'Gold Rate History in India',
    answer: `Daily 22K and 24K gold rates in India, month by month. The latest month is <a class="on-dark" href="${ctx.url(latest.path)}">${latest.label}</a>.`
  })}
${twoCol([tbl, adSlot(ctx, 'lb'), quickLinks(ctx)].join('\n'), [railInstall(), adSlot(ctx, 'mr')].join('\n'), 'More history')}
</main>`;
  const title = 'Gold Rate History in India: Daily and Monthly 22K and 24K Rates';
  const description = 'Gold rate history in India with daily 22K and 24K rates per gram, monthly averages, highs and lows. Updated every day with the latest rate.';
  return { ...pageOut(ctx, { path, title, description, active: 'history', main, crumbsList: crumbList, pageId: 'history' }), lastmod: ctx.rates.date };
}
