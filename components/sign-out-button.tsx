"use client"

import { useTransition } from "react"

import { signOutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function SignOutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isPending}
      className="gap-1.5"
      onClick={() => startTransition(() => signOutAction())}
    >
      {isPending && <Spinner className="size-3.5" />}
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  )
}
