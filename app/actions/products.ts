"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireActiveAdmin } from "@/lib/dal"
import { productFormSchema, type ProductFormValues } from "@/lib/schemas/product"
import { dollarsToCents } from "@/lib/money"
import type { ActionResult } from "@/lib/actions/types"

function toRow(values: ProductFormValues) {
  return {
    name: values.name,
    description: values.description || null,
    size: values.size || null,
    price_cents: dollarsToCents(values.price),
    barcode: values.barcode,
    category_id: values.categoryId || null,
    stock_quantity: Number(values.stockQuantity),
  }
}

export async function productCreate(
  input: ProductFormValues
): Promise<ActionResult<{ id: string }>> {
  const profile = await requireActiveAdmin()
  const parsed = productFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .insert({ ...toRow(parsed.data), store_id: profile.store_id })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        fieldErrors: {
          barcode: ["This barcode is already used by another product."],
        },
      }
    }
    return { ok: false, formError: "Could not save the product. Try again." }
  }

  revalidatePath("/admin/products")
  return { ok: true, data: { id: data.id } }
}

export async function productUpdate(
  id: string,
  input: ProductFormValues
): Promise<ActionResult> {
  await requireActiveAdmin()
  const parsed = productFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        fieldErrors: {
          barcode: ["This barcode is already used by another product."],
        },
      }
    }
    return { ok: false, formError: "Could not save the product. Try again." }
  }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${id}`)
  return { ok: true, data: undefined }
}

export async function productArchive(id: string): Promise<ActionResult> {
  await requireActiveAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ is_archived: true })
    .eq("id", id)

  if (error) {
    return { ok: false, formError: "Could not archive the product." }
  }

  revalidatePath("/admin/products")
  return { ok: true, data: undefined }
}

