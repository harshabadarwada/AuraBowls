# Backups

Local development uses a SQLite file at `web/prisma/dev.db`. Copy that file while the server is stopped if you need a manual backup. Do not commit it.

This repository does not configure automated production backups. Do not describe them as enabled until they are.

For production, use a managed PostgreSQL provider and turn on its daily backups. Neon, Supabase, and RDS all offer this on paid or free tiers. Test a restore once before taking real orders:

1. Create a new database from a backup snapshot.
2. Point a staging `DATABASE_URL` at it.
3. Run the app and confirm a known order, invoice, and payment reference are present.

Admin CSV export from Kitchen is an operational copy, not a full backup. It omits payment secrets and should still be treated as personal data.

Google service account keys and Razorpay secrets stay in the host's environment, not in the database backup if you can avoid it, and never in the browser.
