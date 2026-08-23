import { getProfile } from "@/lib/dal"
import { getSales } from "@/lib/dal/sales"
import { getRangeBounds, isSalesRange, type SalesRange } from "@/lib/sales-date-range"
import { formatMoney } from "@/lib/money"
import { SalesDataList, type SaleRow } from "@/components/sales-data-list"

export default async function SalesPage({ searchParams }: PageProps<"/admin/sales">) {
  const params = await searchParams
  const rawRange = typeof params.range === "string" ? params.range : undefined
  const range: SalesRange = isSalesRange(rawRange) ? rawRange : "all"

  const [sales, profile] = await Promise.all([getSales(getRangeBounds(range)), getProfile()])
  const currency = profile!.stores.currency as string

  const rows: SaleRow[] = sales.map((sale) => ({
    id: sale.id,
    status: sale.status,
    subtotal_cents: sale.subtotal_cents,
    created_at: sale.created_at,
    customerName: sale.customers?.name ?? "",
    cashierName: sale.profiles
      ? `${sale.profiles.first_name} ${sale.profiles.last_name}`.trim()
      : "",
    reference: sale.id.slice(0, 8).toUpperCase(),
    itemCount: sale.sale_items.reduce((sum, item) => sum + item.quantity, 0),
  }))

  const totalCents = rows.reduce((sum, row) => sum + row.subtotal_cents, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Sale Records</h1>
        <div className="ml-auto flex gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Sales</div>
            <div className="text-lg font-semibold tabular-nums">{rows.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Grand Total</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatMoney(totalCents, currency)}
            </div>
          </div>
        </div>
      </div>
      <SalesDataList sales={rows} currency={currency} range={range} />
    </div>
  )
}
