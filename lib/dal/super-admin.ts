import "server-only"

import { createClient } from "@/lib/supabase/server"

export type SuperAdminStoreRow = {
  store_id: string
  store_name: string
  currency: string
  country: string | null
  created_at: string
  is_paused: boolean
  plan: "TRIAL" | "PAID"
  paid_until: string | null
  billing_note: string | null
  owner_first_name: string | null
  owner_last_name: string | null
  owner_email: string | null
}

export async function getStoresForSuperAdmin(): Promise<SuperAdminStoreRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("super_admin_list_stores")
  if (error) throw error
  return data ?? []
}

/**
 * Signups per ISO week, newest first. Growth is the thing to watch at
 * these prices, and the AU/PH mix decides where acquisition effort is
 * worth spending — an AU store is worth roughly four PH ones.
 */
export function signupsByWeek(
  stores: SuperAdminStoreRow[],
  weeks = 8
): { weekStart: string; total: number; byCountry: Record<string, number> }[] {
  const buckets = new Map<string, { total: number; byCountry: Record<string, number> }>()

  for (const store of stores) {
    const created = new Date(store.created_at)
    if (Number.isNaN(created.getTime())) continue

    // Snap to the Monday of that week, in UTC so the boundary doesn't
    // shift with the viewer's timezone.
    const monday = new Date(
      Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate())
    )
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
    const key = monday.toISOString().slice(0, 10)

    const bucket = buckets.get(key) ?? { total: 0, byCountry: {} }
    bucket.total += 1
    const country = store.country ?? "??"
    bucket.byCountry[country] = (bucket.byCountry[country] ?? 0) + 1
    buckets.set(key, bucket)
  }

  return [...buckets.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, weeks)
    .map(([weekStart, v]) => ({ weekStart, ...v }))
}
