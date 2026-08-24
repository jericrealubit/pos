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

async function checkNotDeactivated(profile: Profile) {
  if (profile?.deactivated_at) redirect("/account-deactivated")
}

/**
 * Whether a store's premium features (the pay-later book, and future
 * premium-only features) are unlocked. The till and free-tier writes must
 * NOT gate on this — scan-and-sell is free forever. Use this in Server
 * Actions that need to return a friendly upsell instead of redirecting.
 */
export function hasPremium(profile: Profile): boolean {
  if (!profile) return false
  return getBillingState(profile.stores).premiumActive
}

export async function requireUser() {
  const user = await getSession()
  if (!user) redirect("/signin")
  const profile = await getProfile()
  await checkNotPaused(profile)
  await checkNotDeactivated(profile)
  return user
}

export async function requireAdmin() {
  const profile = await getProfile()
  if (!profile) redirect("/signin")
  await checkNotPaused(profile)
  await checkNotDeactivated(profile)
  if (profile.role !== "OWNER" && profile.role !== "ADMIN") redirect("/signin")
  return profile
}

/**
 * Gate for the till and for every free-tier write (scan-and-sell, cash
 * sales). Auth + not-paused only — deliberately NOT gated on the
 * subscription, so a Free-tier store keeps ringing up sales forever. Call
 * this rather than requireUser in Server Actions that create or change
 * data — hiding the UI is not enough, a Server Action is a public endpoint.
 */
export async function requireStore() {
  const user = await getSession()
  if (!user) redirect("/signin")
  const profile = await getProfile()
  if (!profile) redirect("/signin")
  await checkNotPaused(profile)
  await checkNotDeactivated(profile)
  return profile
}

/**
 * Page-level gate for premium-only routes: redirects a Free-tier store to
 * /billing. Backstops the UI + action guards for the pay-later flow, and is
 * the seam future premium pages (staff, reporting) reuse.
 */
export async function requirePremiumStore() {
  const profile = await requireStore()
  if (!hasPremium(profile)) redirect("/billing")
  return profile
}

/** Admin-only pages that are themselves premium (e.g. Reports). */
export async function requirePremiumAdmin() {
  const profile = await requireAdmin()
  if (!hasPremium(profile)) redirect("/billing")
  return profile
}

export async function requireSuperAdmin() {
  const user = await getSession()
  if (!user) redirect("/signin")
  if (!(await getIsSuperAdmin())) redirect("/signin")
  return user
}
