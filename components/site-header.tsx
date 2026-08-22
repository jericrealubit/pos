import Link from "next/link"
import Image from "next/image"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b p-4">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Image src="/logo-mark.png" alt="" width={28} height={28} />
        Counter
      </Link>
      <nav className="flex items-center gap-4">
        <Link
          href="/pricing"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Pricing
        </Link>
        <Link
          href="/about"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          About
        </Link>
        <Link
          href="/signin"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          Sign in
          <LinkPendingIndicator className="size-3.5" />
        </Link>
        <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
          Create account
          <LinkPendingIndicator className="size-3.5" />
        </Link>
      </nav>
    </header>
  )
}
