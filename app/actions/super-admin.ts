"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireSuperAdmin } from "@/lib/dal"
import type { ActionResult } from "@/lib/actions/types"

export async function storeSetPaused(storeId: string, paused: boolean): Promise<ActionResult> {
  await requireSuperAdmin()

  const supabase = await createClient()
  const { error } = await supabase.rpc("super_admin_set_store_paused", {
    p_store_id: storeId,
    p_paused: paused,
  })
  if (error) {
    return { ok: false, formError: "Could not update the store. Try again." }
  }

  revalidatePath("/super-admin")
  return { ok: true, data: undefined }
}

/**
 * Marks a manual payment: extends the store's access and records what
 * was received. Under manual collection the note is the only record
 * that a payment happened at all, so it is worth filling in.
 *
 * The interval is applied to whichever is later, now() or the existing
 * paid_until, so paying early never costs a store days it already had.
 */
export async function storeExtendBilling(
  storeId: string,
  interval: "1 month" | "1 year",
  note?: string
): Promise<ActionResult<{ paidUntil: string }>> {
  await requireSuperAdmin()

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("super_admin_extend_store", {
    p_store_id: storeId,
    p_extend_interval: interval,
    p_note: note ?? null,
  })
  if (error) {
    return { ok: false, formError: "Could not extend the store. Try again." }
  }

  revalidatePath("/super-admin")
  return { ok: true, data: { paidUntil: data } }
}
