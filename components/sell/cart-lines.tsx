"use client"

import { ViewTransition } from "react"
import { MinusIcon, PlusIcon, ScanBarcodeIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import type { CartLine } from "@/lib/pos/cart-reducer"

export function CartLines({
  lines,
  currency,
  editable,
  subtitle,
  justAddedProductId,
  onQuantityChange,
  onRemove,
}: {
  lines: CartLine[]
  currency: string
  editable: boolean
  /** "barcode" helps confirm what was just scanned mid-scan; the summary
   *  screen wants price/qty visible instead. Defaults preserve each
   *  screen's existing behavior. */
  subtitle?: "priceAndQty" | "barcode"
  justAddedProductId?: string | null
  onQuantityChange?: (productId: string, quantity: number) => void
  /** One-tap full removal, distinct from stepping the quantity to 0.
   *  Only wired on the cart summary screen — omitted mid-scan so a stray
   *  tap can't wipe a line while the cashier is still scanning. */
  onRemove?: (productId: string) => void
}) {
  const showBarcode = subtitle ? subtitle === "barcode" : editable
  if (lines.length === 0) {
    return <EmptyState icon={ScanBarcodeIcon} title="Nothing scanned yet" />
  }

  return (
    <div className="divide-y rounded-lg border">
      {lines.map((line) => (
        <ViewTransition
          key={line.productId}
          name={`cart-line-${line.productId}`}
          enter="cart-line-enter"
          exit="cart-line-exit"
        >
          <div
            className={cn(
              "flex items-center gap-3 p-3 transition-colors",
              justAddedProductId === line.productId && "bg-primary/10"
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {line.name}
                {line.size ? ` · ${line.size}` : ""}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {showBarcode
                  ? line.barcode
                  : `${line.quantity} × ${formatMoney(line.priceCents, currency)}`}
              </div>
            </div>

            {editable && onQuantityChange && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon-till"
                  variant="outline"
                  aria-label={line.quantity === 1 ? "Remove item" : "Decrease quantity"}
                  onClick={() => onQuantityChange(line.productId, line.quantity - 1)}
                >
                  <MinusIcon />
                </Button>
                <span className="w-5 text-center text-sm tabular-nums">{line.quantity}</span>
                <Button
                  type="button"
                  size="icon-till"
                  variant="outline"
                  aria-label="Increase quantity"
                  onClick={() => onQuantityChange(line.productId, line.quantity + 1)}
                >
                  <PlusIcon />
                </Button>
              </div>
            )}

            <div className="text-right text-sm font-medium tabular-nums">
              {formatMoney(line.priceCents * line.quantity, currency)}
            </div>

            {onRemove && (
              <Button
                type="button"
                size="icon-till"
                variant="ghost"
                aria-label={`Remove ${line.name}`}
                className="text-muted-foreground"
                onClick={() => onRemove(line.productId)}
              >
                <XIcon />
              </Button>
            )}
          </div>
        </ViewTransition>
      ))}
    </div>
  )
}
