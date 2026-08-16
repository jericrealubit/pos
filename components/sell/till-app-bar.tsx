import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

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
          className="flex size-8 shrink-0 items-center justify-center rounded border text-muted-foreground"
        >
          <ChevronLeftIcon className="size-4" />
        </Link>
      )}
      <div className="text-base font-semibold">{title}</div>
      {right && <div className="ml-auto text-sm text-muted-foreground">{right}</div>}
    </div>
  )
}
