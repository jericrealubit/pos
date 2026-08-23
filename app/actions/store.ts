"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/dal"
import { storeSettingsSchema, type StoreSettingsValues } from "@/lib/schemas/store"
import type { ActionResult } from "@/lib/actions/types"

export async function storeUpdate(input: StoreSettingsValues): Promise<ActionResult> {
  const profile = await requireAdmin()
  const parsed = storeSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const update: {
    name: string
    address: string | null
    phone: string | null
    low_stock_threshold: number
    currency?: string
  } = {
    name: parsed.data.name,
    address: parsed.data.address || null,
    phone: parsed.data.phone || null,
    low_stock_threshold: Number(parsed.data.lowStockThreshold),
  }

  // Prices are stored as integer minor units with no currency attached,
  // so switching currency after trading would silently reprice every
  // sale already recorded. Allow it only while there is nothing to
  // reinterpret; after that it's a support request.
  if (parsed.data.currency && parsed.data.currency !== profile.stores.currency) {
    const { count, error: countError } = await supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("store_id", profile.store_id)

    if (countError) {
      return { ok: false, formError: "Could not save store settings. Try again." }
    }
    if (count && count > 0) {
      return {
        ok: false,
        fieldErrors: {
          currency: ["Currency can't change once you've recorded sales — contact support."],
        },
      }
    }
    update.currency = parsed.data.currency
  }

  const { error } = await supabase
    .from("stores")
    .update(update)
    .eq("id", profile.store_id)

  if (error) {
    return { ok: false, formError: "Could not save store settings. Try again." }
  }

  revalidatePath("/admin/settings")
  return { ok: true, data: undefined }
}
