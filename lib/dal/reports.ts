import "server-only"

import { createClient } from "@/lib/supabase/server"

type Range = { from: string | null; to: string | null }

export async function getRevenueByDay(range: Range) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("sales_revenue_by_day", {
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return data
}

export async function getTopProducts(range: Range, limit = 10) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("sales_top_products", {
    p_from: range.from,
    p_to: range.to,
    p_limit: limit,
  })
  if (error) throw error
  return data
}
