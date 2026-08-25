import { z } from "zod"

import { moneyDollars } from "@/lib/schemas/product"

export const saleLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(9999),
})

export const createSaleSchema = z.object({
  items: z.array(saleLineSchema).min(1, "Cart is empty"),
  customerId: z.string().uuid().optional(),
  status: z.enum(["PAID", "UNPAID"]).default("PAID"),
  // Sale-level discount only — no per-line discounts. Always a resolved
  // dollar amount: a %-off entry is converted to dollars client-side
  // (against the cart's own known total) before this is sent, since the
  // authoritative subtotal only exists inside the create_sale RPC — the
  // RPC re-validates the resulting cents can't exceed it either way.
  discount: moneyDollars.optional().or(z.literal("")),
  // Tender only applies to PAID sales; tendered is cash-only and optional
  // even then (a convenience readout, not a requirement).
  tenderType: z.enum(["CASH", "CARD", "EWALLET"]).default("CASH"),
  tendered: moneyDollars.optional().or(z.literal("")),
})
export type CreateSaleInput = z.input<typeof createSaleSchema>
