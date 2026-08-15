"use client"

import { useState } from "react"
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
          </nav>
          <div className="mt-auto p-4">
            <SignOutButton />
          </div>
        </SheetContent>
      </Sheet>
      <span className="font-medium">{storeName}</span>
    </div>
  )
}
