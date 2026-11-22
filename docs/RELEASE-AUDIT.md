# Munchy requirement and release audit

Date: 2026-11-17. This is a source review and local verification report, not a claim of 10/10 quality or complete Allo Simo feature parity.

## Implemented in this release

| Requirement | Result |
| --- | --- |
| Website beyond a landing page | Home, menu, individual products, story, catering, checkout, tracking, help and admin routes |
| Moroccan snack catalog | 28 source products across burgers, tacos, sandwiches/panini, pizzas, pasticcio/salads, fries, drinks and sauces |
| Menu discovery | Category navigation, search, price sort, dietary/price filters, responsive sticky category bar and scroll-to-results |
| Product configuration | Sauce, extras, side and drink options; supported add-ons have quantities; main-item quantities and live totals |
| Detailed product pages | Product-specific ingredients, portions, allergens, photo notes, service information and related items |
| Ordering | Persistent cart, server-authoritative product/option pricing, delivery/pickup, Moroccan phone validation, GPS link, COD/change, order reference and WhatsApp handoff |
| Kitchen/admin | Authenticated sessions, order statuses, catering inbox, periodic refresh, optional sound, customer WhatsApp links, CSV export and browser print tickets |
| Content studio | Product create/edit/remove/hide, prices, images/uploads, categories/reordering, menu options, branding, page/contact text, fees/zones/hours, homepage section visibility and conflict-aware publishing |
| Production persistence | MySQL for orders, catering, CMS content and uploaded media; SQL includes four tables with utf8mb4 |
| Visual assets | Responsive WebP delivery, distinct product asset paths and concept labels for generated serving/space/team imagery |
| Languages | English/French/Arabic switch and RTL support; editorial coverage remains partial |
| App metadata | Manifest, icon, social metadata and robots rules; verified-business structured data is opt-in |
| Deployment kit | Source ZIP, environment template, full SQL schema, setup guide, preflight command and public readiness endpoint |

These are implemented capabilities. Automated coverage does not prove every control works on every browser/device, and a fresh independent comparison with every Allo Simo feature was not performed for this release.

## Bugs corrected during this audit

- Category filtering previously depended on a hardcoded original order. Renamed/reordered/new admin categories now use the published category list on home and menu pages. Translated labels preserve canonical category values, and language switching no longer replaces edited delivery zones.
- The order API accepted a client-provided redemption flag for a 10 DH discount without proving a reward balance. That claim now receives HTTP 400; unsupported redemption UI is removed and the Club promotion is hidden by default. Remaining points are a local demo counter, not an authenticated loyalty balance.
- The opening badge previously ignored admin hours and hardcoded a 25-minute promise. It now reads the published schedule in Africa/Casablanca time, refreshes every minute and handles overnight hours. The human-readable schedule must retain English weekday abbreviations and HH:mm time ranges; arbitrary prose displays a check-hours fallback. Checkout still requires kitchen confirmation rather than enforcing opening hours.
- MySQL receives Date objects for order/lead timestamps with a UTC connection timezone rather than ISO strings that may be rejected by SQL timestamp parsing.
- Database read/collision-lookup failures during ordering now return a controlled unavailable response.
- CSV customer fields are escaped and spreadsheet formula prefixes neutralized. Object URLs are released after download.
- Hardcoded fictitious-domain/coordinates structured data was removed. Restaurant structured data uses published business content only when SITE_URL and BUSINESS_VERIFIED=1 are configured.
- Release packaging excludes local records, credentials, dependencies and Windows build output, and sanitizes generated next-env references.

## Remaining before a real client launch

1. Configure the actual MySQL database, production admin credentials, domain and WhatsApp destination. Import SQL, deploy, then complete the live persistence test from the guide. No live MySQL or Hostinger deployment was available for verification here.
2. Replace demo business contact/address/hours and validate real menu prices, ingredients, allergens, service areas and fulfillment promises. Keep BUSINESS_VERIFIED=0 while this remains a concept.
3. Approve commercial image rights and replace illustrative food/restaurant/team visuals when genuine business photography exists. Generated concepts are not proof of an existing restaurant or team.
4. Complete French/Arabic editorial translation, including custom CMS content, option labels, hardcoded UI strings and policies. Current translations can override some edited English sections; multilingual CMS authoring is not implemented.
5. Review privacy, retention, cancellation and delivery policies with the actual operator. Present help text is demo business copy.
6. Test real devices, keyboard/screen-reader flows and production Core Web Vitals. No new Lighthouse score, WCAG certification, load test, or 5/5 score across all categories is claimed.

## Product features not yet implemented

These require additional scope if part of the client contract:

- Customer authentication, verified cross-device loyalty balances and redemption, customer order history and wallet.
- Online card payment/refunds or a real payment provider. Current payment is cash only.
- Automatic WhatsApp Business API notifications, SMS/email transactional delivery and push notifications.
- Live driver location, delivery dispatch, address geofencing and distance-based delivery charges.
- Multi-branch ordering, granular staff roles, stock quantities and full POS integration.
- Native ESC/POS printer control, offline/service-worker checkout, or a native mobile app.
- Verified reviews and analytics/marketing consent integrations.

Do not advertise these as completed features. Full Allo Simo parity is not established.

## Validation results

- `npm run build`: passed, including TypeScript and all route generation, after the final application edits.
- `npm test`: 8/8 integration suites passed: page routes; image format/size budgets; invalid/forged order rejection; order/admin/tracking; catering; CMS product CRUD, revision conflict and server repricing; authenticated image upload; meal-option pricing/quantities.
- `npm run test:release`: passed Casablanca schedule boundaries, admin changes, overnight service and spreadsheet-safe CSV checks.
- `node tests/production-check.mjs`: passed production homepage rendering, readiness HTTP 503 without DB, refused unconfigured production writes and rejection of the development admin password.
- `npm run check:deploy`: correctly failed in the unconfigured local environment. A successful real-DB preflight remains a deployment step, not a completed test.
- `npm audit --omit=dev`: reported zero known production dependency vulnerabilities at the time checked. This is not a full security audit.
- Release generator checks ZIP CRC, root package.json and private-path exclusions; SHA256SUMS.txt and release-manifest.json accompany the archive.

## Backend cost and hosting conclusion

Business Web Hosting supports the required managed Node.js runtime. Using the plan's MySQL avoids adding a separate backend subscription. Hosting, domain renewals and any future paid messaging/payment services still have their own costs. Managed ZIP deployment is required; extracting source into an ordinary PHP public_html folder is insufficient.

[Official Hostinger deployment documentation](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
