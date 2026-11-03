# Gold Rate Track (goldratetrack.com)

A fast, SEO-first website for daily gold rates in India. Pages are plain HTML built from one data file, so every rate is in the page source: Google reads it on the first crawl and phones load it instantly. A small script adds the city filter, the saved-city bar and the calculator.

> **Status: review build.** Rates are sample data (27 October 2026), [bracketed] details are placeholders, and every page says `noindex` until launch. See [Before launch](#before-launch).

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
- `noindex` on every page until `SITE_INDEX=true`, so the review address never competes with the real domain.

`node scripts/check.mjs` checks all of the above, plus headings, labels, duplicate ids, internal links and anchors, on every build. The GitHub workflow will not publish if a check fails.

## Run it locally

```bash
npm run dev        # build and serve at http://localhost:4173
npm run check      # build, then run every SEO and quality check
```

## Daily rates

The workflow runs on every push and at **12:20 PM IST, Monday to Saturday**.

- **By hand:** edit `data/rates.json` and push. The build refuses data that does not add up.
- **Automatic:** add a repository secret `RATES_FEED_URL` (and `RATES_FEED_TOKEN` if needed). `scripts/update-rates.mjs` merges the feed, commits it and the site rebuilds. Use a source licensed for republishing.

## Settings (GitHub → Settings → Secrets and variables → Actions → Variables)

| Variable | Effect |
|---|---|
| `SITE_INDEX` = `true` | Lets search engines index the site. Set only on the real domain at launch. |
| `ADSENSE_CLIENT` = `ca-pub-…` | Turns on the ad slots (one under the city table, two in the side rail). Leave empty until AdSense approves the site. |

## Moving to goldratetrack.com

1. Buy the domain; also buy goldratetrack.in and forward it to the .com.
2. GitHub → Settings → Pages → Custom domain: `goldratetrack.com`, tick "Enforce HTTPS". Add the DNS records GitHub shows.
3. The next build uses the new address automatically for canonicals, hreflang and the sitemap.
4. Then set `SITE_INDEX=true`, and submit `https://goldratetrack.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Before launch

- [ ] Licensed rate feed connected; `"sample": false` in the data (the feed script sets it).
- [ ] Every [bracketed] placeholder filled: owner name and address, rate sources per city, grievance officer.
- [ ] `contact@goldratetrack.com` mailbox working.
- [ ] Tamil text checked by a Tamil reader.
- [ ] Privacy Policy and Disclaimer reviewed by an Indian lawyer.
- [ ] Custom domain live, then `SITE_INDEX=true`, then sitemap submitted.
- [ ] AdSense applied for in week 3 to 4; `ADSENSE_CLIENT` set after approval.
