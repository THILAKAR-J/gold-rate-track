// Legal centre pages. Body text lives in src/content/*.html (drafts for legal review).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { page, crumbs, breadcrumbLd, linkify } from '../lib/layout.mjs';
import { esc } from '../lib/format.mjs';

const content = (name) => readFileSync(fileURLToPath(new URL(`../content/${name}.html`, import.meta.url)), 'utf8');

export const LEGAL = [
  { id: 'privacy', path: '/privacy-policy/', name: 'Privacy Policy', file: 'privacy', description: 'What personal data the site collects, why, how long we keep it and your rights under India\'s DPDP Act, 2023 and DPDP Rules, 2025.' },
  { id: 'terms', path: '/terms-of-use/', name: 'Terms of Use', file: 'terms', description: 'The rules for using our gold rates, calculators and alerts, governed by the laws of India.' },
  { id: 'disclaimer', path: '/disclaimer/', name: 'Disclaimer and disclosures', file: 'disclosures', description: 'How our gold rates are sourced, why they are not investment advice, how we make money and how we correct mistakes.' },
  { id: 'grievance', path: '/grievance-redressal/', name: 'Grievance and contact', file: 'grievance', description: 'Report a wrong rate, ask about your personal data or raise a complaint. Grievance Officer details and response times.' }
];

function side(ctx, current) {
  const a = (path, name, on) => `<a href="${ctx.url(path)}"${on ? ' aria-current="page"' : ''}>${name}</a>`;
  return `<nav class="side" aria-label="Legal pages">
<p>LEGAL CENTRE</p>
${a('/privacy-policy/', 'Privacy Policy', current === 'privacy')}
${a('/terms-of-use/', 'Terms of Use', current === 'terms')}
${a('/disclaimer/', 'Disclaimer and disclosures', current === 'disclaimer')}
${a('/disclaimer/#ads', 'Advertising and affiliates')}
${a('/disclaimer/#editorial', 'Editorial policy')}
${a('/disclaimer/#corrections', 'Corrections')}
${a('/grievance-redressal/', 'Grievance and contact', current === 'grievance')}
</nav>`;
}

const TOPICS = [
  { id: 'rate', label: 'A wrong rate or fact', icon: 'M4 18 L7 8 H17 L20 18 Z M12 11 V14', hint: 'Which page, which rate, and what you believe it should be.' },
  { id: 'data', label: 'My personal data', icon: 'M12 2 L20 5 V11 C20 16 16.5 19.5 12 21 C7.5 19.5 4 16 4 11 V5 Z', hint: 'Tell us what you want: a copy, a correction, deletion, or to withdraw consent.' },
  { id: 'content', label: 'A complaint about content', icon: 'M4 4 H20 V16 H9 L4 20 Z M9 9 H15', hint: 'The page link and what is wrong with it.' },
  { id: 'other', label: 'Something else', icon: 'M12 3 a9 9 0 1 0 0.01 0 Z M9 10 a3 3 0 1 1 3 3 V14 M12 17.5 V18', hint: 'How can we help?' }
];

function grievanceForm(ctx) {
  const topics = TOPICS.map(
    (t, i) =>
      `<button type="button" class="topic${i === 0 ? ' on' : ''}" aria-pressed="${i === 0}" data-topic="${t.id}" data-hint="${esc(t.hint)}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${t.icon}"/></svg>${esc(t.label)}</button>`
  ).join('');
  return `<form class="card stack" aria-labelledby="form-h" style="gap: 20px" data-form="grievance" novalidate>
<h2 id="form-h" class="h2">Send us a message</h2>
<fieldset class="bare">
<legend>What is it about?</legend>
<div class="topics">${topics}</div>
<input type="hidden" name="topic" value="rate">
</fieldset>
<div class="row2">
<div class="field"><label for="g-n">Your name</label><input id="g-n" name="name" class="in" autocomplete="name" required></div>
<div class="field"><label for="g-e">Email or WhatsApp number</label><input id="g-e" name="contact" class="in" autocomplete="email" required></div>
</div>
<div class="field"><label for="g-d">Details</label><textarea id="g-d" name="details" class="in" rows="5" placeholder="${esc(TOPICS[0].hint)}" required></textarea></div>
<label class="consent"><input type="checkbox" name="consent" required><span>I agree that ${esc(ctx.site.name)} may use these details to handle this request, as set out in the <a href="${ctx.url('/privacy-policy/')}">Privacy Policy</a>.</span></label>
<div class="form-foot">
<button type="submit" class="btn btn-dark">Send message</button>
<span class="hint">Please don't include bank, card, PAN or Aadhaar details.</span>
</div>
<p class="form-msg" role="status" aria-live="polite" data-msg></p>
</form>
<div class="ok" role="status" tabindex="-1" data-ok hidden>
<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" style="flex: none"><circle cx="22" cy="22" r="20" fill="#0B7A55"/><path d="M13 22 L19 28 L31 16" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
<div class="stack" style="gap: 8px">
<p style="margin: 0; font-size: 20px; font-weight: 800" data-ok-title>Thank you. We have your message.</p>
<p class="sub" data-ok-text>We'll confirm by email or WhatsApp within 24 hours.</p>
<button type="button" class="btn btn-line" style="align-self: flex-start" data-again>Send another message</button>
</div>
</div>`;
}

export function legalPage(ctx, L) {
  let body = linkify(ctx, content(L.file));
  body = body.replace(/\bKanak\b/g, esc(ctx.site.name));
  if (L.id === 'grievance') body += '\n' + grievanceForm(ctx);
  const crumbItems = [{ name: 'Home', path: '/' }, { name: L.name }];
  const main = `<main id="main" class="wrap main" style="padding-top: 20px">
<div class="stack">
${crumbs(ctx, crumbItems)}
<div class="legal">
${side(ctx, L.id)}
<div class="stack" style="gap: 20px; min-width: 0">
${body}
</div>
</div>
</div>
</main>`;
  return {
    path: L.path,
    html: page(ctx, {
      path: L.path,
      title: `${L.name} | ${ctx.site.name}`,
      description: L.description,
      active: L.id === 'grievance' ? 'contact' : '',
      pageId: L.id === 'grievance' ? 'grievance' : 'legal',
      ticker: null,
      main,
      data: L.id === 'grievance' ? { endpoint: ctx.site.formEndpoint } : undefined,
      jsonld: [breadcrumbLd(ctx, [{ name: 'Home', path: '/' }, { name: L.name, path: L.path }])]
    })
  };
}

export function notFoundPage(ctx) {
  const main = `<main id="main" class="wrap main nf">
<section class="lhero" aria-labelledby="h1">
<div class="stack" style="gap: 12px">
<h1 id="h1" class="title">We couldn't find that page</h1>
<p class="lead">The link may be old, or the page may have moved. Today's rates are one tap away.</p>
<div style="display: flex; gap: 8px; flex-wrap: wrap"><a class="btn btn-gold" href="${ctx.url('/')}">Gold rate today</a><a class="btn btn-dline" href="${ctx.url('/gold-rate/')}">Find your city</a></div>
</div>
<svg class="lart" viewBox="0 0 168 150" aria-hidden="true"><circle cx="72" cy="66" r="40" fill="#161D23" stroke="#E8B64C" stroke-width="5"/><path d="M101 95 L140 134" stroke="#E8B64C" stroke-width="10" stroke-linecap="round"/><text x="72" y="78" text-anchor="middle" font-size="30" font-weight="800" fill="#E8B64C" font-family="Inter, sans-serif">?</text></svg>
</section>
</main>`;
  return {
    path: '/404.html',
    html: page(ctx, { path: '/404.html', title: `Page not found | ${ctx.site.name}`, description: 'This page does not exist.', active: '', pageId: 'nf', ticker: null, main, noindex: true })
  };
}
