"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export function AdminNavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const active = pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground",
        active && "border-l-[3px] border-primary bg-muted font-medium text-foreground"
      )}
    >
      {icon}
      {children}
      <LinkPendingIndicator className="size-3.5" />
    </Link>
  )
}
