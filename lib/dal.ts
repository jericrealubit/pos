import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

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

async function checkNotPaused(profile: Awaited<ReturnType<typeof getProfile>>) {
  if (profile?.stores?.is_paused) redirect("/store-paused")
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

export async function requireSuperAdmin() {
  const user = await getSession()
  if (!user) redirect("/signin")
  if (!(await getIsSuperAdmin())) redirect("/signin")
  return user
}
