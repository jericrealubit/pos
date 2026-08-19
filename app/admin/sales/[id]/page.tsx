import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeftIcon, PrinterIcon } from "lucide-react"

import { getProfile } from "@/lib/dal"
import { getSaleWithItems } from "@/lib/dal/sales"
import { buildReceiptData } from "@/lib/receipt"
import { formatMoney } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STATUS_VARIANT = {
  PAID: "default",
  UNPAID: "destructive",
  SETTLED: "secondary",
} as const

export default async function SaleRecordPage({ params }: PageProps<"/admin/sales/[id]">) {
  const { id } = await params
  const [profile, sale] = await Promise.all([getProfile(), getSaleWithItems(id)])

  if (!sale || !profile) notFound()

  const receipt = buildReceiptData(sale, profile)
  const currency = receipt.store.currency

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/sales"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        Sale Records
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Receipt {receipt.reference}</h1>
        <Badge variant={STATUS_VARIANT[receipt.status]}>{receipt.status}</Badge>
        <span className="text-sm text-muted-foreground">
          {new Date(receipt.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>Customer: {receipt.customerName ?? "Walk-in"}</span>
        <span>Cashier: {receipt.cashierName ?? "—"}</span>
      </div>

      <div className="divide-y rounded-lg border">
        {receipt.items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1 truncate">
              {item.name}
              {item.size ? ` · ${item.size}` : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              {item.quantity} × {formatMoney(item.unitPriceCents, currency)}
            </div>
            <div className="font-medium tabular-nums">
              {formatMoney(item.unitPriceCents * item.quantity, currency)}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between p-3 text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(receipt.subtotalCents, currency)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:max-w-sm">
        <Link
          href={`/sell/done/${sale.id}/receipt`}
          target="_blank"
          className={cn(buttonVariants({ size: "till" }), "gap-1.5")}
        >
          <PrinterIcon />
          Print / Save as PDF
        </Link>
      </div>
    </div>
  )
}
