import { notFound } from "next/navigation"

import { getCustomerWithUnpaidItems } from "@/lib/dal/customers"
import { getProfile } from "@/lib/dal"
import { formatMoney } from "@/lib/money"
import { RecordPaymentButton } from "@/components/record-payment-button"

export default async function CustomerAccountPage({
  params,
}: PageProps<"/admin/customers/[id]">) {
  const { id } = await params
  const [result, profile] = await Promise.all([getCustomerWithUnpaidItems(id), getProfile()])
  if (!result) notFound()

  const { customer, sales } = result
  const currency = profile!.stores.currency

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{customer.name}</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-semibold">
            {formatMoney(customer.balance_cents ?? 0, currency)}
          </div>
          <div className="text-xs text-muted-foreground">Owed now</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-semibold">{customer.unpaid_sales ?? 0}</div>
          <div className="text-xs text-muted-foreground">Unpaid sales</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-semibold">
            {customer.oldest_unpaid
              ? new Date(customer.oldest_unpaid).toLocaleDateString()
              : "—"}
          </div>
          <div className="text-xs text-muted-foreground">Oldest unpaid</div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Unpaid items
        </div>
        {sales.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            No unpaid items.
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {sales.flatMap((sale) =>
              sale.sale_items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 text-sm">
                  <div className="w-20 shrink-0 text-xs text-muted-foreground">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </div>
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
              ))
            )}
          </div>
        )}
      </div>

      <RecordPaymentButton
        customerId={id}
        balanceCents={customer.balance_cents ?? 0}
        currency={currency}
      />
    </div>
  )
}
