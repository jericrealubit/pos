import { NextResponse } from "next/server"

import { requireStore, getProfile } from "@/lib/dal"
import { getSaleWithItems } from "@/lib/dal/sales"
import { buildReceiptData } from "@/lib/receipt"
import { buildReceiptPdf } from "@/lib/receipt-pdf"

// A plain GET behind a plain <a href> (see app/sell/done/[saleId]/page.tsx),
// same shape as the CSV export route — downloading your own just-completed
// receipt as a PDF is till-level, not premium; only *emailing* it is gated
// (see app/actions/receipts.ts).
export async function GET(_request: Request, context: RouteContext<"/sell/done/[saleId]/receipt.pdf">) {
  await requireStore()
  const { saleId } = await context.params

  const [profile, sale] = await Promise.all([getProfile(), getSaleWithItems(saleId)])
  if (!sale || !profile) {
    return new NextResponse("Not found", { status: 404 })
  }

  const receipt = buildReceiptData(sale, profile)
  const bytes = await buildReceiptPdf(receipt)

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${receipt.reference}.pdf"`,
    },
  })
}
