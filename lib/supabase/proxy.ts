import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv } from "@/lib/supabase/env"

const PUBLIC_ROUTES = ["/", "/signin", "/register"]
// Never redirected either way, regardless of auth state — a one-time link
// click that must be allowed to run and establish its own session.
const ALWAYS_ALLOW_ROUTES = ["/auth/confirm"]

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
