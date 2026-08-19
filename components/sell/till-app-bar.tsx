import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
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
        <Button
          variant="outline"
          size="icon"
          className="relative shrink-0"
          nativeButton={false}
          render={<Link href={backHref} aria-label="Back" />}
        >
          <ChevronLeftIcon />
          <LinkPendingIndicator className="absolute -right-1 -bottom-1 size-3 rounded-full bg-background" />
        </Button>
      )}
      <div className="text-base font-semibold">{title}</div>
      {right && <div className="ml-auto text-sm text-muted-foreground">{right}</div>}
    </div>
  )
}
