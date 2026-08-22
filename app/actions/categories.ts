"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireActiveAdmin } from "@/lib/dal"
import { categoryFormSchema, type CategoryFormValues } from "@/lib/schemas/product"
import type { ActionResult } from "@/lib/actions/types"

export async function categoryCreate(
  input: CategoryFormValues
): Promise<ActionResult<{ id: string; name: string }>> {
  const profile = await requireActiveAdmin()
  const parsed = categoryFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: parsed.data.name, store_id: profile.store_id })
    .select("id, name")
    .single()

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        fieldErrors: { name: ["A category with this name already exists."] },
      }
    }
    return { ok: false, formError: "Could not create the category." }
  }

  revalidatePath("/admin/products")
  revalidatePath("/admin/products/new")
  return { ok: true, data }
}
