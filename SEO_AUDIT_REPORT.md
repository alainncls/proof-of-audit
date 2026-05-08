# SEO and Lighthouse Audit Report

Date: 2026-05-08

Production URL: <https://audit.examples.ver.ax/>

## Executive Summary

The production site was indexable and passed Lighthouse's built-in SEO checks, but the deeper audit found missing crawl discovery files, missing canonical and structured data, thin rendered content, incomplete social metadata, non-optimal cache headers, render-blocking Google Fonts, eager wallet bundle loading, early analytics loading, and a Lighthouse Agentic Browsing gap.

The main performance issue was the initial mobile load. Lighthouse reported production mobile performance between 67 and 70 across independent runs, with LCP between 5.2s and 7.6s. The largest opportunities were unused JavaScript from the wallet/AppKit bundle, Google Tag Manager, and render-blocking font CSS.

Local validation after remediation scores 100 across Performance, Accessibility, Best Practices, SEO, and Agentic Browsing on both mobile and desktop Lighthouse runs.

## Audit Scope and Tools

- Skill used: `seo-audit` from `coreyhaines31/marketingskills`
- Production HTTP checks: `curl -I`, `curl` for `robots.txt`, `sitemap.xml`, and HTML
- Rendered DOM checks: headless Chromium `--dump-dom`
- Lighthouse: `npx lighthouse` 13.3.0
- Modes: mobile default throttling and desktop preset
- Local verification: Vite production build served with `npm run preview`

## Production Baseline

| Area              | Result                                                                            |
| ----------------- | --------------------------------------------------------------------------------- |
| HTTP status       | `https://audit.examples.ver.ax/` returned `200`                                   |
| HTTP to HTTPS     | `http://audit.examples.ver.ax/` redirected to HTTPS with `301`                    |
| HTTPS/HSTS        | Present, `strict-transport-security: max-age=31536000`                            |
| `robots.txt`      | Missing, returned Netlify `404`                                                   |
| `sitemap.xml`     | Missing, returned Netlify `404`                                                   |
| Canonical         | Missing from rendered DOM                                                         |
| Meta description  | Present and valid length                                                          |
| Open Graph        | Present, but URL lacked trailing slash alignment with canonical target            |
| Twitter metadata  | Missing `twitter:image`                                                           |
| Structured data   | No rendered `application/ld+json` scripts                                         |
| Heading structure | Valid but thin: only `h1 Proof of Audit`                                          |
| Raw HTML shell    | Meaningful app content depended on JavaScript                                     |
| Images            | Rendered image alt text present                                                   |
| Same-origin links | No same-origin crawl paths beyond the homepage                                    |
| Cache headers     | HTML and hashed assets returned `cache-control: public,max-age=0,must-revalidate` |
| Fonts             | Google Fonts CSS loaded synchronously in the document head                        |
| Analytics         | GA script loaded during early idle and appeared in Lighthouse unused JavaScript   |
| Wallet bundle     | Wallet/AppKit modules loaded during first render before user intent               |
| Agentic Browsing  | No `llms.txt` file                                                                |

## Lighthouse Baseline

Primary production Lighthouse run:

| Mode    | Performance | Accessibility | Best Practices | SEO | Agentic Browsing |  FCP |  LCP |   TBT |   CLS | Speed Index | Unused JS |
| ------- | ----------: | ------------: | -------------: | --: | ---------------: | ---: | ---: | ----: | ----: | ----------: | --------: |
| Mobile  |          70 |           100 |            100 | 100 |              100 | 4.0s | 5.2s | 100ms | 0.009 |        4.2s |   465 KiB |
| Desktop |          94 |           100 |            100 | 100 |              100 | 0.9s | 1.5s |  10ms | 0.002 |        0.9s |   465 KiB |

Independent subagent run showed similar desktop results and worse mobile variance:

| Mode    | Performance |  FCP |  LCP |   TBT |   CLS | Speed Index |
| ------- | ----------: | ---: | ---: | ----: | ----: | ----------: |
| Mobile  |          67 | 3.0s | 7.6s | 200ms | 0.009 |        3.1s |
| Desktop |          93 | 1.0s | 1.6s |  10ms | 0.003 |        1.0s |

Top Lighthouse diagnostics:

- Unused JavaScript: estimated 465 KiB, led by `WalletApp`, AppKit wallet list modules, and `gtag.js`.
- Render-blocking resources: production loaded app CSS and Google Fonts CSS before first paint.
- Long dependency chain: first render loaded the main entry, wallet chunk, AppKit modal, and wallet API dependencies.
- Mobile LCP was the primary Core Web Vitals weakness.
- Production source maps were not available for large first-party chunks. This is useful for debugging, but not a user-facing SEO or Core Web Vitals issue.

## Findings and Fixes

| Priority | Finding                                        | Evidence                                                                       | Fix Applied                                                                                                       |
| -------- | ---------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| High     | Missing crawl discovery files                  | `robots.txt` and `sitemap.xml` returned `404`                                  | Added `public/robots.txt` and `public/sitemap.xml`                                                                |
| High     | Missing canonical URL                          | Rendered DOM had no canonical link                                             | Added self-canonical `https://audit.examples.ver.ax/`                                                             |
| High     | Eager wallet/AppKit loading hurt mobile LCP    | Lighthouse unused JS and dependency-chain diagnostics identified wallet chunks | Added an initial lightweight shell and lazy-load wallet tools only after user intent, with hover/focus preloading |
| High     | Render-blocking Google Fonts                   | Google Fonts stylesheet loaded synchronously in `index.html`                   | Removed external font CSS and moved to system font stacks                                                         |
| Medium   | Analytics competed with early load             | `gtag.js` appeared as large unused JavaScript                                  | Deferred GA until after `window.load` plus a delay and idle work                                                  |
| Medium   | Structured data missing                        | Rendered DOM had zero JSON-LD scripts                                          | Added `WebApplication` JSON-LD                                                                                    |
| Medium   | Thin raw HTML shell                            | Production HTML had only an empty `#root` before JS                            | Added static semantic shell content in `index.html`                                                               |
| Medium   | Static asset cache policy was weak             | Hashed assets returned `max-age=0,must-revalidate`                             | Added Netlify `_headers` for immutable hashed assets and short cache on crawl files                               |
| Medium   | Button and error text contrast could be better | White text on the lighter blue gradient endpoint was below WCAG AA             | Darkened the secondary button color and added dedicated high-contrast error text                                  |
| Medium   | Screen-reader error alerts could be noisy      | Field errors were validated on every keystroke with `role="alert"`             | Moved field validation to blur and submit, clearing stale errors on edit                                          |
| Low      | Social metadata incomplete                     | `twitter:image` missing and `og:url` not slash-aligned                         | Added Twitter image metadata and aligned social URL with canonical                                                |
| Low      | Agentic Browsing `llms.txt` missing            | Lighthouse 13 expects a valid Markdown `llms.txt`                              | Added `public/llms.txt` with H1 and Markdown links                                                                |
| Low      | AppKit analytics not required for page load    | AppKit analytics enabled in wallet modal setup                                 | Disabled AppKit analytics                                                                                         |

## Local Post-Fix Lighthouse

Validated against `http://127.0.0.1:4173/` after `npm run build` and `npm run preview`.

| Mode    | Performance | Accessibility | Best Practices | SEO | Agentic Browsing |  FCP |  LCP | TBT | CLS | Speed Index | Unused JS |
| ------- | ----------: | ------------: | -------------: | --: | ---------------: | ---: | ---: | --: | --: | ----------: | --------: |
| Mobile  |         100 |           100 |            100 | 100 |              100 | 1.4s | 1.4s | 0ms |   0 |        1.4s |    32 KiB |
| Desktop |         100 |           100 |            100 | 100 |              100 | 0.3s | 0.4s | 0ms |   0 |        0.3s |    32 KiB |

## Verification

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format`: passed
- `npm run security:verify`: passed
- `VITE_WALLETCONNECT_PROJECT_ID=codex_wc_project VITE_GA_ID=G-CODEXTEST npm run build`: passed with an existing warning about large wallet chunks, now deferred behind user intent
- Headless desktop screenshot of the local preview was reviewed for visible layout regressions

## Post-Deployment Comparison

The fixes were merged to `main`, deployed to production, and re-audited against <https://audit.examples.ver.ax/>.

| Mode    | Baseline Performance | Post-Deploy Performance | Baseline LCP | Post-Deploy LCP | Baseline Unused JS | Post-Deploy Unused JS |
| ------- | -------------------: | ----------------------: | -----------: | --------------: | -----------------: | --------------------: |
| Mobile  |                   70 |                      98 |         5.2s |            1.4s |            465 KiB |                31 KiB |
| Desktop |                   94 |                     100 |         1.5s |            0.4s |            465 KiB |                31 KiB |

Post-deployment Lighthouse scores:

| Mode    | Performance | Accessibility | Best Practices | SEO | Agentic Browsing |  FCP |  LCP | TBT | CLS | Speed Index |
| ------- | ----------: | ------------: | -------------: | --: | ---------------: | ---: | ---: | --: | --: | ----------: |
| Mobile  |          98 |           100 |            100 | 100 |              100 | 1.4s | 1.4s | 0ms |   0 |        3.9s |
| Desktop |         100 |           100 |            100 | 100 |              100 | 0.4s | 0.4s | 0ms |   0 |        0.4s |

Production checks after deployment:

- `https://audit.examples.ver.ax/robots.txt` returns `200`
- `https://audit.examples.ver.ax/sitemap.xml` returns `200`
- `https://audit.examples.ver.ax/llms.txt` returns `200`
- Canonical URL is present
- JSON-LD is present in the HTML source
- Hashed JavaScript assets return `cache-control: public,max-age=31536000,immutable`
