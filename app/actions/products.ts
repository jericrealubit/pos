"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/dal"
import { productFormSchema, type ProductFormValues } from "@/lib/schemas/product"
import {
  productImportRowSchema,
  IMPORT_MAX_ROWS,
  type ImportResult,
} from "@/lib/schemas/product-import"
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
  const profile = await requireAdmin()
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
  await requireAdmin()
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

export type ProductImportRowInput = {
  line: number
  name: string
  barcode: string
  price: string
  stockQuantity: string
  size: string
  category: string
  description: string
}

/**
 * Bulk CSV import. Free tier (product CRUD isn't premium-gated). Rows are
 * inserted one at a time rather than as a single batch: that way one bad
 * row can't abort the whole file, and a barcode collision (23505) maps
 * cleanly back to the CSV line that caused it. Duplicate barcodes — whether
 * against an existing product or another row earlier in the same file —
 * are always skipped, never overwritten.
 */
export async function productsImport(
  rows: ProductImportRowInput[]
): Promise<ActionResult<ImportResult>> {
  const profile = await requireAdmin()

  if (rows.length === 0) {
    return { ok: false, formError: "No rows to import." }
  }
  if (rows.length > IMPORT_MAX_ROWS) {
    return { ok: false, formError: `Import is limited to ${IMPORT_MAX_ROWS} rows at a time.` }
  }

  const supabase = await createClient()

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name")
  if (categoriesError) {
    return { ok: false, formError: "Could not load categories. Try again." }
  }
  const categoryIdByName = new Map<string, string>(
    (categories ?? []).map((c) => [c.name.trim().toLowerCase(), c.id])
  )

  const result: ImportResult = { imported: 0, skipped: [], errors: [] }
  const seenBarcodes = new Map<string, number>() // barcode -> first line seen in this file

  for (const row of rows) {
    const parsed = productImportRowSchema.safeParse(row)
    if (!parsed.success) {
      const message = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Invalid row."
      result.errors.push({ line: row.line, message })
      continue
    }
    const data = parsed.data
    const barcode = data.barcode.trim()

    const firstSeenLine = seenBarcodes.get(barcode)
    if (firstSeenLine !== undefined) {
      result.skipped.push({
        line: row.line,
        barcode,
        reason: `Duplicate barcode in file (first seen on line ${firstSeenLine}).`,
      })
      continue
    }
    seenBarcodes.set(barcode, row.line)

    let categoryId: string | null = null
    const categoryName = data.category?.trim()
    if (categoryName) {
      const key = categoryName.toLowerCase()
      const existingId = categoryIdByName.get(key)
      if (existingId) {
        categoryId = existingId
      } else {
        const { data: created, error: createError } = await supabase
          .from("categories")
          .insert({ name: categoryName, store_id: profile.store_id })
          .select("id")
          .single()
        if (createError) {
          if (createError.code === "23505") {
            // Created concurrently (e.g. by an earlier row in the same
            // import that normalized to the same name) — re-fetch it.
            const { data: existing } = await supabase
              .from("categories")
              .select("id")
              .eq("name", categoryName)
              .single()
            categoryId = existing?.id ?? null
          } else {
            result.errors.push({ line: row.line, message: "Could not create the category." })
            continue
          }
        } else {
          categoryId = created.id
          categoryIdByName.set(key, created.id)
        }
      }
    }

    const { error: insertError } = await supabase.from("products").insert({
      name: data.name,
      description: data.description || null,
      size: data.size || null,
      price_cents: dollarsToCents(data.price),
      barcode,
      category_id: categoryId,
      stock_quantity: data.stockQuantity ? Number(data.stockQuantity) : 0,
      store_id: profile.store_id,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        result.skipped.push({ line: row.line, barcode, reason: "Barcode already exists." })
      } else {
        result.errors.push({ line: row.line, message: "Could not save this row." })
      }
      continue
    }

    result.imported += 1
  }

  if (result.imported > 0) {
    revalidatePath("/admin/products")
  }
  return { ok: true, data: result }
}

export async function productArchive(id: string): Promise<ActionResult> {
  await requireAdmin()
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

