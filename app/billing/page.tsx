import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { getSession, getProfile } from "@/lib/dal"
import { getBillingState, regionFor, regionCodeFor, TRIAL_DAYS, GRACE_DAYS } from "@/lib/billing"
import { formatMoney } from "@/lib/money"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SignOutButton } from "@/components/sign-out-button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Subscription — Counter",
}

const SUPPORT_EMAIL = "hello@cpos.au"

/**
 * Payment rails differ by market: an Australian domestic transfer is
 * useless to a shop in Manila or Nairobi. Keep the instructions the
 * store actually needs in front of them and the rest out of the way.
 */
const PAYMENT_METHODS: Record<string, string> = {
  AU: "Bank transfer (PayID or BSB/account) — details are on the invoice we email you.",
  NZ: "Bank transfer — details are on the invoice we email you.",
  PH: "GCash, Maya, or bank transfer — send us a message and we'll pass on the details.",
  DEFAULT: "PayPal or Wise — send us a message and we'll email you a payment link.",
}

// Top-level route rather than /admin/billing on purpose: the
// subscription gate redirects here from the till, and a cashier at a
// lapsed store would be bounced straight back out of the admin layout's
// role check. Everyone who works at the store can see this page.
export default async function BillingPage() {
  const user = await getSession()
  if (!user) redirect("/signin")

  const profile = await getProfile()
  if (!profile) {
    return <div className="p-4">Setting up your store…</div>
  }

  const store = profile.stores
  // Only OWNER/ADMIN can reach /admin/*; linking a CASHIER there just
  // bounces them back here via the admin guard, so hide it for them.
  const isAdmin = profile.role === "OWNER" || profile.role === "ADMIN"
  const billing = getBillingState(store)
  const regionCode = regionCodeFor(store.country as string | null)
  const region = regionFor(store.country as string | null)
  const { daysRemaining, isActive, inGrace, isTrialing } = billing

  const heading = isActive
    ? isTrialing
      ? `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left in your free trial`
      : "Your subscription is active"
    : "Your subscription has ended"

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-6 p-4 py-10">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{heading}</h1>
          {!isActive && <Badge variant="destructive">Ended</Badge>}
          {inGrace && <Badge variant="outline">Grace period</Badge>}
        </div>

        {isActive ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {inGrace ? (
              <>
                Your access ran out on{" "}
                {billing.paidUntil?.toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                . The till keeps working for {GRACE_DAYS} days while your payment reaches
                us — get in touch if you&apos;ve already sent it.
              </>
            ) : (
              <>
                {isTrialing ? "Your trial runs" : "Paid"} until{" "}
                {billing.paidUntil?.toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                .
              </>
            )}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            The till can&apos;t ring up new sales for now. Your products, sales history and
            everyone&apos;s pay-later balances are all still here and still readable — nothing
            has been deleted, and recording a customer settling their tab still works.
          </p>
        )}
      </div>

      <div className="rounded-lg border p-6">
        <div className="text-sm font-medium">
          {region.monthlyAvailable ? "Keep going from" : "Keep going for"}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold">
            {formatMoney(region.annual, region.currency)}
          </span>
          <span className="text-sm text-muted-foreground">/ year</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatMoney(Math.round(region.annual / 12), region.currency)} a month, paid
          yearly — two months free.
          {region.monthlyAvailable && (
            <>
              {" "}
              Or {formatMoney(region.monthly, region.currency)} a month if you&apos;d rather
              pay as you go.
            </>
          )}
        </p>

        <div className="mt-5 border-t pt-4">
          <div className="text-sm font-medium">How to pay</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {PAYMENT_METHODS[regionCode] ?? PAYMENT_METHODS.DEFAULT}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:text-primary/80">
              {SUPPORT_EMAIL}
            </a>{" "}
            with your store name ({store.name as string}) and we&apos;ll send an invoice and
            switch your access back on as soon as it clears.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {isAdmin && (
          <Link
            href="/admin/sales"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            View sales and balances
          </Link>
        )}
        {isActive && (
          <Link href="/sell" className={cn(buttonVariants(), "w-full")}>
            Back to the till
          </Link>
        )}
        <div className="flex justify-center pt-2">
          <SignOutButton />
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Every new store gets {TRIAL_DAYS} days free. See{" "}
        <Link href="/terms" className="hover:text-foreground">
          Terms &amp; Privacy
        </Link>{" "}
        for billing and cancellation.
      </p>
    </div>
  )
}
