"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3Icon,
  CreditCardIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PlusIcon,
  ReceiptIcon,
  SettingsIcon,
  UploadIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// Dispatched by the visible "Search ⌘K" triggers in the sidebar and mobile
// nav sheet, so they can open this same palette without lifting state into
// the server-rendered layout.
export const OPEN_COMMAND_PALETTE_EVENT = "admin-command-palette:open"

export function AdminCommandPalette({ isPremium }: { isPremium: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    function onOpenEvent() {
      setOpen(true)
    }
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent)
    }
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => go("/admin")}>
            <LayoutDashboardIcon />
            Overview
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/products")}>
            <PackageIcon />
            Products
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/customers")}>
            <UsersIcon />
            Customers
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/team")}>
            <UserPlusIcon />
            Team
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/sales")}>
            <ReceiptIcon />
            Sale Records
          </CommandItem>
          {isPremium && (
            <CommandItem onSelect={() => go("/admin/reports")}>
              <BarChart3Icon />
              Reports
            </CommandItem>
          )}
          <CommandItem onSelect={() => go("/admin/settings")}>
            <SettingsIcon />
            Settings
          </CommandItem>
          <CommandItem onSelect={() => go("/billing")}>
            <CreditCardIcon />
            Billing
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/admin/products/new")}>
            <PlusIcon />
            Add product
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/products/import")}>
            <UploadIcon />
            Import products
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/team")}>
            <UserPlusIcon />
            Invite teammate
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
