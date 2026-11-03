// Footer pages (About, Contact, Privacy Policy, Disclaimer) and the 404 page. Drafts: [bracketed] items need real details.
import { esc, longDate } from '../lib/format.mjs';
import { page, crumbs } from '../lib/layout.mjs';
import { hero } from '../lib/parts.mjs';
import { pageOut } from './rates.mjs';

const ph = (s) => `<span class="ph">${esc(s)}</span>`;

function infoPage(ctx, { path, name, h1, lead, body, title, description, pageId }) {
  const crumbList = [{ name: 'Home', path: '/' }, { name }];
  const main = `<main id="main">
${hero({ crumbsHtml: crumbs(ctx, crumbList), h1, answer: lead })}
<div class="wrap" style="padding-top: 32px; padding-bottom: 32px">
<article class="card"><div class="prose">
${body}
</div></article>
</div>
</main>`;
  return { ...pageOut(ctx, { path, title, description, active: '', main, crumbsList: crumbList, pageId }), lastmod: ctx.buildDate };
}

export function aboutPage(ctx) {
  const mail = `<a href="mailto:${ctx.site.email}">${ctx.site.email}</a>`;
  return infoPage(ctx, {
    path: '/about/', name: 'About', pageId: 'about',
    h1: `About ${esc(ctx.site.name)}`,
    lead: "Today's gold rate for India and its cities, in the units people actually buy in, with the time and source of every rate.",
    title: `About ${ctx.site.name}: How We Track Gold Rates in India`,
    description: `${ctx.site.name} publishes daily 22K and 24K gold rates for India and its cities, with the source and update time of every rate. Who we are and how we work.`,
    body: `<h2>What we do</h2>
<p>We publish the gold rate for India and for each city we cover, every day, per gram and in the local unit: the sovereign (pavan) in Tamil Nadu and Kerala, 10 grams and the tola elsewhere. Every rate shows when it was updated.</p>
<h2>Where the rates come from</h2>
<p>National rates follow the IBJA benchmark. Where we have a city's own published rate, the city page shows it; where we do not yet, the city page shows the national rate and says so. A person enters and checks the rates every working day.</p>
<p>Rates are before 3% GST and making charges, so a shop's bill will be higher. The <a href="${ctx.url('/gold-price-calculator/')}">gold price calculator</a> adds those for your piece.</p>
<h2>How we write</h2>
<ul><li>We explain rates; we do not tell anyone when to buy or sell.</li><li>Sponsored content and ads are always labelled.</li><li>If we get a rate wrong, we correct it and note the correction on the page.</li></ul>
<h2>Who runs this site</h2>
<p>${esc(ctx.site.name)} is run by ${ph(ctx.site.legalName)}, ${ph('[city, state]')}. Write to us at ${mail}.</p>`
  });
}

export function contactPage(ctx) {
  const mail = `<a href="mailto:${ctx.site.email}">${ctx.site.email}</a>`;
  return infoPage(ctx, {
    path: '/contact/', name: 'Contact', pageId: 'contact',
    h1: 'Contact us',
    lead: `Report a wrong rate, ask for your city, or ask a question. Email ${esc(ctx.site.email)}.`,
    title: 'Contact Us: Report a Wrong Gold Rate or Ask for Your City',
    description: `Contact ${ctx.site.name} to report a wrong gold rate, ask us to add your city or raise a concern. We reply within two working days.`,
    body: `<h2>Email</h2>
<p>${mail} (${ph('set up this mailbox before launch')})</p>
<h2>What to include</h2>
<ul><li><b>A wrong rate:</b> the page link, the rate you see, and the rate you believe is right with its source.</li><li><b>A new city:</b> the city or town, and the jewellers' association or board that announces its rate, if you know it.</li><li><b>Anything else:</b> a short description and how we can reach you.</li></ul>
<h2>When we reply</h2>
<p>A reported wrong rate is checked within 2 hours during business hours. Other messages get a reply within two working days.</p>
<h2>Grievance officer</h2>
<p>${ph('[Name]')}, ${ph('[designation]')}, at the same email address. Complaints are resolved within 15 days.</p>
<p>Please do not send bank, card, PAN or Aadhaar details.</p>`
  });
}

export function privacyPage(ctx) {
  const mail = `<a href="mailto:${ctx.site.email}">${ctx.site.email}</a>`;
  return infoPage(ctx, {
    path: '/privacy-policy/', name: 'Privacy Policy', pageId: 'privacy',
    h1: 'Privacy Policy',
    lead: `You can use every page without telling us who you are. Updated ${longDate(ctx.buildDate)}. Draft for legal review.`,
    title: `Privacy Policy | ${ctx.site.name}`,
    description: `How ${ctx.site.name} handles data: no sign-up, your saved city stays on your device, and analytics or ad cookies only where the law allows. Your DPDP rights.`,
    body: `<h2>Who we are</h2>
<p>${esc(ctx.site.name)} (${esc(ctx.site.domain)}) is run by ${ph(ctx.site.legalName)}, ${ph('[postal address]')}. Contact: ${mail}.</p>
<h2>What we collect</h2>
<ul><li><b>Nothing to use the site.</b> There is no sign-up, login or form you must fill.</li><li><b>Your saved city.</b> If you choose a city, your browser stores it and the last rate you saw, on your device only (local storage). It is never sent to us. Clear it any time by clearing site data in your browser.</li><li><b>Server logs.</b> Our hosting and content delivery providers record IP address, browser type and time of each request, for security and to keep the site running.</li><li><b>Emails you send us.</b> Your email address and message, used only to reply.</li></ul>
<h2>Analytics and ads</h2>
<p>The site does not use analytics or advertising cookies today. When we add Google Analytics or Google AdSense, Google may use cookies to count visits and to show and measure ads. Where the law requires it, we will ask for your consent first, and we will update this page before they go live. Google explains how it uses data at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a>.</p>
<h2>Sharing</h2>
<p>We do not sell personal data. We share it only with the providers that host and deliver this site, and when the law requires.</p>
<h2>How long we keep it</h2>
<p>Emails: up to one year after your question is closed. Server logs: as long as our providers keep them, usually up to 90 days.</p>
<h2>Your rights</h2>
<p>Under India's Digital Personal Data Protection Act, 2023, you can ask to see, correct or erase personal data we hold about you, and raise a grievance. Write to ${mail}; we reply within 30 days. If you are not satisfied, you may complain to the Data Protection Board of India.</p>
<h2>Children</h2>
<p>This site is meant for adults. We do not knowingly collect data from anyone under 18.</p>
<h2>Changes</h2>
<p>We update the date at the top of this page when this policy changes.</p>`
  });
}

export function disclaimerPage(ctx) {
  const mail = `<a href="mailto:${ctx.site.email}">${ctx.site.email}</a>`;
  return infoPage(ctx, {
    path: '/disclaimer/', name: 'Disclaimer', pageId: 'disclaimer',
    h1: 'Disclaimer and terms of use',
    lead: 'Our rates are indicative and for information. They are not an offer to buy or sell, and not investment advice. Draft for legal review.',
    title: `Disclaimer and Terms of Use | ${ctx.site.name}`,
    description: `${ctx.site.name}'s gold rates are indicative, before GST and making charges, and not investment advice. Our sources, corrections, ads and terms of use.`,
    body: `<h2 id="rates">Rates are indicative</h2>
<p>National rates follow the IBJA benchmark and city rates follow local jewellers' boards, as published at the time shown on each page. Your jeweller's price will include 3% GST, making charges and their own margin, and may differ.</p>
<h2 id="advice">Not investment advice</h2>
<p>We report rates and explain them. We do not recommend buying, selling or holding gold or any investment product. Decide with a qualified adviser where needed.</p>
<h2 id="affiliation">No affiliation</h2>
<p>${esc(ctx.site.name)} is independent. We are not affiliated with IBJA, MCX, any bank or any jeweller. Names of organisations are used only to identify sources.</p>
<h2 id="accuracy">Accuracy</h2>
<p>We check rates carefully but cannot promise they are free of error or delay. To the extent the law allows, we are not liable for losses from relying on them. Please confirm the rate with your jeweller before you pay.</p>
<h2 id="ads">Ads and sponsored content</h2>
<p>The site may show ads. Anything paid for is marked "Ad" or "Sponsored" and never changes the rates we publish.</p>
<h2 id="corrections">Corrections</h2>
<p>Report an error to ${mail}. We fix confirmed errors quickly and note the correction on the page.</p>
<h2 id="terms">Using this site</h2>
<p>You may quote our rates with a link to the page. Do not copy the site in bulk, scrape it, or present our data as your own. These terms are governed by the laws of India, and courts in ${ph('[city]')} have jurisdiction.</p>`
  });
}

export function notFoundPage(ctx) {
  const main = `<main id="main">
<section class="hero" aria-labelledby="h1"><div class="wrap nf">
<h1 id="h1" class="h1">We couldn't find that page</h1>
<p class="answer">The link may be old, or the page may have moved. Today's rates are one tap away.</p>
<div style="display: flex; gap: 8px; flex-wrap: wrap"><a class="btn btn-gold" href="${ctx.url('/')}">Gold rate today</a><a class="btn btn-line" href="${ctx.url('/gold-rate/')}">Find your city</a></div>
</div></section>
</main>`;
  return { path: '/404.html', noindex: true, html: page(ctx, { path: '/404.html', title: `Page not found | ${ctx.site.name}`, description: 'This page does not exist or has moved. See today\'s gold rate in India, or find the gold rate in your city.', active: '', pageId: 'nf', main, noindex: true }) };
}
