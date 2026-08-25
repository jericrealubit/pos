import Link from "next/link";
import {
  BarChart3Icon,
  ChevronLeftIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ReceiptIcon,
  SettingsIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { requireAdmin, hasPremium } from "@/lib/dal";
import { AdminNavLink } from "@/app/admin/admin-nav-link";
import { AdminMobileNav } from "@/app/admin/admin-mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { BillingBanner } from "@/components/billing-banner";
import { AdminCommandPalette } from "@/components/admin-command-palette";
import { AdminCommandPaletteTrigger } from "@/components/admin-command-palette-trigger";

const NAV_ICON_CLASS = "size-4 shrink-0 group-aria-[current=page]:text-primary";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireAdmin();
  const storeName = profile.stores.name as string;
  const isPremium = hasPremium(profile);

  return (
    <div className="flex min-h-full flex-col">
      <BillingBanner surface="admin" />
      <div className="flex flex-1">
      <aside className="hidden md:flex md:w-[130px] md:shrink-0 md:flex-col md:border-r">
        <Link href="/admin" className="block p-4 pb-2 font-medium hover:text-primary">
          {storeName}
        </Link>
        <div className="px-4 pb-2">
          <AdminCommandPaletteTrigger />
        </div>
        <nav className="flex-1">
          <AdminNavLink
            href="/admin"
            exact
            icon={<LayoutDashboardIcon className={NAV_ICON_CLASS} />}
          >
            Overview
          </AdminNavLink>
          <AdminNavLink
            href="/admin/products"
            icon={<PackageIcon className={NAV_ICON_CLASS} />}
          >
            Products
          </AdminNavLink>
          <AdminNavLink
            href="/admin/customers"
            icon={<UsersIcon className={NAV_ICON_CLASS} />}
          >
            Customers
          </AdminNavLink>
          <AdminNavLink
            href="/admin/team"
            icon={<UserPlusIcon className={NAV_ICON_CLASS} />}
          >
            Team
          </AdminNavLink>
          <AdminNavLink
            href="/admin/sales"
            icon={<ReceiptIcon className={NAV_ICON_CLASS} />}
          >
            Sale Records
          </AdminNavLink>
          {isPremium && (
            <AdminNavLink
              href="/admin/reports"
              icon={<BarChart3Icon className={NAV_ICON_CLASS} />}
            >
              Reports
            </AdminNavLink>
          )}
          <AdminNavLink
            href="/admin/settings"
            icon={<SettingsIcon className={NAV_ICON_CLASS} />}
          >
            Settings
          </AdminNavLink>
          <AdminNavLink
            href="/billing"
            icon={<CreditCardIcon className={NAV_ICON_CLASS} />}
          >
            Billing
          </AdminNavLink>
        </nav>
        <div className="p-4">
          <Link
            href="/sell"
            className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="size-3.5" />
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
          <AdminMobileNav storeName={storeName} isPremium={isPremium} />
          <main id="main-content" className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
      <AdminCommandPalette isPremium={isPremium} />
    </div>
  );
}
