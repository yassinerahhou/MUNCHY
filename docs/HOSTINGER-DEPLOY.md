# Deploy Munchy on Hostinger Business

Prepared 2026-11-17. No remote account was modified or live database tested during packaging.

## 1. The correct deployment

Business Web Hosting supports managed Node.js web apps. The storefront and API run together as one Next.js app. Orders, catering leads, published content and uploaded images use MySQL. This architecture requires no separate Supabase, Firebase, VPS or backend subscription. Check your account's resource/database allowances; hosting itself remains paid.

Use **Web App → Upload your files**. Ordinary File Manager extraction into `public_html` does not install dependencies, build Next.js or start its server. Keep source and secrets outside publicly served folders. File Manager edits to managed deployment directories may be overwritten on redeploy.

[Official Hostinger Node.js deployment instructions](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)

## 2. Create the database

1. In hPanel database management, create a MySQL database, user and strong password. Record full database/user names including Hostinger prefixes.
2. Open phpMyAdmin for that database. Import `db/schema.sql` from the ZIP.
3. Confirm four tables: `munchy_orders`, `munchy_catering_leads`, `munchy_content`, `munchy_media`.
4. Use the exact MySQL hostname shown by hPanel. Use localhost only if specified by your connection details. If database access permissions are required for your managed Node app, follow Hostinger's configuration instructions rather than opening unrestricted database access.

Use a new database for first launch. The schema creates tables without dropping data. Back up existing databases before migrations. A new database initially uses the catalog included in source; publishing through admin stores edits in MySQL.

[Create a MySQL database](https://www.hostinger.com/support/1583542-how-to-create-a-new-mysql-database-in-hostinger/) · [Import using phpMyAdmin](https://www.hostinger.com/support/1884149-how-to-import-a-database-with-phpmyadmin-in-hostinger/)

## 3. Upload and build

1. Websites → Create site → Web App under Business. Select your domain or a temporary domain. Test on a temporary domain before replacing an existing live site.
2. Choose Upload your files; upload `munchy-hostinger-node.zip`. `package.json` is at the archive root.
3. Framework: **Next.js with server/backend support**, rather than static export.
4. Node: **22.x**. Package manager: **npm**. Root: `.`.
5. Build: `npm run build`. Keep dependency installation enabled. If configurable, install with `npm ci --include=dev`; TypeScript, Tailwind and PostCSS are needed for building. Installing only production dependencies before building will fail.
6. If output is requested, use `.next`. If start command is requested, use `npm run start`. Retain detected Next.js entry settings. Hostinger manages the process and port; no PM2 or fixed port 3000 is needed.
7. Add environment variables before deployment. Deploy and check build logs. Use hPanel restart/redeploy after configuration changes.

## 4. Private environment variables

Set these in hPanel Environment Variables. Never use NEXT_PUBLIC prefixes for credentials.

| Variable | Value |
| --- | --- |
| NODE_ENV | production |
| DB_HOST | MySQL hostname from hPanel |
| DB_PORT | 3306 unless Hostinger specifies otherwise |
| DB_NAME | Full prefixed database name |
| DB_USER | Full prefixed database user |
| DB_PASSWORD | Database password |
| ADMIN_PASSWORD | Unique password of at least 16 characters |
| ADMIN_SESSION_SECRET | Random secret of at least 64 characters |
| MUNCHY_WHATSAPP_NUMBER | Real Moroccan mobile, digits only, starting 2126 or 2127 |
| SITE_URL | Your HTTPS website origin without a subpath |
| BUSINESS_VERIFIED | 0 for demo; 1 after publishing verified real business details |

Generate the session secret locally:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Do not set `MUNCHY_FORCE_LOCAL_DATA`, `MUNCHY_TEST_BUILD_DIR` or `MUNCHY_LOCAL_DATA_DIR` in production. The local demo admin password is not a production credential. Production writes require the database.

If a terminal is available in the deployed app directory, run `npm run check:deploy` with the runtime environment loaded. It checks settings and tables without printing passwords. `/api/health` offers a browser-friendly readiness check.

## 5. Verify before taking orders

1. Enable HTTPS. Admin sessions use secure cookies in production.
2. Visit `/api/health`: expect HTTP 200 and `{"status":"ok"}`. HTTP 503 means configuration/database/schema needs attention.
3. Sign in at `/admin`. Replace demo name, phone, email, address, hours, delivery zones/fees, prices, availability, ingredients and allergen details. Publish and reload.
4. Replace concept space/team visuals and illustrative food photos with approved business assets when available. Keep concept labels while they remain illustrative. Confirm commercial image rights.
5. Test mobile ordering with sauce, extra and two drinks; delivery and pickup; COD total; WhatsApp recipient; order reference and phone-protected tracking. The customer still presses Send in WhatsApp and the kitchen confirms acceptance.
6. In admin, update the test order status and verify tracking. Test image upload, new product, price edit, catering inbox, CSV export and browser ticket printing.
7. Restart/redeploy. Confirm orders, images and published content persist in MySQL.
8. Check renamed/reordered/custom menu categories, French/Arabic switch, active-tab contrast and mobile cart.
9. Adapt `/help` to actual business policies and customer-data retention practices before launch.

## 6. Updates and backups

Export a complete MySQL backup through phpMyAdmin before updates. It includes customer records, CMS content and uploaded images; store it privately. A CMS content export alone does not include all database/media records.

Redeploy updated source ZIPs through the Node app's deployment settings. Avoid manual edits to managed `hbuilds` or `.htaccess`. Source redeployment does not reset MySQL. Code rollback does not undo database edits; keep source and database backups.

This release intentionally excludes local `.data` customer records and uploads. Existing local content edits are not automatically migrated. The packaged source catalog is the initial database fallback.

## 7. Troubleshooting

- Build fails: verify Node 22, dev dependencies during build, and build logs. Next's Google font build step requires network access. Do not upload Windows `node_modules` or `.next`.
- Health 503: check DB/admin settings, database access and all four schema tables; inspect runtime logs privately.
- Admin login fails: check HTTPS and production credentials. Clear stale cookies after session-secret rotation.
- Wrong WhatsApp destination: configure MUNCHY_WHATSAPP_NUMBER and update published contact details.
- Orders appear missing: verify DB_NAME still points to the original database. Local JSON storage is development-only.
- Only PHP files are shown: create a Web App under Business; a PHP directory is not a Node runtime.

## 8. Scope

COD ordering, admin editing, catering, tracking polling and WhatsApp handoff are implemented. Customer accounts, verified redeemable rewards, card payments, live driver GPS, delivery dispatch, automatic WhatsApp Business notifications and offline checkout are not implemented.

French/Arabic translate many UI strings; some copy remains English and custom CMS text needs editorial translation. The manifest supplies app metadata, not an offline service worker. Tickets use the browser/OS print dialog, not native ESC/POS.

See [release audit](RELEASE-AUDIT.md) for the requirement matrix and validation results.
