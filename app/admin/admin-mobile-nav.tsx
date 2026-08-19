"use client"

import { useState } from "react"
import Link from "next/link"
import { MenuIcon, PackageIcon, ReceiptIcon, SettingsIcon, UsersIcon } from "lucide-react"

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

const NAV_ICON_CLASS = "size-4 shrink-0 group-aria-[current=page]:text-primary"

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
            <AdminNavLink href="/admin/products" icon={<PackageIcon className={NAV_ICON_CLASS} />}>
              Products
            </AdminNavLink>
            <AdminNavLink href="/admin/customers" icon={<UsersIcon className={NAV_ICON_CLASS} />}>
              Customers
            </AdminNavLink>
            <AdminNavLink href="/admin/sales" icon={<ReceiptIcon className={NAV_ICON_CLASS} />}>
              Sale Records
            </AdminNavLink>
            <AdminNavLink href="/admin/settings" icon={<SettingsIcon className={NAV_ICON_CLASS} />}>
              Settings
            </AdminNavLink>
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
