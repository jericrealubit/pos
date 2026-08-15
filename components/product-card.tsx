"use client"

import { formatMoney } from "@/lib/money"

type ProductRow = {
  id: string
  name: string
  size: string | null
  price_cents: number
  barcode: string
  categories: { id: string; name: string } | null
}

export function ProductCard({
  product,
  currency,
  onClick,
}: {
  product: ProductRow
  currency: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{product.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {[product.categories?.name, product.size].filter(Boolean).join(" · ") || product.barcode}
        </div>
      </div>
      <div className="shrink-0 text-sm font-medium">
        {formatMoney(product.price_cents, currency)}
      </div>
    </button>
  )
}
