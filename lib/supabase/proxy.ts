import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv } from "@/lib/supabase/env"

const PUBLIC_ROUTES = ["/", "/signin", "/register", "/forgot-password"]
// Never redirected either way, regardless of auth state. Two different
// reasons land a route here:
// - /auth/confirm is a one-time link click that must be allowed to run and
//   establish its own session.
// - /reset-password: the recovery session is established client-side (from
//   the emailed link's URL fragment, which the server never sees) — the
//   request arrives here with no session yet, and once the page's own JS
//   establishes one, the form's follow-up submit must not get bounced away.
// - /about is just informational and should stay reachable whether or not
//   you're signed in, unlike /signin or /register which only make sense
//   logged out.
// - /opengraph-image is fetched by link-preview scrapers (Facebook, etc.),
//   which never carry a session — redirecting it to /signin would mean
//   every shared link renders a broken preview card instead of the image.
// - /terms is the Terms & Privacy page — informational, same as /about.
// - /pricing has to work logged out (it's a marketing page) *and* logged
//   in (an owner checking what renewal costs), so it can't go in
//   PUBLIC_ROUTES — that would bounce signed-in visitors to /sell.
const ALWAYS_ALLOW_ROUTES = [
  "/auth/confirm",
  "/reset-password",
  "/about",
  "/opengraph-image",
  "/terms",
  "/pricing",
]

function matches(routes: string[], pathname: string) {
  return routes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  )
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const { url: supabaseUrl, anonKey } = getSupabaseEnv()

  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
      db: { schema: "counter" },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() (not getSession()) forces a round trip that actually
  // revalidates the token against Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  if (matches(ALWAYS_ALLOW_ROUTES, path)) {
    return response
  }

  const isPublic = matches(PUBLIC_ROUTES, path)

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/signin"
    return NextResponse.redirect(url)
  }

  if (user && isPublic) {
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    const url = request.nextUrl.clone()
    url.pathname = superAdmin ? "/super-admin" : "/sell"
    return NextResponse.redirect(url)
  }

  return response
}
