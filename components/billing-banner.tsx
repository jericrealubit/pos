import Link from "next/link"

import { getProfile } from "@/lib/dal"
import { getBillingState } from "@/lib/billing"

/**
 * Renewal prompt, shown only inside the last stretch of the trial or
 * subscription. With a 90-day trial an always-on upgrade nag would be
 * background noise for eleven weeks and ignored by the time it matters.
 */
export async function BillingBanner() {
  const profile = await getProfile()
  if (!profile) return null

  const { shouldWarn, isActive, isTrialing, daysRemaining, inGrace } =
    getBillingState(profile.stores)
  if (!shouldWarn || !isActive) return null

  const days = Math.max(daysRemaining, 0)
  const message = inGrace
    ? "Your subscription has run out — the till keeps working for a few more days."
    : isTrialing
      ? `${days} ${days === 1 ? "day" : "days"} left in your free trial.`
      : `Your subscription renews in ${days} ${days === 1 ? "day" : "days"}.`

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-muted/60 px-4 py-2 text-center text-xs print:hidden">
      <span className="text-muted-foreground">{message}</span>
      <Link href="/billing" className="font-medium text-primary hover:text-primary/80">
        Keep your store running
      </Link>
    </div>
  )
}
