import Link from "next/link"
import { notFound } from "next/navigation"

import { getProfile } from "@/lib/dal"
import { getSaleWithItems } from "@/lib/dal/sales"
import { formatMoney } from "@/lib/money"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function SaleDonePage({
  params,
}: PageProps<"/sell/done/[saleId]">) {
  const { saleId } = await params
  const [profile, sale] = await Promise.all([getProfile(), getSaleWithItems(saleId)])

  if (!sale) notFound()

  const currency = profile?.stores.currency as string
  const itemCount = sale.sale_items.reduce((sum, item) => sum + item.quantity, 0)
  const time = new Date(sale.created_at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-lg font-semibold">Sale complete</h1>
        <p className="text-sm text-muted-foreground">
          {itemCount} item{itemCount === 1 ? "" : "s"} · {formatMoney(sale.subtotal_cents, currency)} · {time}
        </p>
      </div>

      <div className="divide-y rounded-lg border">
        {sale.sale_items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1 truncate">
              {item.name_snapshot}
              {item.size_snapshot ? ` · ${item.size_snapshot}` : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              {item.quantity} × {formatMoney(item.unit_price_cents, currency)}
            </div>
            <div className="font-medium tabular-nums">
              {formatMoney(item.unit_price_cents * item.quantity, currency)}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between p-3 text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(sale.subtotal_cents, currency)}</span>
        </div>
      </div>

      <Button type="button" variant="ghost" size="till" disabled title="Coming soon">
        Print receipt
      </Button>
      <Button type="button" variant="ghost" size="till" disabled title="Coming soon">
        Text receipt
      </Button>

      <Link href="/sell" className={cn(buttonVariants({ size: "till" }), "mt-2")}>
        Start next sale
      </Link>
    </div>
  )
}
