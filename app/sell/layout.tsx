import { requireStore } from "@/lib/dal"
import { getBillingState } from "@/lib/billing"
import { SellProvider } from "@/components/sell/sell-provider"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { BillingBanner } from "@/components/billing-banner"

export default async function SellLayout({ children }: LayoutProps<"/sell">) {
  // requireStore (not a subscription gate) — the till is free forever.
  const profile = await requireStore()

  // Premium unlocks the pay-later book; on the Free tier the cart offers
  // cash sales only and points the "Pay later" option at /billing.
  const canUsePayLater = getBillingState(profile.stores).premiumActive

  return (
    <SellProvider
      role={profile.role}
      currency={profile.stores.currency as string}
      canUsePayLater={canUsePayLater}
    >
      <div className="fixed top-3 right-3 z-20 print:hidden">
        <ThemeSwitcher />
      </div>
      <BillingBanner />
      <div id="main-content" className="mx-auto min-h-full w-full max-w-md md:max-w-3xl">{children}</div>
    </SellProvider>
  )
}
