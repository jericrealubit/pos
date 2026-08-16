"use client"

import { useState } from "react"
import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AdminNavLink } from "@/app/admin/admin-nav-link"
import { SignOutButton } from "@/components/sign-out-button"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export function AdminMobileNav({ storeName }: { storeName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-3 border-b p-4 md:hidden">
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
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{storeName}</SheetTitle>
          </SheetHeader>
          <nav onClick={() => setOpen(false)}>
            <AdminNavLink href="/admin/products">Products</AdminNavLink>
            <AdminNavLink href="/admin/customers">Customers</AdminNavLink>
          </nav>
          <div className="mt-auto p-4">
            <Link
              href="/sell"
              className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Back to till
              <LinkPendingIndicator className="size-3.5" />
            </Link>
            <div className="flex items-center gap-2">
              <SignOutButton />
              <ThemeSwitcher />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <span className="font-medium">{storeName}</span>
    </div>
  )
}
