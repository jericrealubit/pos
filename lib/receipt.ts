import "server-only"

import type { getSaleWithItems } from "@/lib/dal/sales"
import type { getProfile } from "@/lib/dal"

type SaleWithItems = NonNullable<Awaited<ReturnType<typeof getSaleWithItems>>>
type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>

export type ReceiptData = {
  store: { name: string; address: string | null; phone: string | null; currency: string }
  reference: string
  createdAt: string
  status: SaleWithItems["status"]
  cashierName: string | null
  customerName: string | null
  items: { name: string; size: string | null; quantity: number; unitPriceCents: number }[]
  subtotalCents: number
}

export function buildReceiptData(sale: SaleWithItems, profile: Profile): ReceiptData {
  const cashier = sale.profiles
  return {
    store: {
      name: profile.stores.name,
      address: profile.stores.address ?? null,
      phone: profile.stores.phone ?? null,
      currency: profile.stores.currency,
    },
    reference: sale.id.slice(0, 8).toUpperCase(),
    createdAt: sale.created_at,
    status: sale.status,
    cashierName: cashier ? `${cashier.first_name} ${cashier.last_name}`.trim() : null,
    customerName: sale.customers?.name ?? null,
    items: sale.sale_items.map((item) => ({
      name: item.name_snapshot,
      size: item.size_snapshot,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
    })),
    subtotalCents: sale.subtotal_cents,
  }
}
