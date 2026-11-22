# Munchy — Hostinger Business release

Upload `munchy-hostinger-node.zip` through **Websites → Create site → Web App → Upload your files** in hPanel.

This Next.js app needs a Node.js server and MySQL. Extracting the source ZIP into an ordinary `public_html` folder does not start the backend. Your Business plan supports the required Web App deployment.

1. Follow `docs/HOSTINGER-DEPLOY.md` for database, environment variables and deployment settings.
2. Import `db/schema.sql` using phpMyAdmin. The current release needs all six tables, including hospitality requests and group carts. Re-importing creates missing tables while keeping existing data.
3. Configure private environment variables in hPanel; `.env.example` contains placeholders only.
4. Select Next.js, Node 22, npm, root `.`, build `npm run build` and output `.next` if requested. Retain the server preset.
5. Open `/api/health`; expect HTTP 200 and `{"status":"ok"}` after correct setup.
6. Replace demo business details in `/admin` before accepting customers.

The archive includes source and assets. It excludes dependencies, Windows build output, customer records and credentials. Hostinger builds it on Linux.

Read `docs/RELEASE-AUDIT.md` for completed features and remaining launch requirements. There is no separate paid backend service required by this architecture when your hosting plan includes Node.js and MySQL. Hosting itself is paid.
