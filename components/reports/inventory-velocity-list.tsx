import Link from "next/link"

import { getProductVelocity } from "@/lib/dal/reports"
import { InventoryVelocityTable } from "@/components/reports/inventory-velocity-table"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SalesRange } from "@/lib/sales-date-range"

export async function InventoryVelocityList({
  bounds,
  currency,
  range,
}: {
  bounds: { from: string | null; to: string | null }
  currency: string
  range: SalesRange
}) {
  const data = await getProductVelocity(bounds)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Dead stock &amp; inventory velocity</h2>
        <Link
          href={`/admin/reports/export/velocity?range=${range}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Export CSV
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Sorted by units sold, lowest first — a 0 with stock on hand is dead stock.
      </p>
      <div className="mt-2">
        <InventoryVelocityTable data={data} currency={currency} />
      </div>
    </div>
  )
}
