"use client"

import Link from "next/link"
import { TriangleAlertIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center">
      <TriangleAlertIcon className="size-8 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Give it another try, or come back in a moment.
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={() => retry()}>
          Try again
        </Button>
        <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to admin
        </Link>
      </div>
    </div>
  )
}
