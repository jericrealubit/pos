import Link from "next/link"
import { NotebookIcon, PackageIcon, ReceiptIcon, ScanLineIcon } from "lucide-react"

import { requireAdmin, hasPremium } from "@/lib/dal"
import { getSales, summarizeSales, getRecentSales } from "@/lib/dal/sales"
import { getCustomerBalances } from "@/lib/dal/customers"
import { getLowStockProducts } from "@/lib/dal/products"
import { getRangeBounds } from "@/lib/sales-date-range"
import { formatMoney } from "@/lib/money"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Paid", cls: "text-primary" },
  UNPAID: { label: "Unpaid", cls: "text-amber-600 dark:text-amber-400" },
  SETTLED: { label: "Settled", cls: "text-muted-foreground" },
}

function itemCount(items: { quantity: number }[] | null): number {
  return (items ?? []).reduce((sum, i) => sum + i.quantity, 0)
}

export default async function AdminDashboard() {
  const profile = await requireAdmin()
  const storeName = profile.stores.name as string
  const currency = profile.stores.currency as string
  const threshold = profile.stores.low_stock_threshold as number
  const premium = hasPremium(profile)

  const today = getRangeBounds("day")
  const [todaySales, recentSales, lowStock, balances] = await Promise.all([
    getSales(today),
    getRecentSales(6),
    getLowStockProducts(threshold),
    premium ? getCustomerBalances() : Promise.resolve([]),
  ])

  const summary = summarizeSales(todaySales)
  const debtors = balances
    .filter((b) => (b.balance_cents ?? 0) > 0)
    .sort((a, b) => (b.balance_cents ?? 0) - (a.balance_cents ?? 0))
  const owedCents = debtors.reduce((sum, b) => sum + (b.balance_cents ?? 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-sm text-muted-foreground">
            {storeName} · {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <Link href="/sell/scan" className={cn(buttonVariants(), "gap-1.5")}>
          <ScanLineIcon className="size-4" />
          New sale
        </Link>
      </div>

      {/* Today's numbers */}
      <div>
        <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Today
        </div>
        <div className="grid grid-cols-3 gap-3">
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* The book */}
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <NotebookIcon className="size-4 text-muted-foreground" />
              The book
            </h2>
            {premium && (
              <Link href="/admin/customers" className="text-xs text-muted-foreground hover:text-foreground">
                View all
              </Link>
            )}
          </div>

          {!premium ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                Track what customers owe with pay-later, and settle it later.
              </p>
              <Link
                href="/billing"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                Unlock the book
                <Badge variant="secondary">Premium</Badge>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">Outstanding</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {formatMoney(owedCents, currency)}
              </div>
              {debtors.length === 0 ? (
                <EmptyState
                  icon={NotebookIcon}
                  title="No outstanding balances"
                  className="mt-3 border-0 p-0"
                />
              ) : (
                <ul className="mt-3 flex flex-col gap-1">
                  {debtors.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <span className="min-w-0 truncate">{c.name}</span>
                        <span className="font-medium tabular-nums">
                          {formatMoney(c.balance_cents ?? 0, currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {/* Low stock */}
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <PackageIcon className="size-4 text-muted-foreground" />
              Low stock
            </h2>
            <Link href="/admin/products" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="text-xs text-muted-foreground">At or below {threshold} on hand</div>
          {lowStock.length === 0 ? (
            <EmptyState
              icon={PackageIcon}
              title="Everything's well stocked"
              className="mt-3 border-0 p-0"
            />
          ) : (
            <ul className="mt-3 flex flex-col gap-1">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className="min-w-0 truncate">
                      {p.name}
                      {p.size ? <span className="text-muted-foreground"> · {p.size}</span> : null}
                    </span>
                    {p.stock_quantity === 0 ? (
                      <span className="shrink-0 font-medium text-amber-600 dark:text-amber-400">
                        Out
                      </span>
                    ) : (
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {p.stock_quantity} left
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent sales */}
      <section className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <ReceiptIcon className="size-4 text-muted-foreground" />
            Recent sales
          </h2>
          <Link href="/admin/sales" className="text-xs text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <EmptyState icon={ReceiptIcon} title="No sales yet" className="border-0 p-0" />
        ) : (
          <ul className="flex flex-col divide-y">
            {recentSales.map((s) => {
              const status = STATUS_META[s.status] ?? STATUS_META.PAID
              const count = itemCount(s.sale_items)
              return (
                <li key={s.id}>
                  <Link
                    href={`/admin/sales/${s.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 shrink-0", status.cls)}>
                        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                        {status.label}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {count} item{count === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {new Date(s.created_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatMoney(s.total_cents, currency)}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
