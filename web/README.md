# AuraBowls

Fresh breakfast and lunch ordering for a small kitchen. Customers browse without an account, build a daily, weekly, or monthly plan, and pay for a pending order. The kitchen accepts the order separately.

## Run locally

```bash
cd web
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000.

Admin: http://localhost:3000/admin/login

The local seed uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. The sample password is `change-me-local-only`. Change it before anyone else can reach the machine.

Local checkout uses a development OTP and a development payment simulator. Neither sends a WhatsApp message nor moves money. Both refuse to run when `NODE_ENV=production`.

## Source of truth

PostgreSQL or SQLite through Prisma is the source of truth for orders, payments, capacity, OTP, refunds, and invoices.

Google Sheets is an optional one-way export after a captured payment. Edits in the sheet are not imported. A failed export does not cancel the order. The attempt is stored in the sync log.

## What is implemented

- Storefront: home, menu, breakfast, lunch, dinner coming soon, meal pages, plans, plan builder, cart, checkout, payment result, tracking, about, contact, policies
- Server pricing, delivery dates, PIN checks, 10 minute reservations, and cutoff rules
- Phone OTP with WhatsApp first and SMS fallback when those providers are configured
- Razorpay order creation, signature checks, webhooks, and retries on the same pending order
- Admin for orders, deliveries, menu, plans, areas, slots, closures, customers, payments, refunds, kitchen summary, packing slips, CSV, inventory, coupons, invoices, feedback, settings, and reports
- Credit notes when a refund is recorded, without rewriting the invoice

## What still needs external setup

- Razorpay test or live keys, including the webhook secret
- WhatsApp Cloud API template for OTP, and an SMS URL if you want the fallback
- A WhatsApp support number in Admin → Settings
- Real product photographs uploaded as meal image URLs
- GSTIN, legal name, address, and tax mode after an accountant confirms them
- Managed PostgreSQL before real orders. Local SQLite is for development
- A confirmed list of serviceable PINs. The seed PINs are starter Hyderabad zones from the previous prototype

## Tests

```bash
npm test
```

Unit tests cover pricing, tax, coupons, dates, cutoffs, refunds, and payment signatures. Integration tests use a separate SQLite file and the development simulator. They do not call Razorpay or send messages.

Browser end-to-end automation is not installed. Walk through the manual list in `docs/QA.md` before calling the app production-ready.

## Docs

- `docs/ARCHITECTURE.md`
- `docs/ADMIN.md`
- `docs/BACKUP.md`
- `docs/POSTGRES.md`
- `docs/PRODUCTION.md`
- `docs/QA.md`
