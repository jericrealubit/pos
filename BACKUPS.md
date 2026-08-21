# Database backups

**Current state of the live Supabase project** (checked directly via `npx supabase backups list --project-ref cqzogkadiatpcvxgxqkc`): no platform backups and no point-in-time recovery. That's the gap this document and the backup workflow close.

## Two layers, on purpose

Don't rely on Supabase alone for this:

1. **Supabase Pro + PITR (recommended, not yet done)** — the single highest-leverage fix. Pro adds 7 days of automatic daily backups; enabling Point-in-Time Recovery on top of that lets you restore to *any second* within the retention window, not just once-a-day granularity. This is a billing decision for the project owner to make in the Supabase dashboard (Project Settings → Add-ons) — not something that can be turned on from code.
2. **Independent off-platform backups (this repo)** — daily dumps of this app's own data, pushed to a private Cloudflare R2 bucket, automated via GitHub Actions. This exists even if Supabase itself has an incident, and gives you a portable copy you control.

## What's backed up

Every backup run (`scripts/backup-database.mjs`) produces three files, uploaded to `backups/YYYY-MM-DD/` in the R2 bucket:

| File | Contents |
|---|---|
| `counter-schema.sql.gz` | Full DDL for the `counter` schema — every table, type, function, and RLS policy this app defines |
| `counter-data.sql.gz` | Every row in every `counter` table — stores, profiles, products, categories, customers, sales, sale_items, payments |
| `auth-data.sql.gz` | The actual user account rows (`auth.users`, `identities`, `sessions`, etc.) — not the `auth` schema's own DDL, which is Supabase-managed and already recreated automatically on any Supabase project |

**Not backed up by this workflow**: Supabase Storage objects (this app doesn't use Storage buckets today) and the `auth` schema's own table definitions (Supabase's responsibility, not ours).

## Retention

Objects older than 30 days are auto-deleted by an R2 **lifecycle rule** configured once on the bucket (via the Cloudflare dashboard or `wrangler r2 bucket lifecycle`) — the backup script itself does no rotation/deletion.

## One-time setup

1. Create the bucket: `npx wrangler r2 bucket create pos-db-backups`
2. Add a 30-day expiry lifecycle rule to it (dashboard: R2 → bucket → Settings → Object lifecycle rules, or the equivalent `wrangler r2 bucket lifecycle` command).
3. Create a Cloudflare API token scoped to **only** that bucket (R2 → Manage API tokens), and a Supabase personal access token (Supabase dashboard → Account → Access Tokens).
4. Add four GitHub Actions repo secrets (Settings → Secrets and variables → Actions):
   - `SUPABASE_ACCESS_TOKEN`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `R2_BUCKET_NAME`

Once those secrets exist, `.github/workflows/backup.yml` runs automatically every night at 03:00 UTC, and can be triggered on demand anytime from the Actions tab (`Run workflow`) — worth doing right before a risky migration.

You can also run it locally: `npm run backup` (needs the same four values as local env vars, plus Docker Desktop running — the Supabase CLI dumps through a matching-version Postgres container).

## Restoring from a backup

An untested backup isn't a real backup — actually run this after setting things up, and periodically afterward:

1. Download the three files for the date you want from the R2 bucket (`npx wrangler r2 object get <bucket>/backups/<date>/counter-schema.sql.gz --file counter-schema.sql.gz --remote`, repeat for the other two), then `gunzip` each.
2. Spin up a scratch Postgres instance to restore into — either a local one (`docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:17`) or a throwaway Supabase project. Don't restore into the live project.
3. Restore schema, then data, in that order:
   ```bash
   psql "$SCRATCH_DB_URL" -f counter-schema.sql
   psql "$SCRATCH_DB_URL" -f counter-data.sql
   psql "$SCRATCH_DB_URL" -f auth-data.sql
   ```
4. Spot-check: connect and confirm row counts and a few known records (e.g. `select count(*) from counter.sales;`) match what you expect from the backup's date.

## If you actually need to restore into production

This is rare and destructive — treat it like the emergency it is:
1. If Supabase Pro/PITR is enabled, prefer that restore path first (dashboard-driven, keeps the same project, far less manual reassembly).
2. Otherwise, restoring one of these dumps into the live project means truncating/recreating the affected tables first — this will destroy whatever's currently there. Take a fresh backup of the *current* (possibly-broken) state before touching anything, in case the restore itself needs undoing.
3. Restore into a scratch project first (see above), verify it looks right, then decide the actual production restore steps with that verified copy in hand rather than improvising against the live database.
