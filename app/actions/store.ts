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
  const { error } = await supabase
    .from("stores")
    .update({
      name: parsed.data.name,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      low_stock_threshold: Number(parsed.data.lowStockThreshold),
    })
    .eq("id", profile.store_id)

  if (error) {
    return { ok: false, formError: "Could not save store settings. Try again." }
  }

  revalidatePath("/admin/settings")
  return { ok: true, data: undefined }
}
