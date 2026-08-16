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
      }

      if (meta.store_name && meta.first_name && meta.last_name) {
        const { error: rpcError } = await supabase.rpc(
          "create_store_and_profile",
          {
            store_name: meta.store_name,
            first: meta.first_name,
            last: meta.last_name,
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
