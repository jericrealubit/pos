// Deliberately using the deprecated `middleware.ts`/`experimental-edge`
// convention instead of Next 16's `proxy.ts` (which the framework now
// defaults to the Node.js runtime, with no way to opt back into an edge
// runtime — setting `runtime` in a proxy.ts file throws). The Cloudflare
// adapter (@opennextjs/cloudflare) doesn't yet support Node.js-runtime
// middleware ("Node.js middleware is not currently supported" build
// error), so this file stays on the older convention until that adapter
// catches up to Next 16's Proxy rename. Revisit and migrate back to
// proxy.ts once @opennextjs/cloudflare adds support.
import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  runtime: "experimental-edge",
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
