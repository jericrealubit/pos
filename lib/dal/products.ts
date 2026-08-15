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

export async function getProductSaleCount(id: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("sale_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id)
  if (error) throw error
  return count ?? 0
}
