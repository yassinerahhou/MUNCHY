# Munchy requirement and release audit

Updated: 2026-11-22. This is a source review and local verification report, not a claim of 10/10 quality or complete Allo Simo feature parity.

## Hospitality upgrade — 2026-11-22

The latest source adds a new editorial home and shared interaction layer while retaining existing products, routes, admin editing, COD ordering and tracking.

### Delivered against the creative brief

- Warm editorial tokens tied to editable brand colors; Cormorant Garamond serif, condensed display, DM Sans and IBM Plex Sans Arabic; fluid scales, grain, full-viewport food-led hero and server-initialized Casablanca kitchen status with closing/next-opening times.
- Maintained Lenis package (the former @studio-freight package is deprecated), reduced-motion bypass, ambient hero movement, sticky horizontal six-dish gallery, native mobile snap carousel, contextual desktop cursor, hide/reveal header, reading progress, quick links and 48px mobile reserve/cart bar.
- Image-specific blur placeholders for all 33 seed photos, shimmer loading, responsive WebP delivery and shared-element dish dialogs. Generated restaurant/team/serving concepts retain disclosure labels.
- Home category/budget filtering, animated menu category marker, typo-tolerant search, real-item empty-search suggestions, conservative ingredient exclusions with cross-contact guidance, local-time lunch/evening banners and published availability.
- Customizer options, quantities including multiple drinks/sides, spice preferences and kitchen notes carried through server repricing, saved kitchen orders and WhatsApp messages. Protein preparation follows the house standard rather than offering undercooked options.
- Unified desktop drawer/mobile bottom sheet, Escape and focus handling, draggable mobile grip, cross-sells, add/cart feedback, last-order memory and copyable bag snapshots.
- Live group ordering: separate browser profiles can join a 24-hour shared bag and contribute items. Four-second polling, queued retry, idempotent recent operation IDs, serialized local writes and transactional MySQL row locking protect concurrent quantity updates. One person submits the final order; this is not stock reservation or a multi-payer checkout.
- Optional verified-coordinate delivery radius, straight-line distance/fee calculation, server enforcement, pickup fallback and Friday/Saturday peak estimates. Real coordinates are required before enabling the geofence.
- Reservation request flow with party size, Casablanca-calendar dates, opening-hour slots, seating preference and occasion. Receipt references are genuine saved requests, not automatic table guarantees.
- Gift studio with live amount/recipient/message preview and unique request-reference QR. Cards remain unpaid/unredeemable until the actual operator arranges payment/activation; no payment gateway or gift-balance system is faked.
- Private-event estimator carries guest/budget choices into the existing catering inquiry. Club form records explicit opt-in; a dismissible invitation appears after sustained engagement. No guaranteed complimentary offer is invented.
- Optional live Google Places review section; no fabricated rating/count. /review offers the same public-review link at every score, plus private feedback. Low ratings are not filtered away from public reviewing.
- English/French/Arabic editorial copy and translated seed descriptions, instant language controls, cookie-backed initial RTL, mirrored controls and Arabic font. Admin can edit editorial and menuCopy dictionaries. House product names, ingredients, custom recipe/option text and kitchen notes retain their entered language; operators must keep translations aligned with menu changes.
- Restaurant structured data uses verified published details, hours, prices and configured coordinates. No invented aggregateRating is injected. OpenGraph/Twitter images, sitemap, analytics events/adapters gated by consent, agency credit and a local case-study destination are included.
- Hospitality admin inbox stores reservation/gift requests, feedback and club consent, with follow-up statuses. Existing full product/content/image editor remains available. All six SQL tables are included in the deployment schema.
- Optional HTTPS POS webhook is HMAC-signed with an idempotency header. A local receiver test verifies payload/signature and authenticated manual retry. Initial delivery is best-effort after persistence; a durable automatic outbox and live POS account are not included.

### Verification of this upgrade

- Integration suites: 11/11 passed (customer/operator routes, seed image format/budgets, invalid orders, order/admin/tracking, catering, CMS CRUD and repricing, uploads, customized meals/notes, hospitality intake/admin follow-up, concurrent/idempotent group carts, signed POS routing/retry).
- Release helper checks passed for Casablanca hours/overnight boundaries, CSV formula escaping, fuzzy search, ingredient exclusions, reservation slots, peak times and radius/fee logic.
- Browser interaction check: 20 passed; mobile/tablet/desktop home, reservations and Escape, RTL/persistence, fuzzy and empty search, two-drink customizer, notes in cart, checkout, reduced motion and no JavaScript runtime errors.
- Live group browser check: 5 passed using two isolated browser profiles; the friend's contribution appeared in both bags, and leaving did not remove shared items.
- Responsive route sweep: 27 route/viewport combinations passed at 375, 768 and 1440 pixels with HTTP 200, no document-level horizontal overflow and no broken completed images. This is browser emulation, not physical-device certification.
- The measured home CLS was 0 in the three local viewport runs after server-initializing kitchen status. This is an observation under local test conditions, not a guarantee across all networks, devices or user-edited content.
- Production build, production misconfiguration checks and ZIP integrity are checked for the final package. No live Hostinger or real MySQL service was available in this session; account configuration and live persistence verification remain launch steps.

### Remaining real-world integrations and boundaries

The demo business still needs verified contact/address/hours, an approved real menu/allergen policy, commercial image clearance and production credentials. Live Google reviews, delivery geofencing and POS delivery require the actual operator's external settings. Club signup records consent but does not send campaigns automatically. There is no payment processor, verified loyalty account/wallet, native mobile/offline checkout, driver dispatch, branch management or native ESC/POS connection.

Reservation and gift features intentionally represent requests rather than guaranteeing inventory or money that has not been collected. Analytics hooks do not install GA4/Meta tracking without the operator's configuration and consent process. Review routing is neutral, not a reputation-gating flow. No overall Awwwards score, 10/10 score or complete Allo Simo parity is claimed.

Browser checks can be reproduced with the Playwright CLI run-code files in tests/browser-qa.js, tests/group-qa.js and tests/responsive-qa.js. They use a local browser profile and http://localhost:3000. Screenshots are generated under ignored output/playwright. Integration tests use an isolated port/data directory and do not modify customer data.

The source ZIP excludes .env credentials, .data records/uploads, node_modules, .next and Git history. Use the managed Next.js Web App upload path on Hostinger Business; ordinary public_html extraction does not start this backend.

[Hostinger deployment documentation](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
