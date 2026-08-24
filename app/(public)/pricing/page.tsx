import type { Metadata } from "next"
import { headers } from "next/headers"

import { PricingTable } from "@/components/pricing-table"
import { regionCodeFor } from "@/lib/billing"

export const metadata: Metadata = {
  title: "Pricing — Counter",
  description:
    "The till is free forever. Upgrade to Premium for the pay-later book, billed yearly or monthly.",
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
          The till is free. Forever.
        </h1>
        <p className="mt-3 text-base text-muted-foreground text-balance">
          Scan and sell, manage your catalogue, and keep your sales history at no cost —
          no trial clock, no card. Upgrade to Premium whenever the pay-later book earns
          its keep, for less than the notebook it replaces.
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
            Your store drops to the Free plan — the till keeps ringing up sales forever,
            and your sales history and everyone&apos;s balances stay readable. The only
            thing that pauses is starting <em>new</em> pay-later tabs; existing ones can
            still be settled. Upgrade any time to pick the book back up.
          </p>
        </div>
        <div>
          <div className="text-sm font-medium">Do I need a card to start?</div>
          <p className="mt-1 text-sm text-muted-foreground">
            No. Nothing is charged during the trial and we don&apos;t ask for card details
            up front — and the Free plan never asks for one at all.
          </p>
        </div>
        <div>
          <div className="text-sm font-medium">Is there a contract?</div>
          <p className="mt-1 text-sm text-muted-foreground">
            No lock-in. Yearly plans are paid up front; monthly plans can be stopped at
            the end of any month, and you keep the Free plan either way.
          </p>
        </div>
      </div>
    </div>
  )
}
