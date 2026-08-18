export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "On Cloudflare these must be set as *Build* variables (Workers Builds -> " +
        "Build variables and secrets), not just runtime environment variables -- " +
        "Next.js inlines NEXT_PUBLIC_* at build time. A rebuild is required after " +
        "setting them."
    )
  }

  return { url, anonKey }
}
