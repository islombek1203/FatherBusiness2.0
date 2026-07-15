# PLAN.md — Cloud Inventory Management System

Source of truth for scope: `inventory-build-prompt.md.docx` (fixed decisions, do not re-litigate).
This file tracks phase/task progress so a fresh session can resume from `git log` + this file alone.

## Fixed decisions (recap)
- Single store, USD, costing = last purchase price (behind one swappable function), roles Admin/Staff (+ optional read-only Viewer).
- Next.js (App Router) + TypeScript strict, Prisma + PostgreSQL, Tailwind + shadcn/ui, Auth.js (credentials, bcrypt, server sessions), next-intl (uz-Cyrl default, uz-Latn), ExcelJS + Unicode-font PDF export, Vitest + Playwright, PWA, Docker Compose (app+Postgres+Caddy).
- Local dev note: Docker Desktop is not installed on this machine (no GUI available to install it). All Docker artifacts (Dockerfile, docker-compose.yml, Caddyfile) are still written as required deliverables and are meant to be portable to any Linux VPS. Local iteration/testing uses a native Homebrew PostgreSQL 16 instance instead of the Postgres container. This should be re-verified with real `docker compose up` before production use.

## Phase 1 — Foundation
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
- [ ] Commit

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
- [ ] Commit

## Phase 3 — Transactions
- [x] Prisma models: Purchase/PurchaseItem, Sale/SaleItem (line items, since a real purchase/sale usually covers several products)
- [x] Purchases (`src/lib/purchases.ts` `recordPurchase()`): transactional — stock + `Product.lastPurchasePrice` + InventoryHistory all-or-nothing per line
- [x] Sales (`src/lib/sales.ts` `recordSale()`): transactional, throws `InsufficientStockError` (caught by the action, shown as a translated message) if requested qty exceeds current stock; new-sale form only lists in-stock products
- [x] Costing function (`src/lib/costing.ts`): `getProductCost()` = last purchase price (0 if never purchased), `calculateUnitProfit()`. `SaleItem.unitCost` snapshots cost at sale time so historical profit never shifts when a later purchase changes the product's current cost
- [x] Dashboard: today/this-month sales+profit (Tashkent-timezone business-day boundaries, `src/lib/date-range.ts`), active product count, out-of-stock count, recent sales — real Prisma aggregates, not placeholders
- [x] Profit reporting (`/reports`): date range + category filter, totals + per-product breakdown (revenue, profit, units sold)
- [x] Unit tests: costing function (6), date-range business-day/month boundaries incl. UTC+5 rollover (4) — 18 Vitest tests total across the project
- [x] Playwright: full purchase→sale→dashboard→reports flow verified live (screenshots confirmed exact profit math: 5 × (10000−6000) = 20000), zero-stock products correctly excluded from the sale form — 21/21 across all 3 viewports
- [ ] Commit

## Phase 4 — Data & admin
- [ ] Excel export (ExcelJS)
- [ ] PDF export with embedded Unicode font (Noto Sans / DejaVu Sans), verified with real Cyrillic PDF
- [ ] Data import
- [ ] Backup (DB dump/export)
- [ ] Restore (from backup)
- [ ] User Management (Admin only)
- [ ] Settings
- [ ] User Profile (incl. language preference)
- [ ] Commit

## Phase 5 — Hardening
- [ ] Full Vitest pass (costing, stock math, auth, role checks)
- [ ] Playwright e2e: login → add product → purchase → sale → dashboard → Excel export → PDF export → backup → restore
- [ ] Playwright responsive screenshots at 375px / 768px / 1440px, visually inspected
- [ ] No build errors, no TS errors, no console errors, no failing tests
- [ ] Security checklist read-through (passwords, sessions, CSRF, authz, parameterized queries, secrets, rate-limit login, security headers)
- [ ] /docs: installation guide, deployment guide (VPS + Docker Compose + Caddy), production checklist, user manual, admin manual, backup procedure, restore procedure, architecture overview
- [ ] Commit

## Future-proofing (design seams only, not implemented)
Barcode/QR/camera scanning, multi-store/warehouse, cloud sync, analytics, AI features, external API integrations.
