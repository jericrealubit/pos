import "server-only"

import { createClient } from "@/lib/supabase/server"

export type SuperAdminStoreRow = {
  store_id: string
  store_name: string
  currency: string
  created_at: string
  is_paused: boolean
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
