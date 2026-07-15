# PLAN.md — Cloud Inventory Management System

Source of truth for scope: `inventory-build-prompt.md.docx` (fixed decisions, do not re-litigate).
This file tracks phase/task progress so a fresh session can resume from `git log` + this file alone.

## Fixed decisions (recap)
- Single store, USD, costing = last purchase price (behind one swappable function), roles Admin/Staff (+ optional read-only Viewer).
- Next.js (App Router) + TypeScript strict, Prisma + PostgreSQL, Tailwind + shadcn/ui, Auth.js (credentials, bcrypt, server sessions), next-intl (uz-Cyrl default, uz-Latn), ExcelJS + Unicode-font PDF export, Vitest + Playwright, PWA, Docker Compose (app+Postgres+Caddy).
- Local dev note: Docker Desktop is not installed on this machine (no GUI available to install it). All Docker artifacts (Dockerfile, docker-compose.yml, Caddyfile) are still written as required deliverables and are meant to be portable to any Linux VPS. Local iteration/testing uses a native Homebrew PostgreSQL 16 instance instead of the Postgres container. This should be re-verified with real `docker compose up` before production use.

## Phase 1 — Foundation
- [x] Git repo initialized, PLAN.md created
- [ ] Next.js (App Router) + TypeScript strict scaffold
- [ ] Tailwind CSS + shadcn/ui wired up
- [ ] Prisma + PostgreSQL connected, initial migration
- [ ] Auth.js credentials provider, bcrypt password hashing, server-side sessions
- [ ] Roles: Admin, Staff (+ Viewer read-only) enforced server-side
- [ ] next-intl scaffold: uz-Cyrl (default) + uz-Latn, cookie + per-user persisted locale
- [ ] Responsive app shell + navigation (375/768/1440)
- [ ] Seed script: Admin user + sample categories/products
- [ ] docker-compose.yml (app + Postgres + Caddy), Dockerfile, Caddyfile
- [ ] .env.example
- [ ] Vitest configured, first passing test
- [ ] Playwright configured, first passing smoke test
- [ ] Build clean, typecheck clean, phase usable end-to-end (login/logout)
- [ ] Commit

## Phase 2 — Core inventory
- [ ] Prisma models: Category, Supplier, Product, InventoryHistory (append-only)
- [ ] Categories CRUD + validation + search/filter
- [ ] Suppliers CRUD + validation + search/filter
- [ ] Products CRUD + validation + search/filter, linked to Category/Supplier
- [ ] Stock Adjustments (transactional, writes InventoryHistory)
- [ ] Inventory History view (who/what/when/qty before-after)
- [ ] Zod schemas for all server-side input validation
- [ ] Tests (unit + e2e for CRUD flows)
- [ ] Commit

## Phase 3 — Transactions
- [ ] Prisma models: Purchase, Sale (+ line items)
- [ ] Purchases: update stock + last purchase price (transactional)
- [ ] Sales: decrement stock + compute profit via costing function (transactional)
- [ ] Costing function: single well-named function, last-purchase-price method
- [ ] Dashboard: correct stock/sales/profit calculations
- [ ] Profit reporting (by date range / product / category)
- [ ] Unit tests: costing function, stock math
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
