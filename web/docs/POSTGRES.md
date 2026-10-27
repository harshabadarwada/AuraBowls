# PostgreSQL

Local development uses SQLite because it needs no extra service. The schema uses strings and integer paise so it can move to PostgreSQL.

Before real orders:

1. Create a managed Postgres database.
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. Set `DATABASE_URL` to the provider connection string.
4. Run `npx prisma migrate dev --name init` in a staging project, then `npx prisma migrate deploy` in production.
5. Run the seed only on an empty staging database. Do not re-seed over live orders. The seed does not reset an existing admin password.

SQLite conditional updates are the concurrency mechanism used in development. PostgreSQL uses the same SQL. Keep a single application instance until you have confirmed the connection pool. A second instance is fine with Postgres; do not run two app servers against one SQLite file.
