// Renders public/og.png (1200×630 social preview) with Playwright. Run once after changing the brand:
//   npx playwright install chromium && node scripts/og-image.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const font = fileURLToPath(new URL('../public/assets/fonts/inter-var.woff2', import.meta.url));
const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
const html = `<!doctype html><html><head><style>
@font-face{font-family:Inter;src:url(file://${font}) format('woff2');font-weight:400 800}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;font-family:Inter,sans-serif;background:#0E1317;color:#F2EDE2;position:relative;overflow:hidden}
.pat{position:absolute;inset:0}
.in{position:relative;padding:72px 80px;display:flex;flex-direction:column;height:100%;justify-content:space-between}
.logo{display:flex;align-items:center;gap:18px;font-size:40px;font-weight:800;color:#fff;letter-spacing:-.02em}
h1{margin:0;font-size:84px;line-height:1.02;letter-spacing:-.04em;font-weight:800;color:#fff;max-width:740px}
h1 b{color:#E8B64C}
.row{display:flex;gap:16px}
.chip{border:2px solid #3A434B;border-radius:999px;padding:14px 26px;font-size:28px;font-weight:700;color:#DCD6CA}
.chip.on{background:#E8B64C;border-color:#E8B64C;color:#16120A}
.bars{position:absolute;right:80px;top:96px;display:flex;gap:14px;align-items:flex-end}
.bars i{display:block;width:34px;border-radius:8px 8px 0 0;background:#E8B64C}
</style></head><body>
<svg class="pat" viewBox="0 0 1200 630"><defs><pattern id="j" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M24 4 L44 24 L24 44 L4 24 Z" fill="none" stroke="#E8B64C" stroke-opacity=".09"/></pattern><radialGradient id="g" cx="25%" cy="35%" r="65%"><stop offset="0" stop-color="#E8B64C" stop-opacity=".16"/><stop offset="1" stop-color="#E8B64C" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="url(#j)"/><rect width="1200" height="630" fill="url(#g)"/></svg>
<div class="bars"><i style="height:90px;opacity:.35"></i><i style="height:130px;opacity:.5"></i><i style="height:110px;opacity:.65"></i><i style="height:170px;opacity:.8"></i><i style="height:210px"></i></div>
<div class="in">
<div class="logo"><svg width="64" height="64" viewBox="0 0 34 34"><rect x="1" y="1" width="32" height="32" rx="9" fill="#161D23" stroke="#3A434B"/><path d="M9 23 L12 12 H22 L25 23 Z" fill="#E8B64C"/><path d="M12 12 L14 9 H20 L22 12" fill="none" stroke="#E8B64C" stroke-width="1.6"/></svg>Kanak</div>
<h1>Gold rate <b>today</b>, city by city.</h1>
<div class="row"><span class="chip on">22K</span><span class="chip">24K</span><span class="chip">Pavan · Tola · Grams</span><span class="chip">Calculator</span></div>
</div></body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.waitForTimeout(300);
await p.screenshot({ path: out });
await b.close();
console.log('Wrote', out);
