"use client"

import { useTransition } from "react"
import { LogOutIcon } from "lucide-react"

import { signOutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      loading={isPending}
      className="gap-1.5"
      onClick={() => startTransition(() => signOutAction())}
    >
      {!isPending && <LogOutIcon />}
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  )
}
