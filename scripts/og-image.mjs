// Renders public/og.png (1200×630 social preview) with Playwright. Run once after changing the brand:
//   npx playwright install chromium && node scripts/og-image.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const font = fileURLToPath(new URL('../public/assets/fonts/jakarta-latin.woff2', import.meta.url));
const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
const html = `<!doctype html><html><head><style>
@font-face{font-family:J;src:url(data:font/woff2;base64,${readFileSync(font).toString('base64')}) format('woff2');font-weight:200 800}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;font-family:J,sans-serif;background:#6E1A2A;color:#FFF8EC;position:relative;overflow:hidden}
.pat{position:absolute;inset:0}
.in{position:relative;padding:72px 80px;display:flex;flex-direction:column;height:100%;justify-content:space-between}
.logo{display:flex;align-items:center;gap:18px;font-size:40px;font-weight:800;color:#fff;letter-spacing:-.02em}
h1{margin:0;font-size:84px;line-height:1.02;letter-spacing:-.04em;font-weight:800;color:#fff;max-width:740px}
h1 b{color:#F2C35B}
.row{display:flex;gap:16px}
.chip{border:2px solid rgba(255,255,255,.28);border-radius:999px;padding:14px 26px;font-size:28px;font-weight:700;color:#F3E4D4}
.chip.on{background:#F2C35B;border-color:#F2C35B;color:#1C1A17}
.bars{position:absolute;right:80px;top:96px;display:flex;gap:14px;align-items:flex-end}
.bars i{display:block;width:34px;border-radius:8px 8px 0 0;background:#F2C35B}
</style></head><body>
<svg class="pat" viewBox="0 0 1200 630"><defs><pattern id="j" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M24 4 L44 24 L24 44 L4 24 Z" fill="none" stroke="#F2C35B" stroke-opacity=".08"/></pattern><radialGradient id="g" cx="25%" cy="35%" r="65%"><stop offset="0" stop-color="#F2C35B" stop-opacity=".10"/><stop offset="1" stop-color="#F2C35B" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="url(#j)"/><rect width="1200" height="630" fill="url(#g)"/></svg>
<div class="bars"><i style="height:90px;opacity:.35"></i><i style="height:130px;opacity:.5"></i><i style="height:110px;opacity:.65"></i><i style="height:170px;opacity:.8"></i><i style="height:210px"></i></div>
<div class="in">
<div class="logo"><svg width="64" height="64" viewBox="0 0 36 36"><circle cx="18" cy="18" r="17" fill="#FFF8EC"/><circle cx="18" cy="18" r="12" fill="none" stroke="#6E1A2A" stroke-width="2"/><path d="M11 21h14l-2.5-6h-9z" fill="#6E1A2A"/></svg><span>Daily Gold Rate <span style="color:#F2C35B">India</span></span></div>
<h1>Gold rate <b>today</b><br>in every city</h1>
<div class="row"><span class="chip on">22K</span><span class="chip">24K</span><span class="chip">Pavan · Tola · Grams</span><span class="chip">Calculator</span></div>
</div></body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
await p.screenshot({ path: out });
await b.close();
console.log('Wrote', out);
