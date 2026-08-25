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

export async function getSalesByHour(range: Range) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("sales_by_hour", {
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return data
}

export async function getSalesByDayOfWeek(range: Range) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("sales_by_day_of_week", {
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return data
}

export async function getSalesByTender(range: Range) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("sales_by_tender", {
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return data
}

export async function getProductVelocity(range: Range) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("product_velocity", {
    p_from: range.from,
    p_to: range.to,
  })
  if (error) throw error
  return data
}

export type AgingBucket = "0-7" | "8-30" | "31-60" | "60+"

export type AgedSale = {
  id: string
  customerId: string | null
  customerName: string
  totalCents: number
  createdAt: string
  daysOutstanding: number
  bucket: AgingBucket
}

function agingBucketFor(daysOutstanding: number): AgingBucket {
  if (daysOutstanding <= 7) return "0-7"
  if (daysOutstanding <= 30) return "8-30"
  if (daysOutstanding <= 60) return "31-60"
  return "60+"
}

/**
 * Bucketed by age in TypeScript rather than SQL — the book is small-N data
 * (a store's outstanding unpaid sales), so a single unbucketed query plus a
 * JS reduce is simpler than a second RPC and keeps the "what counts as old"
 * threshold easy to tune without a migration.
 */
export async function getUnpaidSalesAging() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales")
    .select("id, total_cents, created_at, customers(id, name)")
    .eq("status", "UNPAID")
    .order("created_at", { ascending: true })
  if (error) throw error

  const now = Date.now()
  const aged: AgedSale[] = data.map((s) => {
    const daysOutstanding = Math.floor((now - new Date(s.created_at).getTime()) / 86_400_000)
    return {
      id: s.id,
      customerId: s.customers?.id ?? null,
      customerName: s.customers?.name ?? "Walk-in",
      totalCents: s.total_cents,
      createdAt: s.created_at,
      daysOutstanding,
      bucket: agingBucketFor(daysOutstanding),
    }
  })

  const buckets: Record<AgingBucket, number> = { "0-7": 0, "8-30": 0, "31-60": 0, "60+": 0 }
  for (const a of aged) buckets[a.bucket] += a.totalCents

  const oldest = [...aged].sort((a, b) => b.daysOutstanding - a.daysOutstanding).slice(0, 10)
  const totalCents = aged.reduce((sum, a) => sum + a.totalCents, 0)

  return { buckets, oldest, totalCents, count: aged.length }
}
