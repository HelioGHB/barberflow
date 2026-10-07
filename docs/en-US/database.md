# Database

[Português (Brasil)](../pt-BR/database.md)

## Implemented through BF-004

Prisma 7.10.0, its PostgreSQL adapter, ten business models and the first SQL migration. The client is generated in `src/generated/prisma`, which Git ignores. CLI configuration lives in `prisma.config.ts`; application access lives in `src/lib/prisma.ts`. The initial migration is versioned; BF-004 adds the [repeatable fictitious seed](seed.md).

## Local PostgreSQL

Requires a running Docker Desktop and Compose v2.

```sh
cp .env.example .env
npm run db:up
npm run db:migrate
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

## Initial model — BF-003

| Entity           | Responsibility                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| User             | Global identity, name, normalized email and active flag; login is not implemented                    |
| Barbershop       | Name, unique slug and PostgreSQL-validated timezone; default America/Sao_Paulo                       |
| BarbershopMember | User/shop membership with one OWNER, ADMIN or BARBER role per shop                                   |
| Barber           | Professional linked to the user's membership in the same shop; OWNER/ADMIN can also provide services |
| Customer         | Shop-scoped customer, E.164 phone unique within that shop and WhatsApp consent disabled by default   |
| Service          | Name, integer-cent price (BRL in the MVP), positive duration in minutes and active flag              |
| Appointment      | Same-shop customer/barber/service, UTC instants, status and historical service snapshot              |
| BusinessHour     | Weekly business-hour interval in local minutes                                                       |
| BlockedPeriod    | UTC interval for one barber or the whole shop (null barberId)                                        |
| CustomerReminder | Manual customer reactivation record with PENDING, CONTACTED or DISMISSED status                      |

```mermaid
erDiagram
  User ||--o{ BarbershopMember : memberships
  Barbershop ||--o{ BarbershopMember : team
  BarbershopMember ||--o| Barber : professional
  Barbershop ||--o{ Customer : customers
  Barbershop ||--o{ Service : services
  Barbershop ||--o{ BusinessHour : hours
  Barbershop ||--o{ BlockedPeriod : blocks
  Barber ||--o{ Appointment : serves
  Customer ||--o{ Appointment : books
  Service ||--o{ Appointment : references
  Customer ||--o{ CustomerReminder : reactivation
```

## Constraints and decisions

Entities use PostgreSQL-generated UUIDs. Membership uses the compound key (barbershopId, userId); referenced entities expose unique keys (barbershopId, id). Composite foreign keys on appointments, blocks and reminders prevent cross-shop references. Referenced parent deletion/update uses RESTRICT; soft deactivation preserves history. Users can belong to multiple shops with different roles.

Checks reject blank names, emails without lowercase/trim normalization, invalid slugs, non-E.164 phones, unknown timezones, negative prices, nonpositive durations and invalid/infinite intervals. Full email validation, phone normalization and permissions will still be enforced by the backend; the database does not establish ownership of an email or phone.

Appointments hold their own serviceName, servicePriceCents and serviceDurationMinutes. The end must equal the start plus the copied duration. Service changes do not alter history; future application code must copy these values during booking. Statuses: SCHEDULED, COMPLETED, CANCELLED and NO_SHOW. Only COMPLETED requires completedAt; other statuses forbid it. CONTACTED requires contactedAt on reminders. Status-transition and consent rules belong to later stages.

`Appointment_no_overlap` uses GiST, `btree_gist` and `[start, end)` ranges. It rejects overlap even under concurrency for the same shop/barber, allowing adjacent appointments and different barbers. CANCELLED releases the slot; COMPLETED and NO_SHOW retain historical occupancy. Reactivating a canceled appointment also respects this constraint.

Business hours use weekday 0 (Sunday) through 6 (Saturday), startMinute >= 0, endMinute <= 1440 and start before end. They allow multiple daily intervals and midnight endings without overlap. Overnight hours must be split across weekdays. Blocked periods may overlap and will be interpreted as the union of intervals by future availability code.

The migration does not check bookings against blocks or opening hours: those rules need backend availability and a transactional strategy coordinating changes with bookings. Foreign keys do not replace session-based read/write authorization; there is no RLS, authentication, CRUD or message delivery yet; the fictitious seed is available. Prisma maintains updatedAt; direct SQL writes must supply/update it.

## Migrations

```sh
npm run db:migrate
npm run db:migrate:status
npm run db:drift
```

`db:migrate` applies reviewed migrations (`prisma migrate deploy`) without resetting the database. The first is `20261007120000_initial_schema`, transactional, with `btree_gist`, a timezone-validation function, checks and exclusions. The migration user must be able to create the extension (included in standard PostgreSQL 17). Helper functions use the public schema.

For future changes: `npm run db:migrate:dev -- --name name --create-only`, review the SQL and then apply it to development. Never edit an applied migration. Do not replace migrations with `db push`. CHECKs, the timezone function and exclusions are not fully represented in Prisma's schema; `db:drift` only compares recognized features. Integration tests verify custom SQL rules.

## Isolated tests

Set TEST_DATABASE_URL to another PostgreSQL database. With the example configuration, create it once:

```sh
docker compose exec db createdb -U barberflow barberflow_schema_test
npm run db:test
```

Do not repeat createdb if the database already exists. Adjust the username/address for your installation. The runner rejects the same database name used by DATABASE_URL, even with a host alias or different schema. It applies migrations to the test database, repeats deployment to verify idempotence, checks drift and runs 18 real tests (11 schema tests and seven seed tests). Ordinary transactions roll back; persistent concurrency fixtures are removed only by UUIDs created in that run. There is no truncate, reset or database deletion.

CI creates separate application and integration databases, applies migrations and runs the same suite. The concurrency test observes one transaction waiting for another's lock, verifies PostgreSQL error 23P01 and confirms only one persisted reservation.

Next: BF-005, authentication and shop authorization.

References: [Prisma custom migrations](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/customizing-migrations), [PostgreSQL ranges](https://www.postgresql.org/docs/17/rangetypes.html) and [btree_gist](https://www.postgresql.org/docs/17/btree-gist.html).
