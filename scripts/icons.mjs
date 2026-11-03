// Renders the app icons in public/icons from the logo. Run after changing the logo: node scripts/icons.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const out = (f) => fileURLToPath(new URL('../public/icons/' + f, import.meta.url));
const mark = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="100%" height="100%" style="display:block"><rect x="${pad}" y="${pad}" width="${34 - 2 * pad}" height="${34 - 2 * pad}" rx="${pad ? 0 : 9}" fill="#12161A"/><g transform="translate(17 17) scale(${pad ? 0.8 : 1}) translate(-17 -17)"><path d="M9 23 L12 12 H22 L25 23 Z" fill="#E8B64C"/><path d="M6 27 H28" stroke="#E8B64C" stroke-width="1.6" stroke-linecap="round"/></g></svg>`;
const b = await chromium.launch();
const p = await b.newPage();
for (const [f, s, pad] of [['icon-180.png', 180, 0], ['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 0.0001]]) {
  await p.setViewportSize({ width: s, height: s });
  await p.setContent(`<html><body style="margin:0;background:${pad ? '#12161A' : 'transparent'}">${mark(pad ? 0.0001 : 1)}</body></html>`);
  await p.screenshot({ path: out(f), omitBackground: !pad });
}
await b.close();
console.log('icons written');
