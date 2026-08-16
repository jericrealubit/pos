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
