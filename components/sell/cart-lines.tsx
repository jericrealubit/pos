"use client"

import { MinusIcon, PlusIcon, ScanBarcodeIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import type { CartLine } from "@/lib/pos/cart-reducer"

export function CartLines({
  lines,
  currency,
  editable,
  justAddedProductId,
  onQuantityChange,
}: {
  lines: CartLine[]
  currency: string
  editable: boolean
  justAddedProductId?: string | null
  onQuantityChange?: (productId: string, quantity: number) => void
}) {
  if (lines.length === 0) {
    return <EmptyState icon={ScanBarcodeIcon} title="Nothing scanned yet" />
  }

  return (
    <div className="divide-y rounded-lg border">
      {lines.map((line) => (
        <div
          key={line.productId}
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
              {editable
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
        </div>
      ))}
    </div>
  )
}
