# BarberFlow

[English (US)](README.md) · [Português (Brasil)](README.pt-BR.md)

Barbershop management and scheduling, designed for a simple daily workflow on Android smartphones.

## Project status

- **BF-001:** Next.js foundation, responsive Portuguese landing page and quality tooling.
- **BF-002:** Prisma/PostgreSQL configuration, local database, connection diagnostic and bilingual GitHub documentation.
- **Next — BF-003:** business schema, constraints and initial migrations.

Login, customer registration, appointments and dashboards are not implemented yet. The product UI currently uses Brazilian Portuguese; the repository documentation is available in both languages.

## Stack

Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, PostgreSQL 17 and Prisma 7.10.0. ESLint and Prettier enforce code quality. Development and production builds use Next.js's supported Webpack option.

## Quick start

Requirements: Node.js 24, npm and Docker Compose v2 for the optional local database.

```sh
git clone https://github.com/HelioGHB/barberflow.git
cd barberflow
nvm use
npm ci
cp .env.example .env
npm run db:up
npm run db:check
npm run dev
```

Open http://localhost:3000. If you do not use nvm, install Node.js 24 directly. The landing page and production build work without a running database or `.env`. A database connection requires `DATABASE_URL`; use your own PostgreSQL instance instead of Docker if preferred.

The credentials in `.env.example` are deliberately public local examples. Never use them in production. Keep actual credentials in ignored environment files or your hosting provider's secret settings.

## Validation

```sh
npm run check
npm test
npm run db:validate
npm run build
npm run db:check
```

`db:check` is an integration check that requires PostgreSQL. GitHub Actions runs quality checks, a production build and a separate PostgreSQL connection job. See the [development guide](docs/en-US/development.md) for known dependency audit findings.

## Documentation

- [Architecture](docs/en-US/architecture.md)
- [Database setup](docs/en-US/database.md)
- [API status](docs/en-US/api.md)
- [Development and GitHub workflow](docs/en-US/development.md)
- [Roadmap](docs/en-US/roadmap.md)
- [All documents in both languages](docs/README.md)
- [Contributing](CONTRIBUTING.md)

Development follows small, independently validated tasks. AI, payments, Pix, WhatsApp API, marketplaces and commercial SaaS features are outside the initial MVP. No license has been selected yet; publishing this repository does not grant an open-source license.
