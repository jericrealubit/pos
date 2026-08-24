import Link from "next/link"

import { getSession, getProfile } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { JoinSignupForm } from "@/components/join-signup-form"
import { JoinExistingForm } from "@/components/join-existing-form"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "an Admin",
  CASHIER: "a Cashier",
}

export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params

  const supabase = await createClient()
  const { data: invite } = await supabase
    .rpc("staff_invite_preview", { p_token: token })
    .maybeSingle()

  // Deliberately the same generic message whether the token is wrong,
  // expired, revoked, or already accepted — see staff_invite_preview's
  // own comment for why those states aren't distinguished here.
  if (!invite) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <h1 className="text-xl font-semibold">This invite link is no longer valid</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          It may have expired, been revoked, or already been used. Ask the store owner for a
          new one.
        </p>
        <Link href="/signin" className="text-sm text-primary hover:text-primary/80">
          Sign in
        </Link>
      </div>
    )
  }

  const roleLabel = ROLE_LABEL[invite.role] ?? invite.role

  const user = await getSession()
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6 p-4 py-10">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Join {invite.store_name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;ve been invited as {roleLabel}.
          </p>
        </div>
        <JoinSignupForm token={token} email={invite.email} />
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
          , then come back to this link.
        </p>
      </div>
    )
  }

  // Signed in already — this covers both "clicked the link while logged
  // in" and someone returning after using the "sign in instead" link
  // above, having no store profile yet.
  const profile = await getProfile()
  if (profile) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <h1 className="text-xl font-semibold">This account already belongs to a store</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sign out and create a new account, or ask the store owner to send the invite to a
          different email.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 p-4 py-10">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Join {invite.store_name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue as {user.email} — you&apos;ve been invited as {roleLabel}.
        </p>
      </div>
      <JoinExistingForm token={token} />
    </div>
  )
}
