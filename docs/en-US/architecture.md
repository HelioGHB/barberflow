# Architecture

[Português (Brasil)](../pt-BR/architecture.md)

## Implemented

A modular Next.js monolith with App Router, React, TypeScript strict and Tailwind. `src/app` holds routes, layout and styles. The `@/*` alias points to `src/*`. The landing page is a static Server Component without customer data or external dependencies.

BF-002 adds Prisma 7.10.0 with the PostgreSQL adapter, a model-free schema and generated code in `src/generated/prisma` (ignored by Git). `src/lib/prisma.ts` uses `server-only` and exposes `getPrisma()` with lazy initialization and reuse during hot reload. The shared factory sets a maximum pool size of five connections and a five-second connection timeout. The landing page remains independent of the database.

`prisma.config.ts` uses `@next/env` to load the same environment as Next.js. The URL is optional for generation/schema validation and required and validated when connecting. `db:check` only runs `SELECT 1` and never prints driver errors or credentials. Docker Compose provides local PostgreSQL 17 on port 5433 bound to 127.0.0.1, with a persistent volume and health check.

Documentation lives in `docs/pt-BR` and `docs/en-US`. The product UI stays in Portuguese; application internationalization is outside this task.

## Planned evolution

Route Handlers will handle HTTP transport. `src/modules/<domain>` will be introduced as features require it, separating Zod validation, services and data access. Shared infrastructure lives in `src/lib` when needed. Prisma accesses PostgreSQL exclusively on the server; there are no business models or migrations yet.

Backend authentication and authorization will enforce OWNER, ADMIN and BARBER roles. Shop context will come from a trusted session. Operational entities will carry barbershopId. Client-provided IDs must be verified within that context.

Availability will consider business hours, barber, service duration, blocked periods, timezone and appointments. Appointment creation needs a transactional guarantee against overlapping bookings; a prior query alone cannot prevent concurrent reservations.

Planned deployment: GitHub, Vercel and managed PostgreSQL as a separate stage. No application deployment has happened. PWA comes after the main flows; a service worker must not indiscriminately cache authenticated responses.
