// Renders the app icons in public/icons from the logo. Run after changing the logo: node scripts/icons.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const out = (f) => fileURLToPath(new URL('../public/icons/' + f, import.meta.url));
const mark = (full) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="100%" height="100%" style="display:block">${full ? '<rect width="36" height="36" fill="#6E1A2A"/>' : '<circle cx="18" cy="18" r="17" fill="#6E1A2A"/>'}<g transform="translate(18 18) scale(${full ? 0.78 : 1}) translate(-18 -18)"><circle cx="18" cy="18" r="12" fill="none" stroke="#F2C35B" stroke-width="2"/><path d="M11 21h14l-2.5-6h-9z" fill="#F2C35B"/></g></svg>`;
const b = await chromium.launch();
const p = await b.newPage();
for (const [f, s, pad] of [['icon-180.png', 180, 1], ['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 1]]) {
  await p.setViewportSize({ width: s, height: s });
  await p.setContent(`<html><body style="margin:0;background:${pad ? '#6E1A2A' : 'transparent'}">${mark(pad)}</body></html>`);
  await p.screenshot({ path: out(f), omitBackground: !pad });
}
await b.close();
console.log('icons written');
