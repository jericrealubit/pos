"use client"

import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/admin-command-palette"

export function AdminCommandPaletteTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        <SearchIcon className="size-3.5" />
        Search
      </span>
      <kbd className="rounded border bg-background px-1 font-mono text-[10px]">⌘K</kbd>
    </button>
  )
}
