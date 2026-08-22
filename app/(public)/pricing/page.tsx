import type { Metadata } from "next"
import { headers } from "next/headers"

import { PricingTable } from "@/components/pricing-table"
import { regionCodeFor, TRIAL_DAYS } from "@/lib/billing"

export const metadata: Metadata = {
  title: "Pricing — Counter",
  description:
    "One price per store, billed yearly or monthly. Ninety days free to start — no card needed.",
}

export default async function PricingPage() {
  // Cloudflare sets CF-IPCountry at the edge; it only picks which column
  // opens first, and the switcher stays available for anyone on a VPN or
  // setting up a store in another country.
  const detected = (await headers()).get("CF-IPCountry")

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-10 py-8">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-semibold text-balance">
          {TRIAL_DAYS} days free, then a few dollars a month.
        </h1>
        <p className="mt-3 text-base text-muted-foreground text-balance">
          Counter costs less than the notebook it replaces. One price covers the whole
          store — the till, the pay-later book, and the admin dashboard.
        </p>
      </div>

      <PricingTable initialRegion={regionCodeFor(detected)} />

      <div className="w-full max-w-md rounded-lg border p-6 text-left">
        <div className="text-sm font-medium">Want your products loaded for you?</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Typing a catalogue in by hand is the slowest part of getting started. Send us
          your product list and we&apos;ll import it — names, prices, barcodes and
          categories — so your first scan works on day one. Ask us for a quote.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4 text-left">
        <div>
          <div className="text-sm font-medium">What happens after the free trial?</div>
          <p className="mt-1 text-sm text-muted-foreground">
            We get in touch before it ends. If you decide not to continue, the till stops
            ringing up new sales — but your sales history and everyone&apos;s balances stay
            readable and exportable. We don&apos;t hold your book hostage.
          </p>
        </div>
        <div>
          <div className="text-sm font-medium">Do I need a card to start?</div>
          <p className="mt-1 text-sm text-muted-foreground">
            No. Nothing is charged during the trial and we don&apos;t ask for card details
            up front.
          </p>
        </div>
        <div>
          <div className="text-sm font-medium">Is there a contract?</div>
          <p className="mt-1 text-sm text-muted-foreground">
            No lock-in. Yearly plans are paid up front; monthly plans can be stopped at
            the end of any month.
          </p>
        </div>
      </div>
    </div>
  )
}
