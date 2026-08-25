import { notFound } from "next/navigation"

import { getProfile } from "@/lib/dal"
import { getSaleWithItems } from "@/lib/dal/sales"
import { buildReceiptData, TENDER_LABEL } from "@/lib/receipt"
import { formatMoney } from "@/lib/money"
import { ReceiptAutoPrint } from "@/components/receipt-auto-print"

export default async function SaleReceiptPage({
  params,
}: PageProps<"/sell/done/[saleId]/receipt">) {
  const { saleId } = await params
  const [profile, sale] = await Promise.all([getProfile(), getSaleWithItems(saleId)])

  if (!sale || !profile) notFound()

  const receipt = buildReceiptData(sale, profile)
  const currency = receipt.store.currency

  return (
    <ReceiptAutoPrint>
      <div className="mx-auto max-w-sm bg-white p-6 text-black print:p-0">
        <div className="text-center">
          <div className="text-lg font-semibold">{receipt.store.name}</div>
          {receipt.store.address && (
            <div className="text-xs text-neutral-600">{receipt.store.address}</div>
          )}
          {receipt.store.phone && (
            <div className="text-xs text-neutral-600">{receipt.store.phone}</div>
          )}
        </div>

        <div className="mt-4 flex justify-between text-xs text-neutral-600">
          <span>Receipt {receipt.reference}</span>
          <span>{new Date(receipt.createdAt).toLocaleString()}</span>
        </div>
        {(receipt.customerName || receipt.cashierName) && (
          <div className="mt-1 flex justify-between text-xs text-neutral-600">
            <span>{receipt.customerName ? `Customer: ${receipt.customerName}` : ""}</span>
            <span>{receipt.cashierName ? `Cashier: ${receipt.cashierName}` : ""}</span>
          </div>
        )}

        <div className="mt-4 divide-y divide-dashed divide-neutral-300 border-y border-dashed border-neutral-300">
          {receipt.items.map((item, index) => (
            <div key={index} className="flex items-center gap-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                {item.name}
                {item.size ? ` · ${item.size}` : ""}
                <div className="text-xs text-neutral-600">
                  {item.quantity} × {formatMoney(item.unitPriceCents, currency)}
                </div>
              </div>
              <div className="font-medium tabular-nums">
                {formatMoney(item.unitPriceCents * item.quantity, currency)}
              </div>
            </div>
          ))}
        </div>

        {receipt.discountCents > 0 && (
          <div className="mt-3 flex justify-between text-sm text-neutral-600">
            <span>Subtotal</span>
            <span>{formatMoney(receipt.subtotalCents, currency)}</span>
          </div>
        )}
        {receipt.discountCents > 0 && (
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Discount</span>
            <span>− {formatMoney(receipt.discountCents, currency)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(receipt.totalCents, currency)}</span>
        </div>

        {receipt.status === "PAID" && (
          <div className="mt-1 flex justify-between text-xs text-neutral-600">
            <span>Paid by {TENDER_LABEL[receipt.tenderType]}</span>
            {receipt.tenderedCents !== null && (
              <span>
                Tendered {formatMoney(receipt.tenderedCents, currency)} · Change{" "}
                {formatMoney(receipt.tenderedCents - receipt.totalCents, currency)}
              </span>
            )}
          </div>
        )}

        {receipt.status === "UNPAID" && (
          <div className="mt-2 text-center text-xs text-neutral-600">
            Added to account — not paid yet.
          </div>
        )}

        <div className="mt-6 text-center text-xs text-neutral-600">
          Thanks for your business!
        </div>
      </div>
    </ReceiptAutoPrint>
  )
}
