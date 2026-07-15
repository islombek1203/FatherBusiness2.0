# Backup and restore procedure

Both operations live under **Settings** (`/settings`), and are Admin-only.

## Backup

1. Go to **Settings** → **Захира нусха** (Backup).
2. Click **Захира нусхани юклаб олиш** (Download backup). This streams a `pg_dump --format=custom` archive (`inventory-backup-<timestamp>.dump`) directly to your browser's downloads — there is no server-side copy kept automatically.
3. Store the downloaded file somewhere durable and off the VPS itself (e.g. sync it to separate storage). The app does not currently schedule or retain backups automatically — treat this as a manual, deliberate action to run on whatever cadence your business needs (e.g. daily, via a cron job that hits this endpoint with an authenticated session, or just manually before risky operations).

A `.dump` file produced this way is a standard `pg_dump` custom-format archive — it can also be restored with the `pg_restore` CLI directly against the database if needed, independent of this app.

## Restore

**This is the single most destructive action in the app.** Restoring replaces *all* current data with whatever is in the uploaded backup file. It cannot be undone from within the app — the only way back is restoring a different (older) backup.

1. Go to **Settings** → **Тиклаш** (Restore).
2. Choose the `.dump` file to restore from.
3. Type the literal word `RESTORE` in the confirmation field. This is a deliberate friction point — the button stays disabled until the exact word is typed.
4. Click **Тиклаш** (Restore).
5. The restore runs `pg_restore --clean --if-exists`, which drops and recreates the schema before reloading it. **All sessions are invalidated as a side effect** (the `sessions` table itself gets replaced) — you will be redirected to `/login` once it completes. Log back in with credentials that exist *in the restored backup*, not necessarily the ones you were just using.

### Concurrency

Only one restore can run at a time (enforced server-side — a second concurrent restore attempt is rejected with a "restore already in progress" message rather than silently racing). This is a single-process, in-memory lock: it protects against accidental double-submission, not against multiple app instances restoring simultaneously. If you ever run more than one instance of this app against the same database, restores need to be coordinated externally (e.g. a maintenance window with only one instance running).

### Before restoring in production

- Take a fresh backup first, even if you're about to overwrite it — if the restore doesn't do what you expected, you want a way back to *right before* you ran it, not just your last scheduled backup.
- Confirm the `.dump` file is from a compatible schema version (produced by this same app, ideally the same or a migrated-forward version). Restoring a backup from a very different schema version is untested and may fail partway through `pg_restore`, leaving the database in an inconsistent state.
- Communicate the downtime — the app is unusable for the duration of the restore (typically seconds for a small database, longer as data grows), and every logged-in user is forced to re-authenticate immediately after.

## Automating backups (recommended for production)

The app has no built-in scheduler. To automate, run a script against a live, authenticated session on a cron schedule (outside the app), e.g.:

```bash
# Pseudocode — actual implementation depends on how you manage the Admin session/cookie.
curl -sS -b "authjs.session-token=<valid admin session cookie>" \
  https://<DOMAIN>/api/backup -o "backup-$(date +%F).dump"
```

Alternatively, since the underlying mechanism is a standard `pg_dump`, you can bypass the app entirely and back up the `db` container directly from the host:

```bash
docker compose exec -T db pg_dump --format=custom -U "$POSTGRES_USER" "$POSTGRES_DB" > "backup-$(date +%F).dump"
```

This is arguably more robust for unattended automation since it doesn't depend on an app-level session, but it does bypass the app's Admin-only gate and same-origin check — restrict access to the host/VPS accordingly.
