# Daily Gold Rate India (dailygoldrateindia.com)

A fast, SEO-first website for daily gold rates in India. Pages are plain HTML built from one data file, so every rate is in the page source: Google reads it on the first crawl and phones load it instantly. A small script adds the city filter, the saved-city bar and the calculator.

> **Status:** real IBJA rates. Pages are indexable on https://dailygoldrateindia.com and `noindex` on the github.io review address. See [Before launch](#before-launch).

## Pages (27)

| Pages | URLs | Main searches they target |
|---|---|---|
| Home | `/` | gold rate today, today gold rate, gold price today |
| Carat | `/22-carat-gold-rate/`, `/24-carat-gold-rate/`, `/18-carat-gold-rate/` | 22 carat gold price, 18 carat gold rate today, 916 gold rate |
| Silver, IBJA | `/silver-rate-today/`, `/ibja-gold-rate/` | silver rate today, ibja gold rate today |
| Units | `/1-gram-gold-rate/`, `/1-pavan-gold-rate/`, `/10-gram-gold-rate/`, `/1-tola-gold-rate/` | 1 pavan gold rate today, 10 gram gold rate |
| Cities | `/gold-rate/` and `/gold-rate/{city}/` (10 cities) | today gold rate in chennai, gold rate today kerala |
| History | `/gold-rate-history/`, `/gold-rate-history/2026/october/` | gold rate in october 2026 |
| Calculator | `/gold-price-calculator/` | gold price calculator with gst |
| Footer | `/privacy-policy/`, `/disclaimer/` | About and Contact are off for now; add them back before applying for AdSense |

A city page is published only when we have that city's own rate. Month pages are created automatically for every month in the history data.

## SEO built in

- **Title** with date and price on every rate page, under about 65 characters, unique per page.
- **Meta description** 70 to 175 characters, unique per page.
- **Canonical** on every page, absolute, built from `SITE_URL`.
- **English only** for now. Tamil pages (`/ta/`, `/ta/chennai/`) are built in but switched off; set `tamil: true` in `src/config.mjs` to bring them back with hreflang pairs.
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

## Daily rates (automatic, from IBJA)

`scripts/ibja-rates.mjs` reads https://ibjarates.com/ in the GitHub workflow and rebuilds the site. No one needs to type rates.

| When (IST) | What happens |
|---|---|
| 12:01 AM, every day | The date moves to today. If IBJA has not published yet, the last rate stays, labelled with its day. |
| 12:45 PM, Mon to Fri | IBJA morning rate. |
| 6:15 PM and 7:15 PM, Mon to Fri | IBJA closing rate (the one used for history). |

- 24K = IBJA 999, 22K = 916, 18K = 750, per gram, before 3% GST and making charges. Silver = IBJA 999 per kg.
- History (last 30 trading days) comes from IBJA's own closing rates.
- IBJA does not publish on Saturdays, Sundays and market holidays. Those days show today's date with the last IBJA rate, change 0, and a line saying which day the rate is from.
- Every city shows the national IBJA rate, labelled "local board rate is not yet available".
- If ibjarates.com is down or changes its page, the run logs a warning, keeps the last rates and still publishes.
- **Rights:** ibjarates.com says "All Rights Reserved" and asks businesses to use the official IBJA API. To be fully safe, subscribe to the IBJA API and point the script at it.

**By hand (only if IBJA is down):** Actions → Build and deploy → Run workflow, type 24K/22K/18K per gram, press Run. Leave every box blank to fetch IBJA immediately. The next scheduled IBJA fetch replaces typed rates.

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

- [ ] Contact email is `thilakarseto@gmail.com` for now (`src/config.mjs`); move to a domain mailbox later.
- [ ] Privacy Policy and Disclaimer reviewed by an Indian lawyer.
- [ ] Custom domain live with HTTPS, then sitemap submitted.
- [ ] AdSense applied for in week 3 to 4; `ADSENSE_CLIENT` set after approval.
