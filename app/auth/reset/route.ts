import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      return NextResponse.redirect(new URL("/reset-password", request.url))
    }
  }

  return NextResponse.redirect(
    new URL("/forgot-password?error=reset_failed", request.url)
  )
}
