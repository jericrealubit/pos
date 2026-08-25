import Link from "next/link"
import { CreditCardIcon, SmartphoneIcon, WalletIcon } from "lucide-react"

import { getSalesByTender } from "@/lib/dal/reports"
import { formatMoney } from "@/lib/money"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SalesRange } from "@/lib/sales-date-range"

const TENDER_META = {
  CASH: { label: "Cash", icon: WalletIcon },
  CARD: { label: "Card", icon: CreditCardIcon },
  EWALLET: { label: "E-wallet", icon: SmartphoneIcon },
} as const

export async function TenderBreakdown({
  bounds,
  currency,
  range,
}: {
  bounds: { from: string | null; to: string | null }
  currency: string
  range: SalesRange
}) {
  const rows = await getSalesByTender(bounds)
  const byType = new Map(rows.map((r) => [r.tender_type, r]))

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Tender breakdown</h2>
        <Link
          href={`/admin/reports/export/tender?range=${range}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Export CSV
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Paid sales only — how much should be in the drawer, by tender.
      </p>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(Object.keys(TENDER_META) as (keyof typeof TENDER_META)[]).map((type) => {
          const meta = TENDER_META[type]
          const Icon = meta.icon
          const row = byType.get(type)
          return (
            <div key={type} className="flex items-center gap-3 rounded-lg border p-4">
              <Icon className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{meta.label}</div>
                <div className="text-lg font-semibold tabular-nums">
                  {formatMoney(row?.total_cents ?? 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {row?.sale_count ?? 0} {row?.sale_count === 1 ? "sale" : "sales"}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
