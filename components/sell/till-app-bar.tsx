import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export function TillAppBar({
  title,
  backHref,
  right,
}: {
  title: string
  backHref?: string
  right?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b pb-3">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back"
          className="relative flex size-8 shrink-0 items-center justify-center rounded border text-muted-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          <LinkPendingIndicator className="absolute -right-1 -bottom-1 size-3 rounded-full bg-background" />
        </Link>
      )}
      <div className="text-base font-semibold">{title}</div>
      {right && <div className="ml-auto text-sm text-muted-foreground">{right}</div>}
    </div>
  )
}
