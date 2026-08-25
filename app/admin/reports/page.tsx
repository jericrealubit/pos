import Link from "next/link"

import { requirePremiumAdmin, getProfile } from "@/lib/dal"
import { getSales, summarizeSales } from "@/lib/dal/sales"
import {
  getRevenueByDay,
  getTopProducts,
  getSalesByHour,
  getSalesByDayOfWeek,
} from "@/lib/dal/reports"
import { getRangeBounds, isSalesRange, type SalesRange } from "@/lib/sales-date-range"
import { formatMoney } from "@/lib/money"
import { ReportsRangeSelect } from "@/components/reports-range-select"
import { RevenueChart } from "@/components/reports/revenue-chart"
import { TopProductsChart } from "@/components/reports/top-products-chart"
import { SalesPatternsChart } from "@/components/reports/sales-patterns-chart"
import { TenderBreakdown } from "@/components/reports/tender-breakdown"
import { BookAging } from "@/components/reports/book-aging"
import { InventoryVelocityList } from "@/components/reports/inventory-velocity-list"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requirePremiumAdmin()

  const params = await searchParams
  const rawRange = typeof params.range === "string" ? params.range : undefined
  const range: SalesRange = isSalesRange(rawRange) ? rawRange : "all"
  const bounds = getRangeBounds(range)

  const [sales, revenueByDay, topProducts, byHour, byDayOfWeek, profile] = await Promise.all([
    getSales(bounds),
    getRevenueByDay(bounds),
    getTopProducts(bounds),
    getSalesByHour(bounds),
    getSalesByDayOfWeek(bounds),
    getProfile(),
  ])
  const currency = profile!.stores.currency as string
  const summary = summarizeSales(sales)

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
          <div className="mt-2">
            <RevenueChart data={revenueByDay} currency={currency} />
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium">Top products</h2>
        {topProducts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <div className="mt-2">
            <TopProductsChart data={topProducts} currency={currency} />
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium">Sales patterns</h2>
        {sales.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <div className="mt-2">
            <SalesPatternsChart byHour={byHour} byDayOfWeek={byDayOfWeek} currency={currency} />
          </div>
        )}
      </div>

      <TenderBreakdown bounds={bounds} currency={currency} range={range} />

      <BookAging currency={currency} />

      <InventoryVelocityList bounds={bounds} currency={currency} range={range} />
    </div>
  )
}
