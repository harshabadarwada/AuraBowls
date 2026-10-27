# Production readiness

The application is not production-ready until the items below are done with real credentials and a real test payment.

## Must be true

- `NODE_ENV=production`
- `APP_SECRET` is a long random value, different from the local file
- `OTP_DEV_REVEAL` is unset
- `PAYMENT_SIMULATOR` is unset
- Razorpay keys and webhook secret are set, and a test payment plus a duplicate webhook have been checked
- WhatsApp OTP template is approved, or SMS is configured, and a real code has been received
- Admin password is not `change-me-local-only`
- Database is managed PostgreSQL with backups you have restored once
- Service PINs, slot capacities, and portion limits match the kitchen
- Legal name, address, GSTIN, and tax mode match the business
- Product photos that are real have the placeholder flag turned off
- Support WhatsApp number is set
- HTTPS is on, so the admin cookie is marked secure

## Cost sketch

These are planning ranges, not quotes.

- App hosting: a small Node host or Vercel hobby/pro, about ₹0–2,000 per month
- Managed Postgres: about ₹0–2,000 per month on a small plan
- Razorpay: typically around 2% per successful payment, set by your Razorpay plan
- WhatsApp OTP: Meta conversation or authentication pricing, often a few rupees or less per code
- SMS fallback: often ₹0.15–0.30 per message in India
- Domain: about ₹800–1,500 per year

No Redis, queue, or separate delivery app is required for this version.

## Security checklist

- Admin routes check a signed httpOnly cookie. Hiding the link is not the control.
- Tracking uses a random token hash. Sequential references are not authorization.
- Tracking responses omit the street address.
- Gateway secrets are read only on the server.
- OTP codes are hashed, expire in 5 minutes, lock after 5 attempts, and cannot be reused.
- Refunds stay pending until an admin approves them.
- Issued invoices are not edited. Credit notes are added beside them.
