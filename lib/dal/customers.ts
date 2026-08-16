import "server-only"

import { createClient } from "@/lib/supabase/server"

export async function searchCustomerBalances(query: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("customer_balances")
    .select("*")
    .ilike("name", `%${query.trim()}%`)
    .order("name")
    .limit(20)
  if (error) throw error
  return data
}

export async function getCustomerBalances() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("customer_balances")
    .select("*")
    .order("oldest_unpaid", { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function getCustomerWithUnpaidItems(id: string) {
  const supabase = await createClient()
  const { data: customer, error: customerError } = await supabase
    .from("customer_balances")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (customerError) throw customerError
  if (!customer) return null

  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select("id, created_at, sale_items(id, name_snapshot, size_snapshot, unit_price_cents, quantity)")
    .eq("customer_id", id)
    .eq("status", "UNPAID")
    .order("created_at", { ascending: false })
  if (salesError) throw salesError

  return { customer, sales }
}
