import "server-only"

import { createClient } from "@/lib/supabase/server"

export async function getProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, name)")
    .eq("is_archived", false)
    .order("name")
  if (error) throw error
  return data
}

export async function getProduct(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, name)")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name")
  if (error) throw error
  return data
}

/**
 * Products at or below the store's low-stock threshold, most-depleted
 * first. Stock is enforced (create_sale rejects a sale that would push a
 * product below zero), so a product at 0 genuinely can't be sold — the
 * most urgent row, not noise.
 */
export async function getLowStockProducts(threshold: number, limit = 8) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name, size, stock_quantity")
    .eq("is_archived", false)
    .lte("stock_quantity", threshold)
    .order("stock_quantity", { ascending: true })
    .order("name")
    .limit(limit)
  if (error) throw error
  return data
}

export async function getProductSaleCount(id: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("sale_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id)
  if (error) throw error
  return count ?? 0
}
