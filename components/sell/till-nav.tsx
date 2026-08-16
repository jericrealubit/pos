import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

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
    <div className="mt-2 flex gap-2 border-t pt-2 pb-[env(safe-area-inset-bottom)]">
      <Link
        href="/sell"
        className={cn(
          buttonVariants({ variant: active === "sell" ? "default" : "outline", size: "till" }),
          "flex-1 gap-1.5"
        )}
      >
        Sell
        <LinkPendingIndicator />
      </Link>
      {canManageProducts && (
        <Link
          href="/admin/products"
          className={cn(
            buttonVariants({ variant: active === "admin" ? "default" : "outline", size: "till" }),
            "flex-1 gap-1.5"
          )}
        >
          Admin
          <LinkPendingIndicator />
        </Link>
      )}
    </div>
  )
}
