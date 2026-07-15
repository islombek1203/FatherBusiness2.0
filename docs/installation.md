# Installation guide (local development)

This sets up the app for local development and testing — not production. For a
production deployment, see [`deployment.md`](./deployment.md).

## Prerequisites

- Node.js 22+
- A running PostgreSQL 16 instance (Homebrew, a local container, or any reachable Postgres 16 server)
- `pg_dump` / `pg_restore` on your `PATH` if you want to exercise the backup/restore feature locally (matching major version 16, to match the target Postgres server)

## Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in real values:

   ```bash
   cp .env.example .env
   ```

   At minimum, set:
   - `DATABASE_URL` — point it at your local Postgres instance.
   - `AUTH_SECRET` — generate one with `openssl rand -base64 32`.

   Leave `AUTH_TRUST_HOST="true"` for local dev over plain HTTP.

3. Apply database migrations:

   ```bash
   npx prisma migrate dev
   ```

4. Seed the initial Admin account:

   ```bash
   npx prisma db seed
   ```

   This prints a randomly generated Admin password **once**, to the console. Save it somewhere safe — it is not shown again and is not recoverable (only re-settable, via `/users` once you're logged in as another Admin, or by editing the database directly). To use a known password instead of a random one (useful for scripted/CI setups), set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env` before seeding.

   The seed is idempotent — re-running it will not create duplicate categories/products/Admins, and will not touch an Admin account that already exists.

5. Start the dev server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` and log in with the seeded Admin credentials.

## Useful scripts

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test         # Vitest unit/integration tests
npm run e2e          # Playwright e2e (builds + starts the app itself — see note below)
npm run build         # production build
```

`npm run e2e` builds and starts its own server on port 3000 (see `playwright.config.ts`'s `webServer` block) and reuses one if it finds it already listening there. If you've been running `npm run dev` or a stale `npm run start` from a previous session, either stop it first or be aware Playwright will reuse it as-is — a server left running from before your latest code change will serve stale JS chunks and produces confusing, unrelated-looking test failures (mismatched chunk hashes, spurious 500s). When in doubt: `lsof -ti :3000 | xargs kill` before running `npm run e2e`.

## Common issues

- **`next/font` build failure ("Failed to fetch `Geist` from Google Fonts")**: transient network issue reaching Google Fonts at build time — retry the build. If your environment has no outbound internet access at build time at all, this needs `next/font/local` with vendored font files instead (not currently set up — see [`production-checklist.md`](./production-checklist.md)).
- **e2e tests fail with 500s / 404s for stale chunk files, but pass when run alone**: a stale server from a previous run is still bound to port 3000 — see above.
- **e2e tests occasionally fail with "row not found" / timeouts, but pass on retry**: the e2e suite runs against one shared dev database with no per-test isolation or reset, and by default runs fully parallel across 3 viewport projects. Rare cross-test races are a known, accepted tradeoff (see the comment above `full-journey.spec.ts`, which is deliberately restricted to a single project for the same reason). Re-run the specific failing spec in isolation to confirm before treating it as a real regression.
