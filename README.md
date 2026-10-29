# Kanak: Gold Rate Today

A fast, SEO-first website for daily gold rates in India. Pages are plain HTML built from one data file, so every rate is in the page source (Google can read it, and it loads instantly). A small script adds the interactive parts.

> **Status: preview.** Rates are sample data, legal pages are drafts, and the site tells search engines not to index it. See [Before launch](#before-launch).

## Pages

| Page | URL | What it does |
|---|---|---|
| Home | `/` | Rate board (purity and weight toggles), 10-day range meters, "why gold moved" chart, price by weight, 10-day trend, city finder, bill build-up, FAQ, WhatsApp alert sign-up |
| Cities hub | `/gold-rate/` | Search and filter all cities, plus one comparison table |
| City pages ×10 | `/gold-rate/chennai/` … | Local board, city vs India, price by weight in local units (sovereign, pavan or 10 g), budget planner, nearby cities, FAQ |
| Calculator | `/gold-price-calculator/` | Making charge, wastage, stones, 3% GST and old-gold exchange, with a receipt, a donut chart, WhatsApp share and print |
| Legal centre | `/privacy-policy/`, `/terms-of-use/`, `/disclaimer/`, `/grievance-redressal/` | DPDP-style privacy policy, terms, disclaimer and disclosures, grievance officer page with a contact form |
| 404 | any unknown URL | Friendly not-found page |

## How it works

```
data/rates.json     today's rates, 10-day history, city rates, benchmarks, editor note
data/cities.json    city list: name, state, region, local unit, nearby cities
src/pages/*.mjs     page templates (home, city, calculator, legal)
src/lib/*.mjs       layout (header, footer, cookie banner), shared parts, formatting
src/content/*.html  legal page text (drafts for review)
public/             CSS, JavaScript, self-hosted Inter font, favicon, social image
build.mjs           builds everything into dist/
```

No framework and no npm dependencies. Node 20 or newer is all you need.

## Run it locally

```bash
npm run dev        # builds and serves at http://localhost:4173
npm run check      # builds, then checks links, anchors, headings, labels and JSON-LD
```

## Updating the rates every day

The GitHub Actions workflow runs on every push and at **12:20 PM IST, Monday to Saturday**.

- **Manually:** edit `data/rates.json` and push. The build checks the file and refuses to publish broken data (for example, if the last history day does not match today's rate).
- **Automatically:** add a repository secret `RATES_FEED_URL` (and optionally `RATES_FEED_TOKEN`) pointing to a JSON feed. `scripts/update-rates.mjs` merges it into `data/rates.json`, commits it and the site rebuilds. The expected feed format is documented at the top of that script.

Use a rate source you are licensed to republish (for example a paid bullion data API or IBJA under agreement). Do not scrape other gold-rate websites.

## Deploying on GitHub Pages

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. After that, every push to `main` publishes the site at `https://<user>.github.io/<repo>/`.

Optional repository **variables** (Settings → Secrets and variables → Actions → Variables):

| Variable | Effect |
|---|---|
| `SITE_INDEX` = `true` | Lets search engines index the site. Leave unset until launch. |
| `FORM_ENDPOINT` | URL that receives the alert and grievance forms as JSON (Formspree, a Google Apps Script, or your own API). Without it the forms validate but send nothing, and say so. |

For a custom domain, add it under Settings → Pages; the build picks up the new address automatically.

## Before launch

- [ ] Replace sample rates with a licensed data feed and set `"sample": false` (the feed script does this).
- [ ] Fill every `[bracketed]` placeholder: company legal name, editor, grievance officer, data-protection contact, addresses, dates, rate sources per city.
- [ ] Have an Indian lawyer review the Privacy Policy, Terms, Disclaimer and Grievance pages.
- [ ] Connect the forms (`FORM_ENDPOINT`) and a WhatsApp Business provider for alerts, with consent records.
- [ ] Load analytics or ads only after cookie consent (listen for the `kanak:consent` event in `public/assets/app.js`).
- [ ] Set `SITE_INDEX=true`, then submit `sitemap.xml` in Google Search Console.

## Built-in quality checks

`npm run check` fails the build if any page has a broken internal link or anchor, more than one H1, a skipped heading level, an unlabelled form field, duplicate ids, invalid JSON-LD, or leftover `undefined`/`NaN` text.
