import Link from "next/link"

import { requireAdmin } from "@/lib/dal"
import { AdminNavLink } from "@/app/admin/admin-nav-link"
import { AdminMobileNav } from "@/app/admin/admin-mobile-nav"
import { SignOutButton } from "@/components/sign-out-button"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireAdmin()
  const storeName = profile.stores.name as string

  return (
    <div className="flex min-h-full">
      <aside className="hidden md:flex md:w-[190px] md:shrink-0 md:flex-col md:border-r">
        <div className="p-4 font-medium">{storeName}</div>
        <nav className="flex-1">
          <AdminNavLink href="/admin/products">Products</AdminNavLink>
          <AdminNavLink href="/admin/customers">Customers</AdminNavLink>
        </nav>
        <div className="p-4">
          <Link
            href="/sell"
            className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Back to till
            <LinkPendingIndicator className="size-3.5" />
          </Link>
          <div className="flex items-center gap-2">
            <SignOutButton />
            <ThemeSwitcher />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav storeName={storeName} />
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
