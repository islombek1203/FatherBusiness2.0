# Ombor Boshqaruvi — Cloud Inventory Management System

Single-store inventory management: products, categories, suppliers, stock,
purchases, sales and reports. Uzbek Cyrillic (default) and Uzbek Latin
localization, installable PWA, Dockerized deployment.

See [`PLAN.md`](./PLAN.md) for build phases and progress.

## Stack

Next.js (App Router, TypeScript strict) · PostgreSQL + Prisma · Auth.js
(credentials, bcrypt, database-backed sessions) · Tailwind + shadcn/ui ·
next-intl · ExcelJS / PDF export · Vitest + Playwright · Docker Compose +
Caddy.

## Local development

Prerequisites: Node.js 22+, a running PostgreSQL 16 instance.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL / AUTH_SECRET for your local Postgres
npx prisma migrate dev
npx prisma db seed     # creates the initial Admin user; prints the generated password once
npm run dev
```

Useful scripts:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test         # Vitest unit/integration tests
npm run e2e          # Playwright e2e (builds + starts the app itself)
npm run build         # production build
```

## Deployment

The same `docker-compose.yml` runs locally or on any Linux VPS: it builds the
app image, runs PostgreSQL, and terminates TLS automatically via Caddy.

```bash
cp .env.example .env   # set real DOMAIN, POSTGRES_PASSWORD, AUTH_SECRET
docker compose up --build -d
```

See [`docs/`](./docs) for the full installation guide, deployment guide,
backup/restore procedure, and user/admin manuals (added in the hardening
phase — see PLAN.md).
