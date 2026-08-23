"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getSession, getProfile } from "@/lib/dal"
import { getBillingState } from "@/lib/billing"
import {
  joinSignupSchema,
  joinExistingSchema,
  type JoinSignupInput,
  type JoinExistingInput,
} from "@/lib/schemas/staff"
import type { ActionResult } from "@/lib/actions/types"

const INVITE_INVALID = "This invite link is no longer valid."
const INVITE_NEEDS_PREMIUM =
  "This store's Premium plan has lapsed — ask the owner to renew before you can join."

async function previewInvite(token: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc("staff_invite_preview", { p_token: token }).maybeSingle()
  return data
}

/**
 * Invite creation and acceptance can be days apart, unlike createSale's
 * premium check where the same logged-in owner acts in one request — so
 * this re-checks premium at accept time using the real getBillingState(),
 * rather than trusting that the store was still Premium when the invite
 * was sent. On failure the invite is left untouched (not consumed), so
 * it's usable again the moment the owner renews.
 */
function requirePreviewPremium(invite: { plan: string | null; paid_until: string | null }) {
  return getBillingState({ plan: invite.plan, paid_until: invite.paid_until }).premiumActive
}

/** For a brand-new joiner with no Supabase session yet. */
export async function acceptInviteSignup(
  token: string,
  input: JoinSignupInput
): Promise<ActionResult<{ pendingConfirmation: boolean }>> {
  const parsed = joinSignupSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const invite = await previewInvite(token)
  if (!invite) {
    return { ok: false, formError: INVITE_INVALID }
  }
  if (!requirePreviewPremium(invite)) {
    return { ok: false, formError: INVITE_NEEDS_PREMIUM }
  }

  const origin = (await headers()).get("origin")
  const supabase = await createClient()
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: invite.email,
    password: parsed.data.password,
    options: {
      // Read at /auth/confirm to run accept_staff_invite once a session
      // exists — mirrors registerAction's store_name/first_name/last_name
      // metadata, with invite_token in place of store_name.
      data: {
        invite_token: token,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
      },
      emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
    },
  })
  if (signUpError) {
    return { ok: false, formError: signUpError.message }
  }

  // "Confirm email" is on: signUp succeeds but returns no session until
  // the link is clicked — accept_staff_invite runs from /auth/confirm.
  if (!signUpData.session) {
    return { ok: true, data: { pendingConfirmation: true } }
  }

  const { error: rpcError } = await supabase.rpc("accept_staff_invite", {
    p_token: token,
    p_first: parsed.data.firstName,
    p_last: parsed.data.lastName,
  })
  if (rpcError && !rpcError.message.includes("already belongs to a store")) {
    return { ok: false, formError: "Could not join the store. Try again." }
  }

  redirect("/sell")
}

/**
 * For someone who already has a Supabase session (e.g. they clicked
 * "Sign in instead" on the join page because signUp's anti-enumeration
 * behavior silently swallows a second signup for an already-registered
 * email) but no store profile yet.
 */
export async function acceptInviteExisting(
  token: string,
  input: JoinExistingInput
): Promise<ActionResult> {
  const user = await getSession()
  if (!user) redirect("/signin")

  const existingProfile = await getProfile()
  if (existingProfile) {
    return { ok: false, formError: "This account already belongs to a store." }
  }

  const parsed = joinExistingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const invite = await previewInvite(token)
  if (!invite) {
    return { ok: false, formError: INVITE_INVALID }
  }
  if (!requirePreviewPremium(invite)) {
    return { ok: false, formError: INVITE_NEEDS_PREMIUM }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("accept_staff_invite", {
    p_token: token,
    p_first: parsed.data.firstName,
    p_last: parsed.data.lastName,
  })
  if (error && !error.message.includes("already belongs to a store")) {
    return { ok: false, formError: "Could not join the store. Try again." }
  }

  redirect("/sell")
}
