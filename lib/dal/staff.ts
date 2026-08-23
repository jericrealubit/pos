import "server-only"

import { createClient } from "@/lib/supabase/server"

// A plain select — read_profiles RLS already lets any store member read
// every profile in their own store, so no RPC is needed for the read side.
export async function getStaffForStore() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, deactivated_at, created_at")
    .order("created_at", { ascending: true })
  if (error) throw error
  return data
}

export async function getPendingInvites() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("staff_invites")
    .select("id, email, role, token, expires_at, created_at")
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
  if (error) throw error

  // The generated column type is the full user_role enum (TS can't see
  // the table's CHECK (role in ('ADMIN','CASHIER')) constraint) — narrow
  // it here, at the one place that guarantee actually lives.
  return data as (Omit<(typeof data)[number], "role"> & { role: "ADMIN" | "CASHIER" })[]
}
