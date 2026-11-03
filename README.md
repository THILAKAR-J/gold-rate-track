# Daily Gold Rate India (dailygoldrateindia.com)

A fast, SEO-first website for daily gold rates in India. Pages are plain HTML built from one data file, so every rate is in the page source: Google reads it on the first crawl and phones load it instantly. A small script adds the city filter, the saved-city bar and the calculator.

> **Status: review build.** Rates are sample data (27 October 2026), [bracketed] details are placeholders, and every page says `noindex` until real rates are entered on https://dailygoldrateindia.com. See [Before launch](#before-launch).

## Pages (31)

| Pages | URLs | Main searches they target |
|---|---|---|
| Home | `/` | gold rate today, today gold rate, gold price today |
| Carat | `/22-carat-gold-rate/`, `/24-carat-gold-rate/`, `/18-carat-gold-rate/` | 22 carat gold price, 18 carat gold rate today, 916 gold rate |
| Silver, IBJA | `/silver-rate-today/`, `/ibja-gold-rate/` | silver rate today, ibja gold rate today |
| Units | `/1-gram-gold-rate/`, `/1-pavan-gold-rate/`, `/10-gram-gold-rate/`, `/1-tola-gold-rate/` | 1 pavan gold rate today, 10 gram gold rate |
| Cities | `/gold-rate/` and `/gold-rate/{city}/` (10 cities) | today gold rate in chennai, gold rate today kerala |
| History | `/gold-rate-history/`, `/gold-rate-history/2026/october/` | gold rate in october 2026 |
| Calculator | `/gold-price-calculator/` | gold price calculator with gst |
| Tamil | `/ta/`, `/ta/chennai/` | தங்கம் விலை இன்று, சென்னை தங்கம் விலை |
| Footer | `/about/`, `/contact/`, `/privacy-policy/`, `/disclaimer/` | trust pages AdSense needs |

A city page is published only when we have that city's own rate. Month pages are created automatically for every month in the history data.

## SEO built in

- **Title** with date and price on every rate page, under about 65 characters, unique per page.
- **Meta description** 70 to 175 characters, unique per page.
- **Canonical** on every page, absolute, built from `SITE_URL`.
- **hreflang** pairs for English and Tamil pages, plus `x-default`, also listed in the sitemap.
- **JSON-LD**: Organization and WebSite (home), WebPage on every page, BreadcrumbList, FAQPage (matching the visible questions), Dataset on month pages, ItemList on the cities page, WebApplication on the calculator.
- **sitemap.xml** with `lastmod` and hreflang alternates; **robots.txt** pointing to it.
- **Open Graph and Twitter** tags with a 1200×630 image; web app manifest and home-screen icons.
- **Indexing is automatic:** pages are indexable only when built for https://dailygoldrateindia.com with real (non-sample) rates. The github.io address is always `noindex`. `SITE_INDEX=true|false` overrides.

`node scripts/check.mjs` checks all of the above, plus headings, labels, duplicate ids, internal links and anchors, on every build. The GitHub workflow will not publish if a check fails.

## Run it locally

```bash
npm run dev        # build and serve at http://localhost:4173
npm run check      # build, then run every SEO and quality check
```

## Daily rates

**By hand, from a phone or laptop (no coding):** GitHub → Actions → **Build and deploy** → **Run workflow**, fill the boxes, press Run. In about two minutes the site is rebuilt with the new rates.

| Box | Example | Notes |
|---|---|---|
| 24K / 22K / 18K per gram | `14329` / `13135` / `10747` | Required. Commas and ₹ are fine. |
| Silver per kg | `181000` | Needed the first time; after that, blank keeps yesterday's. |
| IBJA 999 | `14310` | Optional. Defaults to the 24K rate. |
| Yesterday | `14200/13017/10650` | **First time only** (24K/22K/18K), so today's change is right. |
| Cities | `chennai=14340/13145/10760; mumbai=…` | Optional. 24K/22K/18K. Cities not listed show the national rate, labelled "local board rate not yet available". |
| Date, note | `2026-11-03` | Optional. Date defaults to today (IST). |

The form refuses numbers that do not add up (24K must be above 22K, 22K above 18K; city names must match). Each entry is committed to `data/rates.json`, and the last 30 days build the history pages and charts.

**Automatic:** add a repository secret `RATES_FEED_URL` (and `RATES_FEED_TOKEN`). The scheduled run at 12:20 PM IST, Monday to Saturday, merges the feed through `scripts/merge-rates.mjs`. Use a source licensed for republishing.

## Settings (GitHub → Settings → Secrets and variables → Actions → Variables)

| Variable | Effect |
|---|---|
| `SITE_INDEX` = `true` / `false` | Overrides the automatic indexing rule. Normally leave it unset. |
| `ADSENSE_CLIENT` = `ca-pub-…` | Turns on the ad slots (one under the city table, two in the side rail). Leave empty until AdSense approves the site. |

## Going live on dailygoldrateindia.com

1. **DNS at the registrar** (delete any old A/CNAME records for `@` and `www` first):
   - `A` `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` `www` → `thilakar-j.github.io`
2. GitHub → Settings → Pages → Custom domain: `dailygoldrateindia.com` → Save. When the DNS check is green, tick **Enforce HTTPS**.
3. Enter today's rates with **Run workflow** (above). That build uses https://dailygoldrateindia.com for canonicals, hreflang, schema and the sitemap, and turns indexing on.
4. Submit `https://dailygoldrateindia.com/sitemap.xml` in Google Search Console (Domain property) and Bing Webmaster Tools.

## Before launch

- [ ] Real rates entered (form or feed); `"sample": false` in the data.
- [ ] Every [bracketed] placeholder filled: owner name, city and postal address, grievance officer, courts' city.
- [ ] `contact@dailygoldrateindia.com` mailbox working.
- [ ] Tamil text checked by a Tamil reader.
- [ ] Privacy Policy and Disclaimer reviewed by an Indian lawyer.
- [ ] Custom domain live with HTTPS, then sitemap submitted.
- [ ] AdSense applied for in week 3 to 4; `ADSENSE_CLIENT` set after approval.
