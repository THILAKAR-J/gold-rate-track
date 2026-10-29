// Gold price calculator (/gold-price-calculator/). Server renders the default estimate; app.js recalculates live.
import { inr, longDate } from '../lib/format.mjs';
import { page, crumbs, breadcrumbLd } from '../lib/layout.mjs';
import { faqHtml, faqLd } from '../lib/parts.mjs';

export const UG = { g: 1, pavan: 8, tola: 11.6638 };

// Receipt's torn bottom edge: alternating points every 10 units.
const zz = Array.from({ length: 41 }, (_, i) => `${i * 10} ${i % 2 ? 12 : 2}`);
const ZIG = `<svg class="zig" viewBox="0 0 400 12" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 H400 V2 L${zz.slice().reverse().join(' L')} Z" fill="#FFFFFF"/><path d="M${zz.join(' L')}" fill="none" stroke="#DDE1DC" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;

/** Same maths as app.js. */
export function estimate(R, s) {
  const num = (v) => { const n = Number(v); return isFinite(n) && n >= 0 ? n : 0; };
  const grams = num(s.weight) * UG[s.unit];
  const rate = R[s.purity];
  const gold = grams * rate;
  const making = (gold * num(s.making)) / 100;
  const wastage = (gold * num(s.wastage)) / 100;
  const other = num(s.other);
  const gst = (gold + making + wastage + other) * 0.03;
  const credit = s.exchange ? num(s.oldG) * R['22K'] * (1 - num(s.oldCut) / 100) : 0;
  const gross = gold + making + wastage + other + gst;
  return { grams, rate, gold, making, wastage, other, gst, credit, gross, total: Math.max(0, gross - credit) };
}

export function calculatorPage(ctx) {
  const R = ctx.rates, N = R.national, date = R.date;
  const rates = { '24K': N['24K'].g, '22K': N['22K'].g, '18K': N['18K'].g };
  const s = { purity: '22K', weight: 16, unit: 'g', making: 12, wastage: 0, other: 0, exchange: false, oldG: 8, oldCut: 2 };
  const e = estimate(rates, s);
  const C = 2 * Math.PI * 44;
  const share = (v) => (e.gross > 0 ? v / e.gross : 0);
  const a1 = share(e.gold) * C, a2 = share(e.making + e.wastage + e.other) * C, a3 = share(e.gst) * C;
  const p = (v) => (share(v) * 100).toFixed(1) + '%';
  const path = '/gold-price-calculator/';
  const seg = (group, items, on) =>
    items.map(([v, l]) => `<button type="button" class="segb${v === on ? ' on' : ''}" aria-pressed="${v === on}" data-${group}="${v}">${l}</button>`).join('');

  const faqs = [
    { q: 'How is GST charged on gold jewellery?', a: 'On a jeweller\'s bill, GST is usually 3% of the gold value plus making and other charges. Check the GST line on your invoice.' },
    { q: 'What is a normal making charge?', a: 'It varies by design. Plain chains and coins are often 0 to 8%, while detailed or handmade work can be 15 to 25%. Always ask for it as a separate line.' },
    { q: 'How is old gold valued in an exchange?', a: 'This calculator values old gold at today\'s 22K rate less the jeweller\'s deduction. Shops test purity first, so the final credit can differ.' }
  ];

  const crumbItems = [{ name: 'Home', path: '/' }, { name: 'Gold price calculator' }];
  const main = `<main id="main" class="wrap main" style="padding-top: 20px">
<div class="stack" style="gap: 10px">
${crumbs(ctx, crumbItems)}
<h1 class="title">What will I actually pay?</h1>
<p class="lead">Add making charge, wastage and 3% GST to today's rate and see the full bill, line by line. Uses the national rate for <time datetime="${date}">${longDate(date)}</time>.</p>
</div>

<div class="calc" data-calc>
<form class="card form-card" aria-labelledby="in-h" novalidate>
<h2 id="in-h" class="h3" style="font-size: 20px">Your piece</h2>
<fieldset class="bare">
<legend>Purity</legend>
<div class="segs">${seg('purity', [['24K', '24K'], ['22K', '22K'], ['18K', '18K']], s.purity)}</div>
<p class="hint" style="margin: 8px 0 0" data-rate-hint>Today's 22K rate is ${inr(rates['22K'])} per gram${R.sample ? ' (sample rate)' : ''}.</p>
</fieldset>
<div class="row2">
<div class="field"><label for="w-in">Weight</label><input id="w-in" name="weight" class="in big num" type="number" inputmode="decimal" min="0" step="0.1" value="${s.weight}"></div>
<fieldset class="bare"><legend>Unit</legend><div class="segs">${seg('unit', [['g', 'Grams'], ['pavan', 'Pavan'], ['tola', 'Tola']], s.unit)}</div></fieldset>
</div>
<div class="row3">
<div class="field"><label for="mk-in">Making charge (%)</label><input id="mk-in" name="making" class="in big num" type="number" inputmode="decimal" min="0" max="40" step="0.5" value="${s.making}"><span class="hint">Plain chains are often lower; detailed work higher.</span></div>
<div class="field"><label for="wa-in">Wastage or VA (%)</label><input id="wa-in" name="wastage" class="in big num" type="number" inputmode="decimal" min="0" max="30" step="0.5" value="${s.wastage}"><span class="hint">Use 0 if your jeweller quotes only a making charge.</span></div>
<div class="field"><label for="st-in">Stones and other (₹)</label><input id="st-in" name="other" class="in big num" type="number" inputmode="numeric" min="0" step="100" value="${s.other}"><span class="hint">Stone value, hallmarking fee, certificate.</span></div>
</div>
<div class="xchg">
<label class="toggle"><input type="checkbox" name="exchange" data-exchange>I'm exchanging old gold</label>
<div class="row2" data-ex-fields hidden>
<div class="field"><label for="og-in">Old gold weight (g)</label><input id="og-in" name="oldG" class="in big num" type="number" inputmode="decimal" min="0" step="0.1" value="${s.oldG}"></div>
<div class="field"><label for="od-in">Jeweller's deduction (%)</label><input id="od-in" name="oldCut" class="in big num" type="number" inputmode="decimal" min="0" max="20" step="0.5" value="${s.oldCut}"><span class="hint">Assumes 22K old gold at today's rate.</span></div>
</div>
</div>
</form>

<aside class="receipt-wrap" aria-labelledby="bill-h">
<div class="receipt-box">
<div class="receipt">
<div class="receipt-head"><h2 id="bill-h" class="h3" style="font-size: 20px">Your estimate</h2><span class="hint num" data-o="sub">22K · ${e.grams.toFixed(2)} g</span></div>
<div class="line"><span>Gold value</span><b class="num" data-o="gold">${inr(e.gold)}</b></div>
<div class="line"><span>Making charge</span><b class="num" data-o="making">${inr(e.making)}</b></div>
<div class="line"><span>Wastage or VA</span><b class="num" data-o="wastage">${inr(e.wastage)}</b></div>
<div class="line"><span>Stones and other</span><b class="num" data-o="other">${inr(e.other)}</b></div>
<div class="line"><span>GST at 3%</span><b class="num" data-o="gst">${inr(e.gst)}</b></div>
<div class="line" data-credit-line hidden><span>Old gold credit</span><b class="num up" data-o="credit">−${inr(e.credit)}</b></div>
<div class="total" aria-live="polite"><span style="font-weight: 700">You pay about</span><b class="num" data-o="total">${inr(e.total)}</b></div>
<p class="hint" style="margin: 10px 0 0" data-o="effective">That is ${inr(e.gross / e.grams)} per gram before any exchange, ${((e.gross / e.gold - 1) * 100).toFixed(1)}% above the gold rate.</p>
</div>
${ZIG}
</div>

<div class="card donut-card">
<svg viewBox="0 0 120 120" role="img" aria-label="Gold ${p(e.gold)}, making and other ${p(e.making + e.wastage + e.other)}, GST ${p(e.gst)} of your bill" style="width: 112px; height: 112px" data-donut>
<circle cx="60" cy="60" r="44" fill="none" stroke="#EEF0EC" stroke-width="18"/>
<circle cx="60" cy="60" r="44" fill="none" stroke="#E8B64C" stroke-width="18" stroke-dasharray="${a1.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="0" transform="rotate(-90 60 60)" data-arc="1"/>
<circle cx="60" cy="60" r="44" fill="none" stroke="#9C6B12" stroke-width="18" stroke-dasharray="${a2.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-a1).toFixed(2)}" transform="rotate(-90 60 60)" data-arc="2"/>
<circle cx="60" cy="60" r="44" fill="none" stroke="#12161A" stroke-width="18" stroke-dasharray="${a3.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-(a1 + a2)).toFixed(2)}" transform="rotate(-90 60 60)" data-arc="3"/>
</svg>
<div class="stack" style="gap: 10px">
<b style="font-size: 15px">Where your money goes</b>
<ul class="keys">
<li><i class="sw" style="background: #E8B64C"></i>Gold<b class="num" data-o="pGold">${p(e.gold)}</b></li>
<li><i class="sw" style="background: #9C6B12"></i>Making and other<b class="num" data-o="pMaking">${p(e.making + e.wastage + e.other)}</b></li>
<li><i class="sw" style="background: #12161A"></i>GST<b class="num" data-o="pGst">${p(e.gst)}</b></li>
</ul>
</div>
</div>

<div class="share-row">
<a class="btn btn-line" href="https://wa.me/?text=" target="_blank" rel="noopener" data-share>Share on WhatsApp</a>
<button type="button" class="btn btn-line" data-print>Print estimate</button>
</div>
</aside>
</div>

<section aria-labelledby="how-h" class="card stack">
<h2 id="how-h" class="h2">How this estimate works</h2>
<div class="how3">
<div><span class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#845A0E" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 18 L7 8 H17 L20 18 Z"/></svg></span><b>Gold value</b><p>Weight in grams times today's rate for the purity. 1 pavan = 8 g, 1 tola = 11.66 g.</p></div>
<div><span class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#845A0E" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 19 L19 5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/></svg></span><b>Making and wastage</b><p>Percentages of the gold value. Ask for both on your bill, with the HUID of each piece.</p></div>
<div><span class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#845A0E" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3 H18 V21 L15 19 L12 21 L9 19 L6 21 Z"/><path d="M9 8 H15 M9 12 H15" stroke-linecap="round"/></svg></span><b>GST and exchange</b><p>3% GST on gold, making and other charges. Old gold is valued at today's 22K rate less the deduction.</p></div>
</div>
<p class="hint" style="margin: 0">This is an estimate, not a quote or financial advice. Your jeweller's bill can differ.</p>
</section>

<section aria-labelledby="faq-h" class="card stack">
<h2 id="faq-h" class="h2">Calculator questions</h2>
<div>${faqHtml(faqs)}</div>
</section>
</main>`;

  const title = 'Gold Price Calculator with Making Charge and GST';
  const description = `Work out your gold jewellery bill: weight, purity, making charge, wastage, 3% GST and old-gold exchange, at today's rate of ${inr(rates['22K'])} per gram for 22K.`;
  return {
    path,
    html: page(ctx, {
      path, title, description, active: 'calc', pageId: 'calc', main,
      data: { rates, ug: UG, sample: !!R.sample },
      jsonld: [
        breadcrumbLd(ctx, [{ name: 'Home', path: '/' }, { name: 'Gold price calculator', path }]),
        { '@type': 'WebApplication', name: title, url: ctx.abs(path), applicationCategory: 'FinanceApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } },
        faqLd(faqs)
      ]
    })
  };
}
