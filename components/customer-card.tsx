"use client"

import { formatMoney } from "@/lib/money"
import type { CustomerBalance } from "@/app/actions/customers"

export function CustomerCard({
  customer,
  currency,
  onClick,
}: {
  customer: CustomerBalance
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
        <div className="truncate text-sm font-medium">{customer.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {[customer.phone, `${customer.unpaid_sales} unpaid`].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div className="shrink-0 text-sm font-medium">
        {formatMoney(customer.balance_cents, currency)}
      </div>
    </button>
  )
}
