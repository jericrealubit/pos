import { requireActiveStore, getProfile } from "@/lib/dal"
import { SellProvider } from "@/components/sell/sell-provider"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { BillingBanner } from "@/components/billing-banner"

export default async function SellLayout({ children }: LayoutProps<"/sell">) {
  await requireActiveStore()
  const profile = await getProfile()
  if (!profile) {
    // signUp succeeded but create_store_and_profile hasn't run yet
    return <div className="p-4">Setting up your store…</div>
  }

  return (
    <SellProvider role={profile.role} currency={profile.stores.currency as string}>
      <div className="fixed top-3 right-3 z-20 print:hidden">
        <ThemeSwitcher />
      </div>
      <BillingBanner />
      <div className="mx-auto min-h-full w-full max-w-md md:max-w-3xl">{children}</div>
    </SellProvider>
  )
}
