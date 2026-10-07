# Database

[Português (Brasil)](../pt-BR/database.md)

## Implemented in BF-002

Prisma 7.10.0, its PostgreSQL adapter and a schema without business models. The client is generated in `src/generated/prisma`, which Git ignores. CLI configuration lives in `prisma.config.ts`; application access lives in `src/lib/prisma.ts`. There are no migrations or seeds yet.

## Local PostgreSQL

Requires a running Docker Desktop and Compose v2.

```sh
cp .env.example .env
npm run db:up
npm run db:validate
npm run db:generate
npm run db:check
```

`db:up` waits for the PostgreSQL 17 health check. Default port: `127.0.0.1:5433`; example user/database: `barberflow`. The public example password is exclusively for local development. The `barberflow_postgres_data` volume persists data. `npm run db:down` stops the service without deleting that volume. Avoid `down -v` if you need to keep your data.

If you change the user, password, database or port, update `POSTGRES_*` and `DATABASE_URL` consistently. `POSTGRES_*` initializes new volumes only; changing it does not automatically change an existing volume's credentials or database. Do not delete volumes to bypass an authentication failure without assessing existing data.

## Another PostgreSQL instance

Set `DATABASE_URL` in `.env` or the environment. URL format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`. URL-encode special characters in the username/password. In hosted environments, store actual values as secrets and use the provider's TLS configuration; certificate verification is not disabled by the code.

`@next/env` loads environment files following Next.js rules in both the Prisma CLI and diagnostic. Generation, schema validation and builds work without a URL. Connections require a valid PostgreSQL URL and report failure without disclosing its contents. `db:check` only runs `SELECT 1`; it neither creates tables nor changes data.

The pool allows up to five connections per process, a five-second connection timeout and a ten-second idle timeout. Assess connection budgets and provider pooling before deployment. `getPrisma()` reuses the client during hot reload and connects lazily. Client and factory imports are protected by `server-only`. The diagnostic uses Node's `react-server` condition to access these modules outside Next.js.

## Next: BF-003

Review User, Barbershop, Barber, Customer, Service, Appointment, BusinessHour, BlockedPeriod and CustomerReminder; roles OWNER, ADMIN and BARBER. Operational entities must consider barbershopId and prevent cross-shop references. Define user membership and roles before designing the schema.

Create indexes for scheduling by shop, barber and time range, and customer history. Prices must not use floating point. Store instants in UTC and preserve the service duration/price used for the appointment. Business hours use weekdays and local times with an IANA timezone, allowing multiple intervals per day. Define statuses, duration/start/end constraints and concurrent-booking protection before the first migration. A fictitious seed belongs to BF-004.

References: [Prisma configuration](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference) and [Prisma 7 generator/adapters](https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7).
