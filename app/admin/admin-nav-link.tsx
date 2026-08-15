"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

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
        "block border-l-2 border-transparent px-4 py-2 text-sm text-muted-foreground",
        active && "border-foreground bg-muted font-medium text-foreground"
      )}
    >
      {children}
    </Link>
  )
}
