#!/usr/bin/env node
// Applies the rates typed into the GitHub "Run workflow" form (see .github/workflows/deploy.yml).
// Env: RATE_DATE (YYYY-MM-DD, default today in IST), GOLD_24K, GOLD_22K, GOLD_18K, SILVER_KG, IBJA_24K,
//      YESTERDAY ("24K/22K/18K", needed only the first time, while the file still holds sample data),
//      CITIES ("chennai=14329/13135/10750; delhi=14344/13150/10772", 24K/22K/18K per gram, same order as everywhere), NOTE.
import { mergeDay } from './merge-rates.mjs';

const num = (s) => (s === undefined || String(s).trim() === '' ? undefined : Number(String(s).replace(/[₹,\s]/g, '')));
const env = process.env;
const todayIST = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const triple = (s, order) => {
  const v = String(s).split('/').map(num);
  if (v.length !== 3 || v.some((x) => !isFinite(x))) throw new Error(`expected three numbers like 14329/13135/10757, got "${s}"`);
  return Object.fromEntries(order.map((k, i) => [k, v[i]]));
};

try {
  const day = {
    date: (env.RATE_DATE || '').trim() || todayIST,
    updatedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    national: { '24K': num(env.GOLD_24K), '22K': num(env.GOLD_22K), '18K': num(env.GOLD_18K) },
    silverPerKg: num(env.SILVER_KG),
    ibja24: num(env.IBJA_24K),
    note: (env.NOTE || '').trim() || undefined
  };
  if ((env.YESTERDAY || '').trim()) day.previous = triple(env.YESTERDAY, ['24K', '22K', '18K']);
  if ((env.CITIES || '').trim()) {
    day.cities = {};
    for (const part of env.CITIES.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)) {
      const [slug, vals] = part.split('=').map((s) => s.trim().toLowerCase());
      day.cities[slug] = triple(vals, ['24K', '22K', '18K']);
    }
  }
  const out = mergeDay(day);
  const local = Object.entries(out.cities).filter(([, c]) => c.local).map(([s]) => s);
  console.log(`Saved rates for ${out.date}: 24K ₹${out.national['24K'].g}, 22K ₹${out.national['22K'].g}, 18K ₹${out.national['18K'].g}. Cities with their own rate: ${local.join(', ') || 'none'}.`);
} catch (e) {
  console.error('Rates not saved: ' + e.message);
  process.exit(1);
}
