import { requireSuperAdmin } from "@/lib/dal"
import { SignOutButton } from "@/components/sign-out-button"

export default async function SuperAdminLayout({ children }: LayoutProps<"/super-admin">) {
  await requireSuperAdmin()

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <div className="font-medium">Super Admin</div>
        <SignOutButton />
      </header>
      <main id="main-content" className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
