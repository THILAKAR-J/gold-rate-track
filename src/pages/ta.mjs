// Tamil pages: /ta/ (India) and /ta/{city}/ for cities with a Tamil name. Text to be checked by a Tamil reader before launch.
import { inr, esc } from '../lib/format.mjs';
import { crumbs, adSlot } from '../lib/layout.mjs';
import { pctOf, arrow, chgCls, tiles, card, weightTable, dailyTable, faqCard, stamp, live, hero, twoCol, myCityBar, railLinks } from '../lib/parts.mjs';
import { pageOut } from './rates.mjs';

const TA_MONTHS = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
const taDate = (iso) => `${Number(iso.slice(8, 10))} ${TA_MONTHS.at(Number(iso.slice(5, 7)) - 1)} ${iso.slice(0, 4)}`;
const taShort = (iso) => `${Number(iso.slice(8, 10))} ${TA_MONTHS.at(Number(iso.slice(5, 7)) - 1)}`;
const taTime = (iso) => {
  const h = Number(iso.slice(11, 13)), m = iso.slice(14, 16);
  const part = h < 12 ? 'காலை' : h < 16 ? 'மதியம்' : 'மாலை';
  return `${part} ${((h + 11) % 12) + 1}:${m}`;
};
const updown = (c) => (c >= 0 ? 'உயர்வு' : 'சரிவு');
const K = { '22K': '22 காரட்', '24K': '24 காரட்', '18K': '18 காரட்' };

export function taHome(ctx) {
  const R = ctx.rates, N = R.national, date = R.date, path = '/ta/';
  const t = tiles(['22K', '24K', '18K'].map((k) => ({
    main: k === '22K', k: K[k], sub: '1 கிராம்', chg: `${arrow(N[k].chg)} ₹${Math.abs(N[k].chg)}`, chgCls: chgCls(N[k].chg),
    price: inr(N[k].g), rows: [['1 சவரன் (8 கி)', inr(N[k].g * 8)], ['10 கிராம்', inr(N[k].g * 10)]]
  })));
  const W = [['1 கிராம்', '', 1], ['1 சவரன்', '8 கிராம்', 8], ['10 கிராம்', '', 10], ['100 கிராம்', '', 100]];
  const weights = card('w-h', 'எடை வாரியாக தங்கம் விலை', 'ஒரு கிராம் விலை × எடை. GST, செய்கூலி தனி.',
    weightTable({ rates: { '22K': N['22K'].g, '24K': N['24K'].g, '18K': N['18K'].g }, rows: W, caption: `இந்தியா, ${taDate(date)}, ரூபாயில்`, unitWord: 'எடை', labels: K }));
  const hist = card('d-h', `கடந்த ${R.history.length} நாட்களில் தங்கம் விலை`, 'ஒரு கிராம், புதியது முதலில்.',
    dailyTable(R.history, [{ head: '22 காரட்', v: (r) => r['22K'], hl: true }, { head: '24 காரட்', v: (r) => r['24K'] }], { caption: 'இந்தியா, ஒரு கிராம் தங்கம் விலை', dateFmt: taShort, dateHead: 'தேதி' }));
  const faqs = [
    { q: 'இன்றைய தங்கம் விலை என்ன?', a: `${taDate(date)} அன்று 22 காரட் தங்கம் ஒரு கிராம் ${inr(N['22K'].g)}, 24 காரட் ஒரு கிராம் ${inr(N['24K'].g)}. GST மற்றும் செய்கூலி தனி.` },
    { q: 'இன்று ஒரு சவரன் தங்கம் விலை என்ன?', a: `22 காரட் ஒரு சவரன் (8 கிராம்) ${inr(N['22K'].g * 8)}, 24 காரட் ஒரு சவரன் ${inr(N['24K'].g * 8)}.` },
    { q: '916 தங்கம் என்றால் என்ன?', a: '916 என்பது 22 காரட், அதாவது 91.6% தூய தங்கம். பெரும்பாலான ஆபரணங்கள் 916 தங்கத்தில் செய்யப்படுகின்றன.' }
  ];
  const cityLinks = ctx.cities.filter((c) => c.ta).map((c) => [ctx.url(`/ta/${c.slug}/`), `${esc(c.ta.name)} தங்கம் விலை`, inr(R.cities[c.slug]['22K'] * 8)]);
  const crumbList = [{ name: 'முகப்பு', path: '/ta/' }, { name: 'இன்றைய தங்கம் விலை' }];
  const main = `<main id="main">
${hero({
    crumbsHtml: '',
    h1: 'இன்றைய தங்கம் விலை',
    answer: `இன்று, <time datetime="${date}">${taDate(date)}</time>, 22 காரட் ஆபரணத் தங்கம் ஒரு கிராம் <strong class="num">${inr(N['22K'].g)}</strong>, ஒரு சவரன் <strong class="num">${inr(N['22K'].g * 8)}</strong>. நேற்றை விட கிராமுக்கு ₹${Math.abs(N['22K'].chg)} ${updown(N['22K'].chg)}.`,
    tilesHtml: t,
    stampHtml: stamp([`${live}புதுப்பித்தது ${taTime(R.updatedAt)}`, 'GST, செய்கூலி தனி'], R.sample ? 'மாதிரி விலை' : '')
  })}
${myCityBar('ta')}
${twoCol([weights, adSlot(ctx, 'lb'), hist, faqCard('f-h', 'அடிக்கடி கேட்கப்படும் கேள்விகள்', faqs)].join('\n'),
    [railLinks('நகர விலை', cityLinks), adSlot(ctx, 'mr')].join('\n'), 'மேலும் விலைகள்')}
</main>`;
  const title = `இன்றைய தங்கம் விலை (${taDate(date)}): 22 காரட் ${inr(N['22K'].g)}`;
  const description = `இன்றைய தங்கம் விலை: 22 காரட் ஒரு கிராம் ${inr(N['22K'].g)}, ஒரு சவரன் ${inr(N['22K'].g * 8)}, 24 காரட் ஒரு கிராம் ${inr(N['24K'].g)}. கடந்த 10 நாட்களின் விலையும்.`;
  return pageOut(ctx, {
    path, title, description, active: 'home', main, faqs, crumbsList: crumbList, lang: 'ta', pageId: 'ta-home',
    alternates: [{ lang: 'en-IN', path: '/' }, { lang: 'ta-IN', path }], altPath: '/'
  });
}

export function taCity(ctx, c) {
  const R = ctx.rates, N = R.national, r = R.cities[c.slug], date = R.date, path = `/ta/${c.slug}/`;
  const nm = c.ta.name;
  const t = tiles([
    { main: true, k: '22 காரட்', sub: '1 சவரன்', chg: `${arrow(r.chg22)} ₹${Math.abs(r.chg22 * 8)}`, chgCls: chgCls(r.chg22), price: inr(r['22K'] * 8), rows: [['1 கிராம்', inr(r['22K'])], ['10 கிராம்', inr(r['22K'] * 10)]] },
    { k: '24 காரட்', sub: '1 சவரன்', chg: `${arrow(r.chg24)} ₹${Math.abs(r.chg24 * 8)}`, chgCls: chgCls(r.chg24), price: inr(r['24K'] * 8), rows: [['1 கிராம்', inr(r['24K'])]] },
    { k: 'வெள்ளி', sub: '1 கிராம்', price: inr(R.silverPerKg / 1000), rows: [['1 கிலோ', inr(R.silverPerKg)]] }
  ]);
  const W = [['1 கிராம்', '', 1], ['1 சவரன்', '8 கிராம்', 8], ['2 சவரன்', '16 கிராம்', 16], ['5 சவரன்', '40 கிராம்', 40], ['10 கிராம்', '', 10]];
  const weights = card('w-h', 'எடை வாரியாக தங்கம் விலை', `${esc(nm)}, ஒரு கிராம் விலை × எடை.`,
    weightTable({ rates: { '22K': r['22K'], '24K': r['24K'], '18K': r['18K'] }, rows: W, caption: `${esc(nm)}, ${taDate(date)}, GST இல்லாமல்`, keys: ['22K', '24K'], hideSm: [], unitWord: 'எடை', labels: K }));
  const sov = R.history.map((h) => ({ date: h.date, s: Math.round(h['22K'] * 8) }));
  const hist = card('d-h', `கடந்த ${sov.length} நாட்களில் சவரன் விலை`, 'இந்திய விலை, 22 காரட், ஒரு சவரன், புதியது முதலில்.',
    dailyTable(sov, [{ head: '22 காரட் சவரன்', v: (x) => x.s, hl: true }], { caption: 'இந்தியா, 22 காரட் ஒரு சவரன் விலை', dateFmt: taShort, dateHead: 'தேதி', limit: 7 }));
  const faqs = [
    { q: `இன்று ${nm}யில் ஒரு சவரன் தங்கம் விலை என்ன?`, a: `${taDate(date)} அன்று 22 காரட் ஒரு சவரன் ${inr(r['22K'] * 8)}, 24 காரட் ஒரு சவரன் ${inr(r['24K'] * 8)}. GST மற்றும் செய்கூலி தனி.` },
    { q: 'ஒரு சவரன் எத்தனை கிராம்?', a: 'ஒரு சவரன் (பவுன்) 8 கிராம்.' },
    { q: '916 தங்கம் என்றால் என்ன?', a: '916 என்பது 22 காரட், அதாவது 91.6% தூய தங்கம். பெரும்பாலான ஆபரணங்கள் 916 தங்கத்தில் செய்யப்படுகின்றன.' }
  ];
  const crumbList = [{ name: 'முகப்பு', path: '/ta/' }, { name: nm }];
  const main = `<main id="main">
${hero({
    crumbsHtml: crumbs(ctx, crumbList, { label: 'பாதை' }),
    h1: `${esc(nm)}யில் இன்றைய தங்கம் விலை`,
    answer: `இன்று, <time datetime="${date}">${taDate(date)}</time>, ${esc(nm)}யில் 22 காரட் ஆபரணத் தங்கம் ஒரு சவரன் (8 கிராம்) <strong class="num">${inr(r['22K'] * 8)}</strong>, ஒரு கிராம் <strong class="num">${inr(r['22K'])}</strong>. நேற்றை விட சவரனுக்கு ₹${Math.abs(r.chg22 * 8)} ${updown(r.chg22)}.`,
    tilesHtml: t,
    stampHtml: stamp([`${live}${esc(nm)} விலை, ${taTime(r.at)}`, 'GST, செய்கூலி தனி'], R.sample ? 'மாதிரி விலை' : '')
  })}
${myCityBar('ta')}
${twoCol([weights, adSlot(ctx, 'lb'), hist, faqCard('f-h', 'அடிக்கடி கேட்கப்படும் கேள்விகள்', faqs)].join('\n'),
    [`<div class="box"><h2>${esc(nm)} உங்கள் நகரமா?</h2><p class="hint">சேமித்தால், அடுத்த முறை முகப்பில் ${esc(nm)} விலை முதலில் தெரியும்.</p><button type="button" class="btn btn-dark" data-save-city="${c.slug}">என் நகரமாக சேமி</button></div>`,
      railLinks('மேலும்', [[ctx.url('/ta/'), 'இன்றைய தங்கம் விலை', inr(N['22K'].g)], [ctx.url(`/gold-rate/${c.slug}/`), `Gold rate in ${esc(c.name)}`, 'English', 'en']]), adSlot(ctx, 'mr')].join('\n'), 'மேலும் விலைகள்')}
</main>`;
  const title = `${nm}யில் இன்றைய தங்கம் விலை (${taDate(date)}): சவரன் ${inr(r['22K'] * 8)}`;
  const description = `${nm}யில் இன்றைய தங்கம் விலை: 22 காரட் ஒரு சவரன் ${inr(r['22K'] * 8)}, ஒரு கிராம் ${inr(r['22K'])}. 24 காரட், வெள்ளி விலை மற்றும் கடந்த நாட்களின் சவரன் விலை.`;
  return {
    ...pageOut(ctx, {
      path, title, description, active: 'cities', main, faqs, crumbsList: crumbList, lang: 'ta', pageId: 'ta-city',
      alternates: [{ lang: 'en-IN', path: `/gold-rate/${c.slug}/` }, { lang: 'ta-IN', path }], altPath: `/gold-rate/${c.slug}/`
    }),
    lastmod: r.at
  };
}
