"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArchiveIcon, PackageOpenIcon, Trash2Icon } from "lucide-react"

import { useSellCart } from "@/components/sell/sell-provider"
import { TillAppBar } from "@/components/sell/till-app-bar"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { formatMoney } from "@/lib/money"
import { heldCartTotalCents } from "@/lib/pos/held-carts"

export function HeldSalesList() {
  const router = useRouter()
  const { lines, heldCarts, resumeHeldCart, discardHeldCart, currency } = useSellCart()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function resume(id: string) {
    // Resuming replaces the active cart, so confirm first if the cashier
    // has something in progress — never silently drop it.
    if (lines.length > 0) {
      setConfirmId(id)
      return
    }
    resumeHeldCart(id)
    router.push("/sell/cart")
  }

  function confirmResume() {
    if (!confirmId) return
    resumeHeldCart(confirmId)
    setConfirmId(null)
    router.push("/sell/cart")
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <TillAppBar backHref="/sell" title="Held sales" />

      {heldCarts.length === 0 ? (
        <EmptyState icon={PackageOpenIcon} title="No held sales" />
      ) : (
        <div className="flex flex-col gap-2">
          {heldCarts.map((held) => (
            <div key={held.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{held.label}</div>
                <div className="text-xs text-muted-foreground">
                  {formatMoney(heldCartTotalCents(held), currency)}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-till"
                aria-label="Discard held sale"
                className="text-muted-foreground"
                onClick={() => discardHeldCart(held.id)}
              >
                <Trash2Icon />
              </Button>
              <Button type="button" size="till" className="gap-1.5" onClick={() => resume(held.id)}>
                <ArchiveIcon />
                Resume
              </Button>
            </div>
          ))}
        </div>
      )}

      <ResponsiveDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="Resume this sale?"
        description="Resuming will replace your current cart — hold it first if you don't want to lose it."
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button type="button" size="till" onClick={confirmResume}>
              Resume anyway
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
          </div>
        }
      />
    </div>
  )
}
