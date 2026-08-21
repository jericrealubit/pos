// Nightly database backup: dumps the counter schema (schema + data — this
// app's entire business data) and the auth schema (data only — the auth
// schema's own DDL is Supabase-managed and already recreated automatically
// on any Supabase project; only the actual user rows are ours to lose),
// gzips each, and uploads them to a private Cloudflare R2 bucket.
//
// Requires SUPABASE_ACCESS_TOKEN (read by the Supabase CLI) and
// CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (read by wrangler) to be set
// in the environment — see BACKUPS.md for where these come from and how to
// restore from what this produces.
//
// Usage: node scripts/backup-database.mjs
//   env: R2_BUCKET_NAME (required), SUPABASE_PROJECT_REF (optional, has a default)

import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "cqzogkadiatpcvxgxqkc"
const BUCKET = process.env.R2_BUCKET_NAME

if (!BUCKET) {
  console.error("R2_BUCKET_NAME environment variable is required.")
  process.exit(1)
}

const dateStamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
const workDir = mkdtempSync(join(tmpdir(), "counter-backup-"))

// shell: true so this works cross-platform — on Windows, npm-installed CLIs
// resolve to a .cmd wrapper that execFileSync can't spawn directly without
// going through a shell (EINVAL otherwise).
function dump(extraArgs, outFile) {
  console.log(`Dumping ${outFile}...`)
  execFileSync(
    "npx",
    ["supabase", "db", "dump", "--project-ref", PROJECT_REF, ...extraArgs, "-f", outFile],
    { stdio: "inherit", shell: true }
  )
}

function gzipAndUpload(localFile, remotePath) {
  const gzPath = `${localFile}.gz`
  writeFileSync(gzPath, gzipSync(readFileSync(localFile)))
  console.log(`Uploading ${remotePath}...`)
  execFileSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `${BUCKET}/${remotePath}`,
      "--file",
      gzPath,
      "--content-type",
      "application/sql",
      "--content-encoding",
      "gzip",
      "--remote",
    ],
    { stdio: "inherit", shell: true }
  )
}

try {
  const counterSchema = join(workDir, "counter-schema.sql")
  const counterData = join(workDir, "counter-data.sql")
  const authData = join(workDir, "auth-data.sql")

  dump(["-s", "counter"], counterSchema)
  dump(["-s", "counter", "--data-only"], counterData)
  dump(["-s", "auth", "--data-only"], authData)

  gzipAndUpload(counterSchema, `backups/${dateStamp}/counter-schema.sql.gz`)
  gzipAndUpload(counterData, `backups/${dateStamp}/counter-data.sql.gz`)
  gzipAndUpload(authData, `backups/${dateStamp}/auth-data.sql.gz`)

  console.log(`Backup complete: backups/${dateStamp}/`)
} finally {
  rmSync(workDir, { recursive: true, force: true })
}
