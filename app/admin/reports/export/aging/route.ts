import { NextResponse } from "next/server"

import { requirePremiumAdmin } from "@/lib/dal"
import { getUnpaidSalesAging } from "@/lib/dal/reports"
import { toCsv } from "@/lib/csv"

export async function GET() {
  await requirePremiumAdmin()

  const { oldest } = await getUnpaidSalesAging()
  const csv = toCsv(
    ["Sale ID", "Customer", "Total cents", "Created at", "Days outstanding", "Bucket"],
    oldest.map((s) => [s.id, s.customerName, s.totalCents, s.createdAt, s.daysOutstanding, s.bucket])
  )

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="book-aging.csv"`,
    },
  })
}
