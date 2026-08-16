"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export function AdminNavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const active = pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 border-l-2 border-transparent px-4 py-2 text-sm text-muted-foreground",
        active && "border-foreground bg-muted font-medium text-foreground"
      )}
    >
      {children}
      <LinkPendingIndicator className="size-3.5" />
    </Link>
  )
}
