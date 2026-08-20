"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  registerSchema,
  signinSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type SigninInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/schemas/auth"
import type { ActionResult } from "@/lib/actions/types"

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<{ pendingConfirmation: boolean }>> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const { storeName, firstName, lastName, email, password } = parsed.data

  const origin = (await headers()).get("origin")
  const supabase = await createClient()
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Store/name fields ride along on the confirmation email's user object
      // since there's no session yet to call create_store_and_profile with.
      data: { store_name: storeName, first_name: firstName, last_name: lastName },
      emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
    },
  })
  if (signUpError) {
    return { ok: false, formError: signUpError.message }
  }

  // "Confirm email" is on for this project: signUp succeeds but returns no
  // session until the user clicks the emailed link. create_store_and_profile
  // needs auth.uid(), so it runs from /auth/confirm instead, once a session
  // actually exists.
  if (!signUpData.session) {
    return { ok: true, data: { pendingConfirmation: true } }
  }

  const { error: rpcError } = await supabase.rpc("create_store_and_profile", {
    store_name: storeName,
    first: firstName,
    last: lastName,
  })
  if (rpcError) {
    return { ok: false, formError: "Could not create your store. Try again." }
  }

  redirect("/sell")
}

export async function signInAction(
  input: SigninInput
): Promise<ActionResult> {
  const parsed = signinSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: signInData, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return { ok: false, formError: "Incorrect email or password." }
  }

  const { data: superAdmin } = await supabase
    .from("super_admins")
    .select("id")
    .eq("id", signInData.user.id)
    .maybeSingle()

  redirect(superAdmin ? "/super-admin" : "/sell")
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/signin")
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const origin = (await headers()).get("origin")
  const supabase = await createClient()
  // Always report success, whether or not the email is registered — the
  // password-reset flow shouldn't reveal account existence.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: origin ? `${origin}/auth/reset` : undefined,
  })

  return { ok: true, data: undefined }
}

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: userData, error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })
  if (error) {
    return { ok: false, formError: error.message }
  }

  const { data: superAdmin } = await supabase
    .from("super_admins")
    .select("id")
    .eq("id", userData.user.id)
    .maybeSingle()

  redirect(superAdmin ? "/super-admin" : "/sell")
}
