"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin, hasPremium } from "@/lib/dal"
import { staffInviteSchema, staffRoleSchema, type StaffInviteInput } from "@/lib/schemas/staff"
import { sendEmail } from "@/lib/email/send"
import { staffInviteEmail } from "@/lib/email/templates/staff-invite"
import type { ActionResult } from "@/lib/actions/types"

/**
 * Only invite CREATION is premium-gated — growing the team is the thing
 * being sold. Revoking a pending invite, changing an existing teammate's
 * role, and deactivating/reactivating access are all left free: a store
 * that lapses to Free still needs to be able to manage (and, especially,
 * lock out) staff it already has. Cutting someone off is a safety action,
 * not a growth one, and shouldn't be held hostage by billing.
 */
export async function staffInviteCreate(
  input: StaffInviteInput
): Promise<
  ActionResult<{ joinUrl: string; expiresAt: string; emailed: boolean; email: string }>
> {
  const profile = await requireAdmin()
  if (!hasPremium(profile)) {
    return { ok: false, code: "UPGRADE", formError: "Staff accounts are a Premium feature." }
  }
  const parsed = staffInviteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc("create_staff_invite", { p_email: parsed.data.email, p_role: parsed.data.role })
    .single()

  if (error) {
    return { ok: false, formError: "Could not create the invite. Try again." }
  }

  const origin = (await headers()).get("origin")
  const joinUrl = `${origin ?? ""}/join/${data.token}`

  // Best-effort: a failed send must never fail invite creation. The UI keeps
  // the copy-link path as the fallback either way.
  let emailed = false
  try {
    const storeName = profile.stores?.name as string | undefined
    const inviterName = [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    const { subject, html, text } = staffInviteEmail({
      storeName: storeName ?? "your store",
      inviterName: inviterName || "A teammate",
      role: parsed.data.role,
      joinUrl,
      expiresAt: data.expires_at,
    })
    const result = await sendEmail({ to: parsed.data.email, subject, html, text })
    emailed = result.ok
  } catch {
    emailed = false
  }

  revalidatePath("/admin/team")
  return { ok: true, data: { joinUrl, expiresAt: data.expires_at, emailed, email: parsed.data.email } }
}

export async function staffInviteRevoke(inviteId: string): Promise<ActionResult> {
  await requireAdmin()

  const supabase = await createClient()
  const { error } = await supabase.rpc("revoke_staff_invite", { p_invite_id: inviteId })
  if (error) {
    return { ok: false, formError: "Could not revoke the invite." }
  }

  revalidatePath("/admin/team")
  return { ok: true, data: undefined }
}

export async function staffRoleUpdate(
  profileId: string,
  role: "ADMIN" | "CASHIER"
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = staffRoleSchema.safeParse(role)
  if (!parsed.success) {
    return { ok: false, formError: "Invalid role." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_staff_role", {
    p_profile_id: profileId,
    p_role: parsed.data,
  })
  if (error) {
    return { ok: false, formError: error.message || "Could not update the role." }
  }

  revalidatePath("/admin/team")
  return { ok: true, data: undefined }
}

export async function staffSetDeactivated(
  profileId: string,
  deactivated: boolean
): Promise<ActionResult> {
  await requireAdmin()

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_staff_deactivated", {
    p_profile_id: profileId,
    p_deactivated: deactivated,
  })
  if (error) {
    return { ok: false, formError: error.message || "Could not update this teammate's access." }
  }

  revalidatePath("/admin/team")
  return { ok: true, data: undefined }
}
