import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"
import { getSupabaseEnv } from "@/lib/supabase/env"

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseEnv()

  return createServerClient<Database>(url, anonKey, {
    db: { schema: "counter" },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component render — proxy.ts refreshes
          // the session cookie on the next request instead.
        }
      },
    },
  })
}

// Password-recovery emails need to work when opened on a different device
// or browser than the one that requested them (e.g. request on a laptop,
// open the email on a phone) — but the default PKCE flow (used everywhere
// else in this app) can only be completed in the browser that started it,
// since it depends on a code_verifier stored there. This client forces the
// classic implicit flow instead purely for that one call, which embeds a
// usable session directly in the emailed link. It's stateless (no cookies,
// no persisted session) since its only job is to trigger the email send.
export function createImplicitFlowClient() {
  const { url, anonKey } = getSupabaseEnv()

  return createSupabaseClient<Database>(url, anonKey, {
    db: { schema: "counter" },
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false },
  })
}
