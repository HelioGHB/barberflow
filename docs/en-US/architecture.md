# Architecture

[Português (Brasil)](../pt-BR/architecture.md)

## Implemented

A modular Next.js monolith with App Router, React, TypeScript strict and Tailwind. `src/app` holds routes, layout and styles. The `@/*` alias points to `src/*`. The landing page is a static Server Component without customer data or external dependencies.

BF-002 adds Prisma 7.10.0 with the PostgreSQL adapter, the initial business schema (BF-003) and generated code in `src/generated/prisma` (ignored by Git). `src/lib/prisma.ts` uses `server-only` and exposes `getPrisma()` with lazy initialization and reuse during hot reload. The shared factory sets a maximum pool size of five connections and a five-second connection timeout. The landing page remains independent of the database.

`prisma.config.ts` uses `@next/env` to load the same environment as Next.js. The URL is optional for generation/schema validation and required and validated when connecting. `db:check` only runs `SELECT 1` and never prints driver errors or credentials. Docker Compose provides local PostgreSQL 17 on port 5433 bound to 127.0.0.1, with a persistent volume and health check.

Documentation lives in `docs/pt-BR` and `docs/en-US`. The product UI stays in Portuguese; application internationalization is outside this task.

## Planned evolution

Route Handlers will handle HTTP transport. `src/modules/<domain>` will be introduced as features require it, separating Zod validation, services and data access. Shared infrastructure lives in `src/lib` when needed. Prisma accesses PostgreSQL exclusively on the server; the initial schema and first migration now exist.

Backend authentication and authorization will enforce OWNER, ADMIN and BARBER roles. Shop context will come from a trusted session. Operational entities will carry barbershopId. Client-provided IDs must be verified within that context.

Availability will consider business hours, barber, service duration, blocked periods, timezone and appointments. Appointment creation needs a transactional guarantee against overlapping bookings; a prior query alone cannot prevent concurrent reservations.

Planned deployment: GitHub, Vercel and managed PostgreSQL as a separate stage. No application deployment has happened. PWA comes after the main flows; a service worker must not indiscriminately cache authenticated responses.

## Integrity implemented in BF-003

`User` is global; `BarbershopMember` associates a user and role with a shop. `Barber` references that membership. Composite foreign keys prevent appointments, blocks and reminders from referencing another shop's entities. This enforces write integrity; read authorization and session context belong to BF-005 (there is no RLS at this stage).

PostgreSQL enforces data checks and GiST exclusions with `btree_gist` for appointment overlap per barber and business-hour overlap per weekday. The migration includes custom SQL not representable by Prisma. Integration tests exercise actual SQL, including lock contention between two independent transactions. The test database is separate from the application database.

Integer-cent prices and service name/duration are copied into appointments. Future application code must copy the correct values during creation and enforce status transitions, consent, business hours and blocks. The database rejects appointment overlaps but does not yet cross-check appointments against blocked periods or business hours.

## Fictitious data — BF-004

The seed lives in prisma/seed-data.ts (fixtures), seed-demo.ts (transaction) and seed.ts (CLI entry). It uses fixed IDs, identity/shop checks and missing-row inserts, without updating or deleting data. A transactional advisory lock serializes concurrent executions. The production environment is blocked. The schema, UI and API remain unchanged.
