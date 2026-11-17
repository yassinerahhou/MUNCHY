# Munchy

A direct-order Casablanca snack shop built with Next.js 16, TypeScript, React, Framer Motion, Lucide, and Zustand. Customers can browse the full menu, build a custom box, check out for delivery or pickup, track orders, and request catering. The kitchen desk provides password-protected order management.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). In development, orders and catering leads are stored as JSON under the ignored `.data/` directory. The demo kitchen password is `munchy-demo-2026` at `/admin`.

## Features

- Responsive home, menu, product detail, story, catering, checkout, tracking, and kitchen desk pages.
- Persistent cart and loyalty points, item customization, menu search/sort/filter, quick views, and a free-delivery progress indicator.
- Server-priced checkout with Moroccan mobile validation, delivery/pickup, GPS link sharing, COD/change preference, order reference, and WhatsApp handoff.
- Order lookup by reference plus phone suffix; kitchen status updates are reflected in tracking.
- Catering requests with input validation and a honeypot field.
- Product photography is served as responsive WebP. Full-width concept imagery has its own larger transfer budget.

## Storefront admin

At `/admin`, the local development password is `munchy-demo-2026`. Production uses `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` from the server environment.

The dashboard includes order management, a catering inbox, and a storefront studio. The studio supports adding and removing products, editing names/descriptions/prices/categories/badges, toggling availability and dietary filters, choosing photos, and uploading new photos. The content editor covers dictionary sections, branding colors/name, story, homepage text, contact details, delivery charges, delivery areas, hours, builder options and restaurant/team concept images.

Changes stay in the draft until **Publish changes**. Discard draft restores the last saved version. Revision checks prevent a second editor from overwriting newer content. Download backup exports the current content draft as JSON. Reload published fetches the latest saved revision and asks before discarding unpublished edits. Product deletion is confirmed within the editor and takes effect when published. Product URLs are stable IDs and new products get their own routes automatically. Existing order records keep their original item names and prices.

Development saves the content document in `.data/site-content.json` and uploaded images in `.data/media/`. When MySQL is configured, content and images are stored in `munchy_content` and `munchy_media`; these two tables are created automatically. The database user must have permission to create them. Uploads accept JPG, PNG, WebP and AVIF up to 8 MB, re-encode to WebP, remove metadata, and cap the dimensions at 1600px. SVG is rejected. Content updates and uploads require the admin session.

The storefront reads published content on each request, so added products and updated prices do not require rebuilding the site. Checkout uses the same published catalog for server-side price and availability checks. Returning visitors' carts reconcile with the current product catalog.

The expanded smoke suite runs seven checks, including content CRUD, revision conflicts, price/availability enforcement, image upload authentication, image serving and rejection of unsupported image types. These tests use isolated local storage; live MySQL deployment still requires the production configuration above.

## Restaurant concept imagery

The restaurant and workers shown in the new homepage sections are generated visualizations of an unbuilt concept. They are labeled accordingly. Prompt and asset details are recorded in `docs/CONCEPT-IMAGERY.md`.

## Production setup

Set the database connection and long random admin credentials in the hosting environment. Import [`db/schema.sql`](db/schema.sql) into the MySQL database before accepting orders. Production intentionally refuses to store customer data in local files when database settings are missing.

Required environment variables are listed in [`.env.example`](.env.example). `MUNCHY_WHATSAPP_NUMBER` is optional and uses international digits only (for example, Morocco country code `212` plus the business number). Keep all secrets server-side.

This project hands the customer a WhatsApp message draft after saving the order. The customer must tap Send; there is no payment gateway or automatic WhatsApp delivery integration.

## Smoke checks

```bash
npm test
npm run build
```

`npm test` starts an isolated Next.js server on port 3001 with separate test-only order data, checks the page routes and optimized image responses, exercises validation and the order/admin/tracking lifecycle, and removes its temporary data afterward.

## Replace demo business details

The address, phone number, email, opening hours, menu, prices, and policy copy in [`locales/en.ts`](locales/en.ts) are sample content for the prototype. Replace them with the operator's verified details before taking real orders.

All English interface copy is centralized in `locales/en.ts` to make French and Arabic localization easier to add later.

## Additional owner controls

In **Pages, copy & settings → Presentation**, choose or upload hero and combo photos independently of product photography. Toggle the matcher, combo, club, how-to-order, restaurant space, team and delivery sections. These controls use defaults for older saved content so updates do not erase existing changes.

In **Menu**, rename, add and reorder categories. Renaming updates products assigned to that category. A category with products cannot be removed until those products are reassigned. Product editors include Move up / Move down controls for the default menu order. The editor has a sticky Publish changes bar for long editing sessions.

The homepage product grid includes the scroll anchor used by category filters. Category changes scroll after the new results render. Active categories use an explicit dark background with light text.

## Product ordering details

Main meals now have configurable sauce, extra, side and drink choices. Drinks and sides have independent quantities from one to six per meal. The main meal quantity is capped at ten. Different configurations use separate cart IDs. Checkout revalidates the catalog item, option names and option quantities, calculates all prices server-side, and includes the selections in kitchen tickets, tracking item names and WhatsApp summaries.

Manage global choices and prices under **Admin → Pages, copy & settings → Meal options**. Product editors also include ingredients, portion text, allergen information and a photo caption. Product pages display these details, price breakdowns, pickup/delivery information, related items and cash payment guidance. Product photos use 28 distinct seed assets; generated serving concepts are labeled. The test suite includes product customization and multi-drink totals (eight checks overall).
