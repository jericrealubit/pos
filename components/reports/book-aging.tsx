import Link from "next/link"
import { NotebookIcon } from "lucide-react"

import { getUnpaidSalesAging, type AgingBucket } from "@/lib/dal/reports"
import { formatMoney } from "@/lib/money"
import { EmptyState } from "@/components/empty-state"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const BUCKET_LABEL: Record<AgingBucket, string> = {
  "0-7": "0–7 days",
  "8-30": "8–30 days",
  "31-60": "31–60 days",
  "60+": "60+ days",
}

// Redder toward older debt — reuses the theme's chart palette rather than
// hardcoding new colors.
const BUCKET_FILL: Record<AgingBucket, string> = {
  "0-7": "var(--chart-4)",
  "8-30": "var(--chart-3)",
  "31-60": "var(--chart-1)",
  "60+": "var(--destructive)",
}

export async function BookAging({ currency }: { currency: string }) {
  const { buckets, oldest, totalCents, count } = await getUnpaidSalesAging()

  if (count === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium">Book aging</h2>
        <div className="mt-2">
          <EmptyState icon={NotebookIcon} title="Nothing outstanding" description="The book is clear." />
        </div>
      </div>
    )
  }

  const bucketKeys = Object.keys(BUCKET_LABEL) as AgingBucket[]

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">Book aging</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {formatMoney(totalCents, currency)} across {count} unpaid sale{count === 1 ? "" : "s"}
          </span>
          <Link
            href="/admin/reports/export/aging"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export CSV
          </Link>
        </div>
      </div>

      <div className="mt-2 flex h-3 overflow-hidden rounded-full border">
        {bucketKeys.map((key) =>
          buckets[key] > 0 ? (
            <div
              key={key}
              style={{ width: `${(buckets[key] / totalCents) * 100}%`, backgroundColor: BUCKET_FILL[key] }}
              title={`${BUCKET_LABEL[key]}: ${formatMoney(buckets[key], currency)}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {bucketKeys.map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: BUCKET_FILL[key] }}
              aria-hidden="true"
            />
            {BUCKET_LABEL[key]} · {formatMoney(buckets[key], currency)}
          </span>
        ))}
      </div>

      <div className="mt-3 divide-y rounded-lg border">
        {oldest.map((sale) => (
          <Link
            key={sale.id}
            href={sale.customerId ? `/admin/customers/${sale.customerId}` : "/admin/customers"}
            className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-muted"
          >
            <span className="min-w-0 truncate">{sale.customerName}</span>
            <span className="flex items-baseline gap-3">
              <span className="text-xs text-muted-foreground">
                {sale.daysOutstanding} day{sale.daysOutstanding === 1 ? "" : "s"}
              </span>
              <span className="font-medium tabular-nums">{formatMoney(sale.totalCents, currency)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
