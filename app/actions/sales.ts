"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireUser, requireStore, hasPremium } from "@/lib/dal"
import { createSaleSchema, type CreateSaleInput } from "@/lib/schemas/sale"
import { dollarsToCents } from "@/lib/money"
import type { ActionResult } from "@/lib/actions/types"

export async function lookupByBarcode(
  barcode: string
): Promise<
  ActionResult<{
    id: string
    name: string
    size: string | null
    price_cents: number
    barcode: string
  } | null>
> {
  await requireUser()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name, size, price_cents, barcode")
    .eq("barcode", barcode)
    .eq("is_archived", false)
    .maybeSingle()

  if (error) {
    return { ok: false, formError: "Could not look up that barcode. Try again." }
  }

  return { ok: true, data }
}

export async function createSale(
  input: CreateSaleInput
): Promise<ActionResult<{ saleId: string; subtotalCents: number }>> {
  const profile = await requireStore()
  const parsed = createSaleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, formError: "Cart is empty." }
  }
  // Cash sales are free forever; only the pay-later book is premium. This is
  // the authoritative gate — the RPC/RLS are deliberately left alone, because
  // this is a monetization gate, not a security boundary: a store owner who
  // hits the raw Data API to self-serve an UNPAID sale only cheats themselves
  // out of paying, on their own single-tenant data.
  if (parsed.data.status === "UNPAID") {
    if (!hasPremium(profile)) {
      return {
        ok: false,
        code: "UPGRADE",
        formError: "The pay-later book is a Premium feature.",
      }
    }
    if (!parsed.data.customerId) {
      return { ok: false, formError: "Choose a customer for pay-later sales." }
    }
  }

  const discountCents = parsed.data.discount ? dollarsToCents(parsed.data.discount) : 0
  // Tender/change is a PAID-only concept; an UNPAID (pay-later) sale hasn't
  // been paid at all, so tendered is dropped regardless of what was sent.
  const tenderedCents =
    parsed.data.status === "PAID" && parsed.data.tenderType === "CASH" && parsed.data.tendered
      ? dollarsToCents(parsed.data.tendered)
      : null

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc("create_sale", {
      items: parsed.data.items.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
      })),
      p_status: parsed.data.status,
      p_discount_cents: discountCents,
      p_tender_type: parsed.data.tenderType,
      ...(tenderedCents !== null ? { p_tendered_cents: tenderedCents } : {}),
      ...(parsed.data.customerId ? { p_customer_id: parsed.data.customerId } : {}),
    })
    .single()

  if (error) {
    // These two are user-correctable input mistakes the RPC raises in
    // plain English (unlike other DB errors) — surface them verbatim
    // rather than the generic fallback, which would wrongly suggest
    // retrying helps.
    if (
      error.message.includes("Discount cannot exceed") ||
      error.message.includes("Amount tendered is less than")
    ) {
      return { ok: false, formError: error.message }
    }
    return { ok: false, formError: "Could not complete the sale. Try again." }
  }

  revalidatePath("/sell")
  if (parsed.data.status === "UNPAID") {
    revalidatePath("/admin/customers")
  }
  return {
    ok: true,
    data: { saleId: data.sale_id, subtotalCents: data.subtotal_cents },
  }
}
