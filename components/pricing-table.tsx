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

// Free forever — the core till.
const FREE_INCLUDED = [
  "Scan and sell from a phone, tablet or barcode reader",
  "Unlimited products, categories and stock levels",
  "Cash and card sales, receipts and full sales history",
  "View and settle existing customer tabs",
]

// What Premium adds on top of Free. `soon` items are built but not shipped
// yet — shown so the value is visible, marked so nobody expects them today.
const PREMIUM_ADDS: { label: string; soon?: boolean }[] = [
  { label: "The pay-later book — put sales on a customer's tab with itemised running balances" },
  { label: "Staff accounts — invite ADMIN or CASHIER teammates to your store" },
  { label: "Advanced sales reporting — revenue trends, top products, CSV export" },
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

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-lg border p-6">
          <div className="text-sm font-medium">Free</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold">
              {formatMoney(0, region.currency)}
            </span>
            <span className="text-sm text-muted-foreground">/ forever</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            The whole till, free for as long as you use it. No card, no trial clock.
          </p>
          <ul className="mt-5 flex flex-col gap-2">
            {FREE_INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "mt-6 w-full gap-1.5"
            )}
          >
            Start free
            <LinkPendingIndicator />
          </Link>
        </div>

        {/* Premium */}
        <div className="relative flex flex-col rounded-lg border-2 border-primary p-6">
          <Badge className="absolute -top-2.5 left-6">Best value</Badge>
          <div className="text-sm font-medium">Premium</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold">
              {formatMoney(region.annual, region.currency)}
            </span>
            <span className="text-sm text-muted-foreground">/ year</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Works out to {formatMoney(perMonthOnAnnual, region.currency)} a month — two
            months free.
            {region.monthlyAvailable && (
              <>
                {" "}
                Or {formatMoney(region.monthly, region.currency)} a month, paid as you go.
              </>
            )}
          </p>
          <ul className="mt-5 flex flex-col gap-2">
            <li className="flex items-start gap-2 text-sm font-medium">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              Everything in Free, plus:
            </li>
            {PREMIUM_ADDS.map((item) => (
              <li
                key={item.label}
                className="flex items-start gap-2 pl-6 text-sm text-muted-foreground"
              >
                <span className="flex-1">{item.label}</span>
                {item.soon && (
                  <Badge variant="secondary" className="shrink-0">
                    Coming soon
                  </Badge>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full gap-1.5")}
          >
            Start {TRIAL_DAYS} days free
            <LinkPendingIndicator />
          </Link>
        </div>
      </div>

      {!region.monthlyAvailable && (
        <p className="max-w-md text-center text-xs text-muted-foreground">
          Premium is sold yearly in the Philippines. At{" "}
          {formatMoney(perMonthOnAnnual, region.currency)} a month it works out cheaper
          than paying monthly anywhere else, and card fees on small monthly payments
          would cost more than the software.
        </p>
      )}

      <p className="max-w-md text-center text-xs text-muted-foreground">
        Every new store starts with {TRIAL_DAYS} days of Premium free — no card needed.
        When the trial ends you keep the Free plan and the till forever; upgrade whenever
        the pay-later book earns its keep.
      </p>
    </div>
  )
}
