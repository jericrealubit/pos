import { NextResponse, type NextRequest } from "next/server"

import { requirePremiumAdmin, getProfile } from "@/lib/dal"
import { getSales } from "@/lib/dal/sales"
import { getRangeBounds, isSalesRange, type SalesRange } from "@/lib/sales-date-range"
import { formatMoney } from "@/lib/money"
import { toCsv } from "@/lib/csv"

// A plain GET behind a plain <a href>, not a fetch-then-blob — so if the
// session has lapsed and requirePremiumAdmin redirects, the browser just
// navigates to /billing normally instead of the redirect being silently
// swallowed by JS.
export async function GET(request: NextRequest) {
  await requirePremiumAdmin()

  const rawRange = request.nextUrl.searchParams.get("range") ?? undefined
  const range: SalesRange = isSalesRange(rawRange) ? rawRange : "all"

  const [sales, profile] = await Promise.all([getSales(getRangeBounds(range)), getProfile()])
  const currency = profile!.stores.currency as string

  const rows = sales.map((sale) => [
    sale.id,
    new Date(sale.created_at).toISOString(),
    sale.status,
    sale.customers?.name ?? "",
    sale.profiles ? `${sale.profiles.first_name} ${sale.profiles.last_name}`.trim() : "",
    sale.sale_items.reduce((sum, item) => sum + item.quantity, 0),
    formatMoney(sale.subtotal_cents, currency),
  ])

  const csv = toCsv(["Sale ID", "Date", "Status", "Customer", "Cashier", "Items", "Total"], rows)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales-${range}.csv"`,
    },
  })
}
