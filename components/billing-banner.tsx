import Link from "next/link"

import { getProfile } from "@/lib/dal"
import { getBillingState } from "@/lib/billing"

/**
 * A slim upgrade/renewal prompt.
 *
 * Two distinct jobs, by tier:
 * - TRIAL/PREMIUM near expiry — a renewal countdown, shown on any surface
 *   (till or admin) inside the last stretch so it lands when it matters.
 * - FREE — a standing upsell for the pay-later book. Shown on the `admin`
 *   surface only: nagging a cashier at the till, who can't act on it, is
 *   pure noise, whereas the owner lives in admin.
 */
export async function BillingBanner({
  surface = "till",
}: {
  surface?: "till" | "admin"
}) {
  const profile = await getProfile()
  if (!profile) return null

  const { tier, shouldWarn, isTrialing, daysRemaining, inGrace } =
    getBillingState(profile.stores)

  if (tier === "FREE") {
    if (surface !== "admin") return null
    return (
      <Banner
        message="You're on the Free plan — the till is yours to keep."
        cta="Unlock the pay-later book"
      />
    )
  }

  // TRIAL or PREMIUM: only surface the countdown near the end.
  if (!shouldWarn) return null

  const days = Math.max(daysRemaining, 0)
  const message = inGrace
    ? "Your Premium access has run out — the pay-later book keeps working for a few more days."
    : isTrialing
      ? `${days} ${days === 1 ? "day" : "days"} left of Premium in your free trial.`
      : `Your Premium plan renews in ${days} ${days === 1 ? "day" : "days"}.`

  return <Banner message={message} cta="Manage your plan" />
}

function Banner({ message, cta }: { message: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-muted/60 px-4 py-2 text-center text-xs print:hidden">
      <span className="text-muted-foreground">{message}</span>
      <Link href="/billing" className="font-medium text-primary hover:text-primary/80">
        {cta}
      </Link>
    </div>
  )
}
