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

export async function getSales({ from, to }: { from: string | null; to: string | null }) {
  const supabase = await createClient()
  let query = supabase
    .from("sales")
    .select(
      "id, status, subtotal_cents, created_at, customers(name), profiles(first_name, last_name), sale_items(quantity)"
    )
    .order("created_at", { ascending: false })
  if (from) query = query.gte("created_at", from)
  if (to) query = query.lt("created_at", to)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getSaleWithItems(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales")
    .select("*, sale_items(*), customers(name, phone), profiles(first_name, last_name)")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data
}
