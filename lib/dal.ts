import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getBillingState } from "@/lib/billing"

export const getSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getProfile = cache(async () => {
  const user = await getSession()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("*, stores(*)")
    .eq("id", user.id)
    .single()

  // null if signUp succeeded but create_store_and_profile hasn't run yet
  return data
})

export const getIsSuperAdmin = cache(async () => {
  const user = await getSession()
  if (!user) return false

  const supabase = await createClient()
  const { data } = await supabase
    .from("super_admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()
  return !!data
})

type Profile = Awaited<ReturnType<typeof getProfile>>

async function checkNotPaused(profile: Profile) {
  if (profile?.stores?.is_paused) redirect("/store-paused")
}

/**
 * A lapsed subscription blocks the till and every write, but leaves the
 * admin read screens and the CSV export open. The pay-later book is the
 * data a shop can least afford to lose access to, and holding it hostage
 * buys nothing: refusing new sales is already the leverage. It also keeps
 * reactivation frictionless — the data is intact and waiting when they pay.
 */
async function checkSubscription(profile: Profile) {
  if (!profile) return
  if (!getBillingState(profile.stores).isActive) redirect("/billing")
}

export async function requireUser() {
  const user = await getSession()
  if (!user) redirect("/signin")
  await checkNotPaused(await getProfile())
  return user
}

export async function requireAdmin() {
  const profile = await getProfile()
  if (!profile) redirect("/signin")
  await checkNotPaused(profile)
  if (profile.role !== "OWNER" && profile.role !== "ADMIN") redirect("/signin")
  return profile
}

/**
 * Gate for the till and for every write. Call this rather than
 * requireUser in Server Actions that create or change data — hiding the
 * UI is not enough, a Server Action is a public endpoint.
 */
export async function requireActiveStore() {
  const user = await getSession()
  if (!user) redirect("/signin")
  const profile = await getProfile()
  if (!profile) redirect("/signin")
  await checkNotPaused(profile)
  await checkSubscription(profile)
  return profile
}

/** Admin-only writes: the catalogue, store settings. */
export async function requireActiveAdmin() {
  const profile = await requireAdmin()
  await checkSubscription(profile)
  return profile
}

export async function requireSuperAdmin() {
  const user = await getSession()
  if (!user) redirect("/signin")
  if (!(await getIsSuperAdmin())) redirect("/signin")
  return user
}
