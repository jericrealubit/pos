import { NextResponse, type NextRequest } from "next/server"

import { requirePremiumAdmin } from "@/lib/dal"
import { getProductVelocity } from "@/lib/dal/reports"
import { getRangeBounds, isSalesRange, type SalesRange } from "@/lib/sales-date-range"
import { toCsv } from "@/lib/csv"

export async function GET(request: NextRequest) {
  await requirePremiumAdmin()

  const rawRange = request.nextUrl.searchParams.get("range") ?? undefined
  const range: SalesRange = isSalesRange(rawRange) ? rawRange : "all"

  const rows = await getProductVelocity(getRangeBounds(range))
  const csv = toCsv(
    ["Product", "Quantity sold", "Revenue cents", "Stock on hand"],
    rows.map((r) => [r.name, r.quantity_sold, r.revenue_cents, r.stock_quantity])
  )

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory-velocity-${range}.csv"`,
    },
  })
}
