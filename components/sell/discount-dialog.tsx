"use client"

import { useState } from "react"
import { TicketPercentIcon } from "lucide-react"

import { formatMoney, dollarsToCents, centsToDollars } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { cn } from "@/lib/utils"

type Mode = "amount" | "percent"

/**
 * Resolves a $/% entry to cents against the cart's own known total. This is
 * a UI convenience, not the authoritative money math — create_sale still
 * validates the resulting discount can't exceed the server-computed
 * subtotal, the same way it never trusts client-sent prices.
 */
function resolveDiscountCents(mode: Mode, value: string, totalCents: number): number {
  if (!value.trim()) return 0
  if (mode === "percent") {
    const pct = Number(value)
    if (!Number.isFinite(pct) || pct <= 0) return 0
    return Math.round((totalCents * Math.min(pct, 100)) / 100)
  }
  const cents = dollarsToCents(value)
  return Number.isFinite(cents) ? cents : 0
}

export function DiscountDialog({
  open,
  onOpenChange,
  totalCents,
  currency,
  discountCents,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalCents: number
  currency: string
  discountCents: number
  onApply: (discountCents: number) => void
}) {
  const [mode, setMode] = useState<Mode>("amount")
  const [value, setValue] = useState(() => (discountCents > 0 ? centsToDollars(discountCents) : ""))

  const previewCents = Math.min(resolveDiscountCents(mode, value, totalCents), totalCents)

  function submit() {
    onApply(previewCents)
    onOpenChange(false)
  }

  function clear() {
    setValue("")
    onApply(0)
    onOpenChange(false)
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a discount"
      description={`Sale total before discount: ${formatMoney(totalCents, currency)}`}
      footer={
        <div className="flex w-full flex-col gap-2">
          <Button type="button" size="till" className="gap-1.5" onClick={submit}>
            <TicketPercentIcon />
            Apply {previewCents > 0 ? `− ${formatMoney(previewCents, currency)}` : "discount"}
          </Button>
          {discountCents > 0 && (
            <Button type="button" variant="outline" onClick={clear}>
              Remove discount
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "amount" ? "default" : "outline"}
            onClick={() => setMode("amount")}
          >
            $ Amount
          </Button>
          <Button
            type="button"
            variant={mode === "percent" ? "default" : "outline"}
            onClick={() => setMode("percent")}
          >
            % Off
          </Button>
        </div>
        <Input
          type="text"
          inputMode="decimal"
          placeholder={mode === "amount" ? "5.00" : "10"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <p className={cn("text-sm text-muted-foreground", previewCents === 0 && "invisible")}>
          Discount: {formatMoney(previewCents, currency)}
        </p>
      </div>
    </ResponsiveDialog>
  )
}
