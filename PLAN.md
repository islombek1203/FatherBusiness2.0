# PLAN.md — Cloud Inventory Management System

Source of truth for scope: `inventory-build-prompt.md.docx` (fixed decisions, do not re-litigate).
This file tracks phase/task progress so a fresh session can resume from `git log` + this file alone.

## Fixed decisions (recap)
- Single store, USD, costing = last purchase price (behind one swappable function), roles Admin/Staff (+ optional read-only Viewer).
- Next.js (App Router) + TypeScript strict, Prisma + PostgreSQL, Tailwind + shadcn/ui, Auth.js (credentials, bcrypt, server sessions), next-intl (uz-Cyrl default, uz-Latn), ExcelJS + Unicode-font PDF export, Vitest + Playwright, PWA, Docker Compose (app+Postgres+Caddy).
- Local dev note: Docker Desktop is not installed on this machine (no GUI available to install it). All Docker artifacts (Dockerfile, docker-compose.yml, Caddyfile) are still written as required deliverables and are meant to be portable to any Linux VPS. Local iteration/testing uses a native Homebrew PostgreSQL 16 instance instead of the Postgres container. This should be re-verified with real `docker compose up` before production use.

## Phase 1 — Foundation
_(Committed: `9c0306e`. The "Commit" checkbox below was left unticked by the session that did this work — the commit itself exists in `git log`. Same for Phases 2–4. Ticked now for accuracy.)_
- [x] Git repo initialized, PLAN.md created
- [x] Next.js (App Router) + TypeScript strict scaffold (Next 16.2.10 / React 19.2 — Turbopack default, async params/cookies/headers, `proxy.ts` not `middleware.ts`)
- [x] Tailwind CSS v4 + shadcn/ui (Base UI primitives — use the `render` prop, not `asChild`) wired up
- [x] Prisma 7 + PostgreSQL connected via `@prisma/adapter-pg` driver adapter, initial migration applied
- [x] Auth.js v5 credentials provider, bcrypt password hashing, real database-backed sessions (custom `jwt.encode`/`decode` bridging to the Prisma adapter's Session table — Auth.js forbids `session.strategy: "database"` for a credentials-only setup, so this is the documented workaround), login rate-limited (5/15min per email)
- [x] Roles: Admin, Staff, Viewer in schema; Admin-only route prefixes enforced in `proxy.ts` + every protected layout re-checks `auth()` server-side. Per-action Staff-vs-Viewer write restrictions land with the first mutating routes in Phase 2.
- [x] next-intl scaffold: uz-Cyrl (default) + uz-Latn, no URL routing — locale resolved from the signed-in user's DB preference, else the `NEXT_LOCALE` cookie (works pre-login on /login), else default
- [x] Responsive app shell + navigation (sidebar desktop / Sheet drawer mobile, safe-area insets), verified via Playwright screenshots at 375/768/1440
- [x] PWA: manifest.json, generated icons (incl. maskable + apple-touch), hand-rolled sw.js (Turbopack has no webpack-plugin PWA lib support), standalone display, safe-area handling
- [x] Seed script: Admin user (random password printed once, or `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` env override). Sample categories/products added once those models exist in Phase 2.
- [x] docker-compose.yml (app + Postgres + Caddy), Dockerfile (multi-stage, non-root), Caddyfile, docker-entrypoint.sh (migrate deploy + seed on boot) — **written but not yet build-tested**: Docker isn't installed on this dev machine (installing Docker Desktop needs a GUI/license step beyond a quiet CLI install, so it was left for the user or a later session). `docker compose up --build` should be run once before relying on this in production.
- [x] .env.example
- [x] Vitest configured, 7 tests passing (rate limiter, locale mapping)
- [x] Playwright configured, 9 tests passing across mobile/tablet/desktop (invalid login, protected-route redirect, full login→dashboard→logout)
- [x] Build clean, typecheck clean, lint clean, phase usable end-to-end (login/logout) — verified live via Playwright, not just unit tests
- [x] Commit (`9c0306e`)

## Phase 2 — Core inventory
- [x] Prisma models: Category, Supplier, Product, InventoryHistory (append-only, `InventoryChangeType` enum shared with Phase 3's Purchase/Sale)
- [x] Categories CRUD + validation + search, soft delete via `isActive` (Restrict FK — a category with products can't be hard-deleted)
- [x] Suppliers CRUD + validation + search, soft delete via `isActive` (not yet linked to Product/Purchase — that lands with Purchases in Phase 3)
- [x] Products CRUD + validation + search/filter by category, linked to Category. SKU unique, `sellingPrice` as Prisma `Decimal`, `currentStock` denormalized
- [x] Stock Adjustments: `adjustStock()` in `src/lib/inventory.ts`, wraps Product.currentStock update + InventoryHistory write in one `$transaction`, triggered via a Dialog on the product list
- [x] Inventory History view (`/inventory`): read-only, most-recent-first, shows who/what/when/qty-before-after
- [x] Zod schemas per entity (`src/lib/validation/*`), error messages are short keys (`required`/`duplicate`/`min0`/…) translated via `formErrors.*` — not hardcoded English
- [x] `requireRole`/`WRITE_ROLES` helper (`src/lib/auth-helpers.ts`) — every mutating server action calls it; Viewer sees read-only UI (write buttons hidden) but the real enforcement is server-side regardless of what the client renders
- [x] Vitest (8 tests) + Playwright (15 tests, all 3 viewports): category create+rename, product create with category linkage via the Select, stock adjustment updating both the product row and inventory history — driven live in a real browser, not just typechecked
- [x] Bug found & fixed during e2e: the login rate limiter counted *successful* logins toward its 5-per-15-min budget, so concurrent legitimate logins (same seeded account, multiple test workers) tripped it. Fixed to only count failures (`isRateLimited`/`recordFailedAttempt` in `src/lib/rate-limit.ts`) — also fixes a real bug where an admin signing in from two devices within 15 minutes would have been locked out
- [x] Seed script extended: 3 sample categories + 4 sample products (idempotent via `upsert`)
- [x] Nav updated (Products/Categories/Suppliers/Inventory), active-link matching fixed to cover sub-routes
- [x] Commit (`3bab4dd`)

## Phase 3 — Transactions
- [x] Prisma models: Purchase/PurchaseItem, Sale/SaleItem (line items, since a real purchase/sale usually covers several products)
- [x] Purchases (`src/lib/purchases.ts` `recordPurchase()`): transactional — stock + `Product.lastPurchasePrice` + InventoryHistory all-or-nothing per line
- [x] Sales (`src/lib/sales.ts` `recordSale()`): transactional, throws `InsufficientStockError` (caught by the action, shown as a translated message) if requested qty exceeds current stock; new-sale form only lists in-stock products
- [x] Costing function (`src/lib/costing.ts`): `getProductCost()` = last purchase price (0 if never purchased), `calculateUnitProfit()`. `SaleItem.unitCost` snapshots cost at sale time so historical profit never shifts when a later purchase changes the product's current cost
- [x] Dashboard: today/this-month sales+profit (Tashkent-timezone business-day boundaries, `src/lib/date-range.ts`), active product count, out-of-stock count, recent sales — real Prisma aggregates, not placeholders
- [x] Profit reporting (`/reports`): date range + category filter, totals + per-product breakdown (revenue, profit, units sold)
- [x] Unit tests: costing function (6), date-range business-day/month boundaries incl. UTC+5 rollover (4) — 18 Vitest tests total across the project
- [x] Playwright: full purchase→sale→dashboard→reports flow verified live (screenshots confirmed exact profit math: 5 × (10000−6000) = 20000), zero-stock products correctly excluded from the sale form — 21/21 across all 3 viewports
- [x] Commit (`21974c2`)

## Phase 4 — Data & admin
- [x] Excel export (ExcelJS) for Products, Purchases, Sales, Inventory History (`src/lib/export/excel.ts`, `/api/export/*`) — column headers translated, verified real Cyrillic bytes intact in the generated xlsx
- [x] PDF export with embedded Unicode font — DejaVu Sans (regular+bold, full Cyrillic coverage) vendored into `public/fonts/` (not node_modules, so it survives Docker's standalone-output file tracing), registered in `src/lib/export/pdf.tsx` via `@react-pdf/renderer`. **Verified with a real generated PDF** — read back page-by-page, Cyrillic headers ("Маҳсулотлар", "Категория", "Қолдиқ", ...) render correctly, no boxes/question marks
- [x] Data import: `/products/import` — Excel upload, upsert-by-SKU, auto-creates missing categories, stock set via the same transactional `adjustStock()` (so imports show up in Inventory History too), "download template" reuses the Products export for round-trip consistency
- [x] Backup: `GET /api/backup` (Admin only) → `pg_dump --format=custom` streamed as a download. **Bug found & fixed via e2e**: Prisma's `?schema=public` query param isn't valid libpq syntax — pg_dump/pg_restore rejected the raw `DATABASE_URL`. Added `src/lib/db-url.ts` to strip Prisma-only params and pass `--schema` separately
- [x] Restore: `POST /api/restore` (Admin only) — `pg_restore --clean --if-exists`, gated behind typing the literal word "RESTORE", warns this is irreversible. **Verified live**: downloaded a real backup, POSTed it back (self-consistent round trip), confirmed `pg_restore --list` shows a well-formed archive and that admin login still works immediately after restore (sessions table correctly gets replaced, forcing re-login, but the user/password data survives intact)
- [x] User Management (`/users`, Admin only): create/edit/reset-password/activate-deactivate; a "last active Admin" guard blocks demoting or deactivating the only remaining Admin, so the app can never lock everyone out
- [x] Settings (`/settings`, Admin only): houses Backup/Restore — no other global config needed since currency/store-scope are fixed per the spec's Section 0
- [x] User Profile (`/profile`): edit own name, change own password (invalidates all sessions incl. current, forcing re-login — standard practice). Language preference already lives in the topbar `LocaleSwitcher` (Phase 1), not duplicated here
- [x] Playwright: 12 new tests (user CRUD + reset password + deactivate, backup download, Excel+PDF export downloads, Excel import) — full suite now 33/33 across mobile/tablet/desktop
- [x] Commit (`ee869ce`)

## Phase 5 — Hardening
- [x] Full Vitest pass (18/18: costing, stock math, rate limiter, locale mapping, date-range)
- [x] Playwright e2e: added `e2e/full-journey.spec.ts` — login → add product → purchase → sale → dashboard → Excel export → PDF export → backup → restore, in one continuous run, asserting zero browser console errors throughout. Restricted to the desktop-1440 project only (pg_restore --clean is not safe to run concurrently against the same DB — see the comment in that file)
- [x] Playwright responsive screenshots at 375px / 768px / 1440px (`responsive-check.mjs` → `resp-shots/`), visually inspected across Products/Sales/Users/Settings/Profile — no issues found
- [x] No build errors, no TS errors, no failing tests. 34/36 Playwright tests passing, 2 correctly skipped; the two on-and-off failures seen during this phase were traced to (a) a stale `next start` process left running from a prior session serving mismatched chunks — not a real regression, and (b) pre-existing cross-test races from the e2e suite sharing one dev DB with no per-test reset (documented, not new)
- [x] Security checklist read-through — see `docs/production-checklist.md` for the full itemized list. New in this phase: constant-time login (dummy-hash `bcrypt.compare` against nonexistent/inactive users), CSPRNG seed-admin password (was `Math.random()`), `Sec-Fetch-Site` same-origin check on backup/restore (`src/lib/require-same-origin.ts`), restore concurrency lock, `poweredByHeader: false`, and a full security-headers set (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) from `next.config.ts`. **Caveat**: the CSP has no script nonce — `proxy.ts`-set response headers were found not to reach the client in this Next.js 16.2.10 build (verified with a minimal repro), so `script-src` needs `'unsafe-inline'` rather than the stricter nonce+`strict-dynamic` policy the App Router docs recommend. Full writeup in `docs/production-checklist.md`
- [x] /docs: installation guide, deployment guide (VPS + Docker Compose + Caddy), production checklist, user manual, admin manual, backup/restore procedure, architecture overview — all added under `docs/`, linked from `README.md`
- [ ] Commit

## Future-proofing (design seams only, not implemented)
Barcode/QR/camera scanning, multi-store/warehouse, cloud sync, analytics, AI features, external API integrations.
