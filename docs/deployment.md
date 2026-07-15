# Deployment guide (VPS + Docker Compose + Caddy)

## Overview

`docker-compose.yml` runs three services:

- **`db`** — `postgres:16-alpine`, with a named volume for data and a bind mount of `./backups` (used by the backup/restore feature's staging directory).
- **`app`** — the Next.js app, built from the repo's `Dockerfile` (multi-stage: full install → production-only install → build → minimal runtime image running as a non-root `nextjs` user). On every container start, `docker-entrypoint.sh` runs `prisma migrate deploy` then `prisma db seed` (idempotent — safe on every restart) before starting the server.
- **`caddy`** — `caddy:2-alpine`, reverse-proxies to `app:3000`, and automatically obtains and renews a TLS certificate for `DOMAIN` (as long as `DOMAIN` is a real, publicly resolvable domain pointing at this server — see below).

## Prerequisites

- A Linux VPS with Docker and the Docker Compose plugin installed (`docker compose version` should work).
- A domain name with an `A`/`AAAA` DNS record pointing at the VPS's public IP, **if** you want Caddy to provision a real TLS certificate. (For a purely internal/LAN deployment without a public domain, see "No public domain" below.)
- Ports 80 and 443 open and not in use by anything else on the VPS (Caddy needs 80 for the ACME HTTP challenge as well as 443).

## Steps

1. Clone/copy the repository onto the VPS.

2. Create the production `.env`:

   ```bash
   cp .env.example .env
   ```

   Set real values:
   - `POSTGRES_PASSWORD` — a strong, unique password (this is *not* the app's own DB user password from local dev; it provisions the container's Postgres role).
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`. **Do not reuse the value from any other environment** (dev, staging) — anyone with this secret can forge session tokens.
   - `DOMAIN` — your real domain (e.g. `inventory.example.com`). Caddy uses this both for TLS and as the `Host` header it expects.
   - Leave `DATABASE_URL` as-is — `docker-compose.yml` overrides it for the `app` service based on `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` regardless of what's in `.env`.
   - Optionally set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` to control the bootstrap Admin account instead of getting a random generated password printed once to `docker compose logs app`.

3. Build and start everything:

   ```bash
   docker compose up --build -d
   ```

4. Watch the logs until the app is healthy and the Admin account is seeded:

   ```bash
   docker compose logs -f app
   ```

   If you didn't set `SEED_ADMIN_PASSWORD`, the generated password is printed here **once**. Copy it immediately.

5. Visit `https://<DOMAIN>` and log in.

## No public domain (internal/LAN deployment)

Set `DOMAIN=localhost` (or leave the default) and access the app over plain HTTP at the VPS's address on whatever port you expose, or put your own TLS-terminating proxy in front instead of Caddy. Caddy will not attempt to obtain a certificate for `localhost`. This is not recommended for anything reachable from the public internet — the app expects to sit behind TLS in production (cookies, CSP `upgrade-insecure-requests`, etc. all assume HTTPS).

## Updating a deployment

```bash
git pull
docker compose up --build -d
```

The `app` container re-runs `prisma migrate deploy` on every start, so new migrations are applied automatically. The `db` container's data persists in the `db_data` named volume across rebuilds — it is not affected by `--build`.

## Verifying this guide against a real build

**This procedure has not yet been build-tested end-to-end on this development machine** (Docker Desktop isn't installed here — see `PLAN.md`'s Phase 1 note). Before relying on this in production:

1. Run `docker compose up --build` once, locally or on a throwaway VPS, and confirm the app comes up, migrations apply, the Admin seed works, and login succeeds.
2. Confirm `pg_dump`/`pg_restore` inside the `app` container actually match the `db` container's Postgres major version (both should be 16 — check `Dockerfile`'s `postgresql16-client` package against `docker-compose.yml`'s `postgres:16-alpine` image if either is ever bumped).
3. Confirm Caddy successfully issues a certificate for a real `DOMAIN` (watch `docker compose logs caddy`).

See [`production-checklist.md`](./production-checklist.md) for the full pre-launch checklist.
