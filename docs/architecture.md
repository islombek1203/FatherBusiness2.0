# Architecture overview

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router), TypeScript strict | Turbopack by default; `proxy.ts` (not `middleware.ts`) |
| Database | PostgreSQL 16 | Accessed via Prisma 7 + `@prisma/adapter-pg` driver adapter |
| Auth | Auth.js v5, Credentials provider | bcrypt password hashing, real DB-backed sessions (see below) |
| UI | Tailwind CSS v4 + shadcn/ui (Base UI primitives) | Use the `render` prop, not `asChild` |
| i18n | next-intl | uz-Cyrl (default) + uz-Latn, no URL routing |
| Exports | ExcelJS, `@react-pdf/renderer` | PDF uses a vendored Unicode font for Cyrillic support |
| Tests | Vitest (unit) + Playwright (e2e) | e2e runs at 375/768/1440px viewports |
| Deployment | Docker Compose: app + Postgres + Caddy | Caddy terminates TLS automatically |

## Request flow

```
Browser → Caddy (TLS, security headers, gzip/zstd) → Next.js app (Node) → PostgreSQL
```

In local dev there is no Caddy; the Next.js dev/prod server is hit directly on port 3000.

`proxy.ts` (App Router's route-level gate, run before rendering) does two things on every non-API, non-public request:

1. Redirects to `/login` if there's no session.
2. Redirects Staff/Viewer away from Admin-only route prefixes (`/admin`, `/settings`, `/users`).

This is a **UX convenience only**. It is not the authorization boundary — every server action and route handler re-checks `auth()` and calls `requireRole()` independently (see `src/lib/auth-helpers.ts`). Never add a new mutating action without that check; the proxy redirect existing does not protect it.

## Auth model

Auth.js v5's Credentials provider only supports the `"jwt"` session strategy — it explicitly disallows `"database"` sessions for a credentials-only setup. This app still wants real, instantly-revocable, DB-backed sessions (so deactivating a user or restoring a backup can force logout). The bridge (`src/auth.ts`):

- `jwt.encode` creates a `Session` row via the Prisma adapter and returns a random session token as the "JWT" (it's not actually a JWT — just an opaque token, but it satisfies Auth.js's `"jwt"` strategy contract).
- `jwt.decode` looks that token up in the `Session` table via the adapter, and returns `null` (forcing re-login) if the row is missing or expired.
- Signing out, changing your own password, and restoring a database backup all delete session rows, which immediately invalidates every active browser session tied to them.

Login is protected by:
- A per-email rate limiter (5 failed attempts / 15 minutes, in-process — see `src/lib/rate-limit.ts`). Only failures count, so the same admin logging in from two devices within the window is never locked out.
- A constant-time password check: even for a nonexistent email, `bcrypt.compare` runs against a dummy hash, so response timing can't be used to enumerate valid emails.

## Data model

See `prisma/schema.prisma` for the full source of truth. Summary:

- **Auth**: `User`, `Account`/`Session`/`VerificationToken` (standard Auth.js adapter tables; `Account`/`VerificationToken` are unused today but kept so the adapter works unmodified if an OAuth provider is ever added).
- **Core inventory**: `Category`, `Supplier`, `Product` (with denormalized `currentStock` and `lastPurchasePrice`), `InventoryHistory` (append-only audit trail — every stock change of any kind writes a row here).
- **Transactions**: `Purchase`/`PurchaseItem`, `Sale`/`SaleItem` (line-item based, since a real purchase or sale usually covers several products).

### Costing

Cost = last purchase price, computed by `getProductCost()` in `src/lib/costing.ts` — a single, swappable function, per the fixed spec decision (Section 0 of the original build prompt). `SaleItem.unitCost` snapshots this value at the moment of sale, so a sale's recorded profit never shifts retroactively when a later purchase changes the product's current cost.

### Stock mutations

Every operation that touches `Product.currentStock` — manual adjustment, purchase, sale, or Excel import — goes through a single `$transaction` that updates the product row and appends an `InventoryHistory` row atomically (`src/lib/inventory.ts`, `src/lib/purchases.ts`, `src/lib/sales.ts`). There is no code path that updates stock without also writing history.

## Validation

Zod schemas live in `src/lib/validation/*`, one per entity. Error messages are short keys (`required`, `duplicate`, `min0`, …), translated client-side via the `formErrors.*` message namespace — never hardcoded English strings, so both locales stay in sync automatically.

## Backup / restore

- **Backup** (`GET /api/backup`, Admin only): shells out to `pg_dump --format=custom`, streamed directly as a download. `src/lib/db-url.ts` strips Prisma-only query params (`?schema=`) from `DATABASE_URL` before handing it to `pg_dump`/`pg_restore`, since those aren't valid libpq connection string syntax.
- **Restore** (`POST /api/restore`, Admin only): `pg_restore --clean --if-exists`, gated behind the user typing the literal word `RESTORE`. Guarded by an in-process lock (`restoreInProgress` in `src/lib/restore.ts`) since two concurrent restores race their `DROP`/`CREATE` statements against the same database and leave it half-restored.
- Both routes additionally check the `Sec-Fetch-Site` request header (`src/lib/require-same-origin.ts`) and reject anything that isn't same-origin, as defense-in-depth against CSRF beyond the `SameSite=Lax` session cookie.

See [`backup-restore.md`](./backup-restore.md) for the operational procedure.

## Security posture

See [`production-checklist.md`](./production-checklist.md) for the full read-through. Highlights: bcrypt + CSPRNG passwords, constant-time login, DB-backed revocable sessions, server-side authorization on every mutation (never trust the client), Prisma-only queries (no raw SQL in application code), a CSP + standard security headers set from `next.config.ts` (mirrored at the reverse-proxy level in `Caddyfile` for the Docker deployment), and login rate-limiting.

## Directory map

```
src/
  app/
    (app)/            # authenticated shell: sidebar/topbar layout + all feature pages
    api/               # export, backup, restore, NextAuth routes
    login/, offline/    # public pages
  components/ui/        # shadcn/ui (Base UI) primitives
  lib/                   # business logic — inventory, purchases, sales, costing,
                          # date-range, auth-helpers, rate-limit, export/*, validation/*
  generated/prisma/       # generated Prisma client (gitignored, regenerated on install)
  i18n/                    # next-intl config
prisma/
  schema.prisma
  migrations/
  seed.ts
e2e/                        # Playwright specs
src/lib/**/*.test.ts          # Vitest unit tests, colocated with the code under test
```
