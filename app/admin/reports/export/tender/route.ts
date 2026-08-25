import { NextResponse, type NextRequest } from "next/server"

import { requirePremiumAdmin } from "@/lib/dal"
import { getSalesByTender } from "@/lib/dal/reports"
import { getRangeBounds, isSalesRange, type SalesRange } from "@/lib/sales-date-range"
import { toCsv } from "@/lib/csv"

export async function GET(request: NextRequest) {
  await requirePremiumAdmin()

  const rawRange = request.nextUrl.searchParams.get("range") ?? undefined
  const range: SalesRange = isSalesRange(rawRange) ? rawRange : "all"

  const rows = await getSalesByTender(getRangeBounds(range))
  const csv = toCsv(
    ["Tender", "Sales", "Total cents"],
    rows.map((r) => [r.tender_type, r.sale_count, r.total_cents])
  )

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tender-${range}.csv"`,
    },
  })
}
