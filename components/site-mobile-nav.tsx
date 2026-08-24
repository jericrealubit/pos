"use client"

import { useState } from "react"
import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export function SiteMobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
        </Button>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav
            className="flex flex-col gap-2 p-4"
            onClick={() => setOpen(false)}
          >
            <Link
              href="/pricing"
              className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/signin"
              className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
            >
              Sign in
              <LinkPendingIndicator className="size-3.5" />
            </Link>
            <Link href="/register" className={cn(buttonVariants(), "gap-1.5")}>
              Create account
              <LinkPendingIndicator className="size-3.5" />
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
