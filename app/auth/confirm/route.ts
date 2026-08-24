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
        invite_token?: string
      }

      // Checked first: a single signUp call only ever sets one of
      // invite_token or store_name (registerAction sets the latter,
      // acceptInviteSignup the former) — but the branch shouldn't
      // silently trust that invariant, so invite_token wins if somehow
      // both were ever present, rather than accidentally creating a
      // second store for someone who was actually invited to an
      // existing one.
      if (meta.invite_token) {
        const { error: rpcError } = await supabase.rpc("accept_staff_invite", {
          p_token: meta.invite_token,
          p_first: meta.first_name ?? "",
          p_last: meta.last_name ?? "",
        })
        if (rpcError && !rpcError.message.includes("already belongs to a store")) {
          return NextResponse.redirect(
            new URL("/signin?error=invite_failed", request.url)
          )
        }
        return NextResponse.redirect(new URL("/sell", request.url))
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
