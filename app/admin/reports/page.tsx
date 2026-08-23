import Link from "next/link"

import { requirePremiumAdmin, getProfile } from "@/lib/dal"
import { getSales, summarizeSales } from "@/lib/dal/sales"
import { getRevenueByDay, getTopProducts } from "@/lib/dal/reports"
import { getRangeBounds, isSalesRange, type SalesRange } from "@/lib/sales-date-range"
import { formatMoney } from "@/lib/money"
import { ReportsRangeSelect } from "@/components/reports-range-select"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requirePremiumAdmin()

  const params = await searchParams
  const rawRange = typeof params.range === "string" ? params.range : undefined
  const range: SalesRange = isSalesRange(rawRange) ? rawRange : "all"
  const bounds = getRangeBounds(range)

  const [sales, revenueByDay, topProducts, profile] = await Promise.all([
    getSales(bounds),
    getRevenueByDay(bounds),
    getTopProducts(bounds),
    getProfile(),
  ])
  const currency = profile!.stores.currency as string
  const summary = summarizeSales(sales)

  const maxDayCents = Math.max(1, ...revenueByDay.map((d) => d.total_cents))
  const maxProductCents = Math.max(1, ...topProducts.map((p) => p.revenue_cents))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Reports</h1>
        <ReportsRangeSelect range={range} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Revenue</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">
            {formatMoney(summary.totalCents, currency)}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Sales</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{summary.saleCount}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Average sale</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">
            {formatMoney(summary.avgCents, currency)}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Unpaid</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">
            {formatMoney(summary.unpaidCents, currency)}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Revenue by day</h2>
          <Link
            href={`/admin/reports/export?range=${range}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export CSV
          </Link>
        </div>
        {revenueByDay.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-1">
            {revenueByDay.map((day) => (
              <div
                key={day.day}
                className="relative overflow-hidden rounded-md border px-3 py-2 text-sm"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary/10"
                  style={{ width: `${(day.total_cents / maxDayCents) * 100}%` }}
                />
                <div className="relative flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground">
                    {new Date(day.day).toLocaleDateString()}
                  </span>
                  <span className="flex items-baseline gap-3">
                    <span className="text-xs text-muted-foreground">
                      {day.sale_count} {day.sale_count === 1 ? "sale" : "sales"}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatMoney(day.total_cents, currency)}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium">Top products</h2>
        {topProducts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-1">
            {topProducts.map((product) => (
              <div
                key={product.product_id ?? product.name}
                className="relative overflow-hidden rounded-md border px-3 py-2 text-sm"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary/10"
                  style={{ width: `${(product.revenue_cents / maxProductCents) * 100}%` }}
                />
                <div className="relative flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">{product.name}</span>
                  <span className="flex items-baseline gap-3">
                    <span className="text-xs text-muted-foreground">{product.quantity} sold</span>
                    <span className="font-medium tabular-nums">
                      {formatMoney(product.revenue_cents, currency)}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
