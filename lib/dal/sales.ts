import "server-only"

import { createClient } from "@/lib/supabase/server"

export async function getRecentSales(limit = 5) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales")
    .select("id, status, subtotal_cents, total_cents, created_at, sale_items(quantity)")
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
      "id, status, subtotal_cents, total_cents, tender_type, created_at, customers(name), profiles(first_name, last_name), sale_items(quantity)"
    )
    .order("created_at", { ascending: false })
  if (from) query = query.gte("created_at", from)
  if (to) query = query.lt("created_at", to)
  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Pure summary over rows already fetched by getSales — kept separate from
 * a query so the existing Sale Records page and the new Reports page can
 * both call getSales() once and derive their own totals from it, rather
 * than fetching the same range twice.
 */
export function summarizeSales(sales: Awaited<ReturnType<typeof getSales>>) {
  const saleCount = sales.length
  // total_cents (post-discount), not subtotal_cents — a discounted sale
  // shouldn't inflate revenue, and "owed" on the book means what's
  // actually still due, not the pre-discount price.
  const totalCents = sales.reduce((sum, s) => sum + s.total_cents, 0)
  const unpaidCents = sales
    .filter((s) => s.status === "UNPAID")
    .reduce((sum, s) => sum + s.total_cents, 0)
  const avgCents = saleCount > 0 ? Math.round(totalCents / saleCount) : 0
  return { totalCents, saleCount, avgCents, unpaidCents }
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
