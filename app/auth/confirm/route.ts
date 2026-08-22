import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const meta = data.user.user_metadata as {
        store_name?: string
        first_name?: string
        last_name?: string
        country?: string
        currency?: string
      }

      if (meta.store_name && meta.first_name && meta.last_name) {
        const { error: rpcError } = await supabase.rpc(
          "create_store_and_profile",
          {
            store_name: meta.store_name,
            first: meta.first_name,
            last: meta.last_name,
            // Anyone who signed up before country capture shipped still
            // has a pending confirmation link with no country on it;
            // they fall through to the rest-of-world defaults.
            p_currency: meta.currency ?? "USD",
            p_country: meta.country ?? null,
          }
        )
        // Ignore "already belongs to a store" — the link may be opened
        // twice (email scanners, double-click); any other RPC failure
        // still lands the user on /signin via the admin layout's guard.
        if (rpcError && !rpcError.message.includes("already belongs to a store")) {
          return NextResponse.redirect(
            new URL("/signin?error=setup_failed", request.url)
          )
        }
      }

      return NextResponse.redirect(new URL("/sell", request.url))
    }
  }

  return NextResponse.redirect(
    new URL("/signin?error=confirmation_failed", request.url)
  )
}
