import Link from "next/link"

import { getProfile } from "@/lib/dal"
import { getRecentSales } from "@/lib/dal/sales"
import { formatMoney } from "@/lib/money"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function SellPage() {
  const [profile, recentSales] = await Promise.all([getProfile(), getRecentSales()])
  const currency = profile?.stores.currency as string
  const storeName = profile?.stores.name as string
  const canManageProducts = profile?.role === "OWNER" || profile?.role === "ADMIN"

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3 border-b pb-3">
        <div className="text-base font-semibold">{storeName}</div>
        {canManageProducts && (
          <Link
            href="/admin/products"
            className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          >
            Admin
          </Link>
        )}
      </div>

      <div>
        <h1 className="text-lg font-semibold">Nothing scanned yet</h1>
        <p className="text-sm text-muted-foreground">Scan the first item to open a sale.</p>
      </div>

      <Link href="/sell/scan" className={cn(buttonVariants({ size: "till" }), "w-full")}>
        Start barcode reader
      </Link>
      <Link
        href="/sell/scan"
        className={cn(buttonVariants({ size: "till", variant: "ghost" }), "w-full")}
      >
        Enter barcode by hand
      </Link>

      <p className="border-l-2 pl-3 text-xs text-muted-foreground">
        A plugged-in USB or Bluetooth scanner types into the app like a keyboard — it works on
        this screen too, without pressing anything first.
      </p>

      {recentSales.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Earlier today
          </div>
          <div className="divide-y rounded-lg border">
            {recentSales.map((sale) => {
              const itemCount = sale.sale_items.reduce((sum, i) => sum + i.quantity, 0)
              const time = new Date(sale.created_at).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })
              return (
                <Link
                  key={sale.id}
                  href={`/sell/done/${sale.id}`}
                  className="flex items-center gap-3 p-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {time} · {sale.status === "PAID" ? "Paid" : sale.status}
                    </div>
                  </div>
                  <div className="font-medium tabular-nums">
                    {formatMoney(sale.subtotal_cents, currency)}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
