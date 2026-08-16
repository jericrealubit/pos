import "server-only"

import { createClient } from "@/lib/supabase/server"

export async function getRecentSales(limit = 5) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales")
    .select("id, status, subtotal_cents, created_at, sale_items(quantity)")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getSaleWithItems(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data
}
