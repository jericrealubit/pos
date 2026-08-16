import Link from "next/link"

import { cn } from "@/lib/utils"

type Role = "OWNER" | "ADMIN" | "CASHIER"

export function TillNav({
  role,
  active,
}: {
  role: Role | undefined
  active: "sell" | "admin"
}) {
  const canManageProducts = role === "OWNER" || role === "ADMIN"

  return (
    <div className="mt-2 flex border-t pb-[env(safe-area-inset-bottom)]">
      <Link
        href="/sell"
        className={cn(
          "flex-1 py-3 text-center text-sm",
          active === "sell" ? "font-medium text-foreground" : "text-muted-foreground"
        )}
      >
        Sell
      </Link>
      {canManageProducts && (
        <Link
          href="/admin/products"
          className={cn(
            "flex-1 py-3 text-center text-sm",
            active === "admin" ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          Admin
        </Link>
      )}
    </div>
  )
}
