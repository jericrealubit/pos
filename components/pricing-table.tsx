"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckIcon } from "lucide-react"

import {
  PRICED_REGIONS,
  REGIONS,
  REGION_LABELS,
  TRIAL_DAYS,
  type RegionCode,
} from "@/lib/billing"
import { formatMoney } from "@/lib/money"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

const INCLUDED = [
  "Scan and sell from a phone, tablet or barcode reader",
  "The pay-later book — itemised customer balances",
  "Products, categories and stock levels",
  "Sales history and receipts",
  "Unlimited products, customers and sales",
]

export function PricingTable({ initialRegion }: { initialRegion: RegionCode }) {
  const [regionCode, setRegionCode] = useState<RegionCode>(initialRegion)
  const region = REGIONS[regionCode]
  const perMonthOnAnnual = Math.round(region.annual / 12)

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRICED_REGIONS.map((code) => (
          <Button
            key={code}
            type="button"
            size="sm"
            variant={code === regionCode ? "default" : "outline"}
            onClick={() => setRegionCode(code)}
          >
            {REGION_LABELS[code]}
          </Button>
        ))}
      </div>

      <div
        className={cn(
          "grid w-full max-w-3xl gap-4",
          region.monthlyAvailable ? "sm:grid-cols-2" : "sm:max-w-md"
        )}
      >
        {/* Annual leads everywhere: it is the better deal for the shop and
            the only price that survives per-transaction fees on the
            cheaper tiers. */}
        <div className="relative flex flex-col rounded-lg border-2 border-primary p-6">
          <Badge className="absolute -top-2.5 left-6">Best value</Badge>
          <div className="text-sm font-medium">Yearly</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold">
              {formatMoney(region.annual, region.currency)}
            </span>
            <span className="text-sm text-muted-foreground">/ year</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Works out to {formatMoney(perMonthOnAnnual, region.currency)} a month — two
            months free.
          </p>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full gap-1.5")}
          >
            Start {TRIAL_DAYS} days free
            <LinkPendingIndicator />
          </Link>
        </div>

        {region.monthlyAvailable && (
          <div className="flex flex-col rounded-lg border p-6">
            <div className="text-sm font-medium">Monthly</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold">
                {formatMoney(region.monthly, region.currency)}
              </span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pay as you go. Cancel whenever you like.
            </p>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "mt-6 w-full gap-1.5"
              )}
            >
              Start {TRIAL_DAYS} days free
              <LinkPendingIndicator />
            </Link>
          </div>
        )}
      </div>

      {!region.monthlyAvailable && (
        <p className="max-w-md text-center text-xs text-muted-foreground">
          Counter is sold yearly in the Philippines. At{" "}
          {formatMoney(perMonthOnAnnual, region.currency)} a month it works out cheaper
          than paying monthly anywhere else, and card fees on small monthly payments
          would cost more than the software.
        </p>
      )}

      <div className="w-full max-w-md rounded-lg border p-6">
        <div className="text-sm font-medium">Every plan includes</div>
        <ul className="mt-3 flex flex-col gap-2">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          One price per store. {TRIAL_DAYS} days free to start — no card needed, and
          nothing is charged until you decide to keep going.
        </p>
      </div>
    </div>
  )
}
