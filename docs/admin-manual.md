# Admin manual

Covers the features only the **Admin** role can see and use. Read [`user-manual.md`](./user-manual.md) first for everything shared with Staff/Viewer.

Admin-only areas (`/settings`, `/users`, and the `/admin` prefix) are gated at the routing level (redirected away if you're not an Admin) *and* independently re-checked in every server action — this is a defense-in-depth pattern used throughout the app, not just for these routes.

## User management (`/users`)

- **Create a user**: set name, email, initial password, and role (Admin / Staff / Viewer).
- **Edit**: change a user's name, email, or role.
- **Reset password**: set a new password for a user directly (e.g. if they're locked out or forgot theirs). This invalidates that user's existing sessions.
- **Activate / deactivate**: a deactivated account can no longer log in, but its historical purchases/sales/inventory-history entries remain intact and attributed to them (their `User` row is never deleted, only flagged inactive).
- **The "last Admin" guard**: you cannot demote or deactivate the only remaining Admin account. If you try, the action is refused — this is a deliberate safety rail so the app can never end up with zero Admins able to manage it. If you need to remove the last Admin, promote or create another Admin first.

## Settings (`/settings`)

Currently houses **Backup** and **Restore** only — see [`backup-restore.md`](./backup-restore.md) for the full procedure and cautions (restore is irreversible from within the app). There is no other global configuration: currency (USD) and store scope (single store) are fixed decisions for this build, not configurable settings.

## Things only Admins should be trusted with

- Running a restore (see the dedicated doc — this replaces *all* current data).
- Downloading backups (they contain everything: all users' names/emails, hashed passwords, every transaction).
- Creating other Admin accounts — treat this as seriously as handing someone a master key.

## Operational responsibilities

As the Admin, you're the one expected to:
- Periodically download backups (the app does not schedule this automatically — see [`backup-restore.md`](./backup-restore.md#automating-backups-recommended-for-production) for how to automate it).
- Deactivate accounts for staff who leave, rather than leaving their login active.
- Keep at least one other Admin around if possible, so you're not a single point of failure for account recovery (the "last Admin" guard prevents the app from *losing* all Admins, but it can't help if the sole Admin themselves is unreachable and needs their own password reset).
