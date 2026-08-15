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

export async function requireUser() {
  const user = await getSession()
  if (!user) redirect("/signin")
  return user
}

export async function requireAdmin() {
  const profile = await getProfile()
  if (!profile) redirect("/signin")
  if (profile.role !== "OWNER" && profile.role !== "ADMIN") redirect("/signin")
  return profile
}
