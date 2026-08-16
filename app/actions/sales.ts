"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/dal"
import { createSaleSchema, type CreateSaleInput } from "@/lib/schemas/sale"
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
  await requireUser()
  const parsed = createSaleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, formError: "Cart is empty." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc("create_sale", {
      items: parsed.data.items.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
      })),
    })
    .single()

  if (error) {
    return { ok: false, formError: "Could not complete the sale. Try again." }
  }

  revalidatePath("/sell")
  return {
    ok: true,
    data: { saleId: data.sale_id, subtotalCents: data.subtotal_cents },
  }
}
