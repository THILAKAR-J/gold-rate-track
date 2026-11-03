#!/usr/bin/env node
// Daily rate update from a licensed JSON feed (RATES_FEED_URL, optional RATES_FEED_TOKEN).
// The feed returns the "day" object described at the top of scripts/merge-rates.mjs.
// With no feed configured it does nothing, so the scheduled build simply republishes the site.
import { mergeDay } from './merge-rates.mjs';

const url = process.env.RATES_FEED_URL;
if (!url) { console.log('No RATES_FEED_URL set: keeping data/rates.json as it is.'); process.exit(0); }
const headers = { Accept: 'application/json' };
if (process.env.RATES_FEED_TOKEN) headers.Authorization = `Bearer ${process.env.RATES_FEED_TOKEN}`;
const res = await fetch(url, { headers });
if (!res.ok) { console.error(`Feed returned ${res.status}`); process.exit(1); }
try {
  const out = mergeDay(await res.json());
  console.log(`Updated rates to ${out.date}: 22K ₹${out.national['22K'].g} · 24K ₹${out.national['24K'].g}`);
} catch (e) { console.error('Feed rejected: ' + e.message); process.exit(1); }
