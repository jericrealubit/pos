"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArchiveIcon,
  CircleCheckIcon,
  CreditCardIcon,
  ScanLineIcon,
  ShoppingCartIcon,
  TicketPercentIcon,
  WalletIcon,
} from "lucide-react"

import { useSellCart } from "@/components/sell/sell-provider"
import { TillAppBar } from "@/components/sell/till-app-bar"
import { CartLines } from "@/components/sell/cart-lines"
import { DiscountDialog } from "@/components/sell/discount-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"
import { formatMoney, dollarsToCents, centsToDollars } from "@/lib/money"
import { createSale } from "@/app/actions/sales"
import { cn } from "@/lib/utils"

type TenderType = "CASH" | "CARD" | "EWALLET"

const TENDER_OPTIONS: { value: TenderType; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "EWALLET", label: "E-wallet" },
]

export function CartScreen() {
  const router = useRouter()
  const {
    lines,
    itemCount,
    totalCents,
    currency,
    clear,
    canUsePayLater,
    setQuantity,
    removeLine,
    holdCurrentCart,
  } = useSellCart()
  const [isPending, startTransition] = useTransition()
  // clear() empties the cart synchronously, re-rendering this screen while
  // the router.push navigation is still in flight — this flag stops that
  // re-render from hitting the "cart is empty" fallback below. State (not a
  // ref) because it's read during render, and setIsLeaving(true)/clear()
  // batch into the same render either way.
  const [isLeaving, setIsLeaving] = useState(false)

  // Discount and tender only ever apply to the Paid path completed right
  // here — the Pay-later flow completes from a separate screen
  // (customer-screen.tsx) with its own createSale call, so this state
  // deliberately isn't lifted to SellProvider.
  const [discountCents, setDiscountCents] = useState(0)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [tenderType, setTenderType] = useState<TenderType>("CASH")
  const [tendered, setTendered] = useState("")

  const finalTotalCents = totalCents - discountCents
  const tenderedCents = tenderType === "CASH" && tendered.trim() ? dollarsToCents(tendered) : null
  const changeCents = tenderedCents !== null ? tenderedCents - finalTotalCents : null
  const tenderedTooLow = changeCents !== null && changeCents < 0

  function handleComplete() {
    startTransition(async () => {
      const result = await createSale({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        discount: discountCents > 0 ? centsToDollars(discountCents) : undefined,
        tenderType,
        tendered: tenderType === "CASH" && tendered.trim() ? tendered : undefined,
      })
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not complete the sale.", type: "error" })
        return
      }
      setIsLeaving(true)
      clear()
      router.push(`/sell/done/${result.data.saleId}`)
    })
  }

  if (isLeaving) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="size-5" />
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <TillAppBar backHref="/sell/scan" title="Sale summary" />
        <EmptyState
          icon={ShoppingCartIcon}
          title="Your cart is empty"
          action={
            <Button
              type="button"
              size="till"
              className="gap-1.5"
              onClick={() => router.push("/sell/scan")}
            >
              <ScanLineIcon />
              Scan an item
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <TillAppBar backHref="/sell/scan" title="Sale summary" />

      <CartLines
        lines={lines}
        currency={currency}
        editable
        subtitle="priceAndQty"
        onQuantityChange={setQuantity}
        onRemove={removeLine}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
        <span>{formatMoney(totalCents, currency)}</span>
      </div>

      {discountCents > 0 ? (
        <button
          type="button"
          onClick={() => setDiscountOpen(true)}
          className="flex items-center justify-between text-sm text-primary"
        >
          <span className="flex items-center gap-1.5">
            <TicketPercentIcon className="size-4" />
            Discount
          </span>
          <span>− {formatMoney(discountCents, currency)}</span>
        </button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 text-muted-foreground"
          onClick={() => setDiscountOpen(true)}
        >
          <TicketPercentIcon />
          Add discount
        </Button>
      )}

      <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
        <span>Total</span>
        <span>{formatMoney(finalTotalCents, currency)}</span>
      </div>

      <DiscountDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        totalCents={totalCents}
        currency={currency}
        discountCents={discountCents}
        onApply={setDiscountCents}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="till"
          className="gap-1.5"
          onClick={() => router.push("/sell/scan")}
        >
          <ScanLineIcon />
          Scan more
        </Button>
        <Button
          type="button"
          variant="outline"
          size="till"
          className="gap-1.5"
          onClick={() => {
            if (holdCurrentCart()) {
              router.push("/sell")
            } else {
              toast.add({
                title: "Held sales are full",
                description: "Resume or discard one from Held sales first.",
                type: "warning",
              })
            }
          }}
        >
          <ArchiveIcon />
          Hold
        </Button>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          How is this being settled?
        </div>
        <RadioGroup
          value="PAID"
          onValueChange={(value) => {
            if (value !== "UNPAID") return
            // On the Free tier the pay-later book is locked — send them to the
            // upgrade page instead of into the customer flow.
            router.push(canUsePayLater ? "/sell/customer" : "/billing")
          }}
          className="overflow-hidden rounded-lg border"
        >
          <label className="flex items-center gap-3 p-3 text-sm">
            <RadioGroupItem value="PAID" />
            <span className="flex-1">Paid</span>
            <span className="text-xs text-muted-foreground">Cash or card now</span>
          </label>
          <label className="flex items-center gap-3 border-t p-3 text-sm">
            <RadioGroupItem value="UNPAID" />
            <span className="flex flex-1 items-center gap-2">
              Pay later
              {!canUsePayLater && <Badge variant="secondary">Premium</Badge>}
            </span>
            <span className="text-xs text-muted-foreground">
              {canUsePayLater ? "Goes in the book" : "Upgrade to use the book"}
            </span>
          </label>
        </RadioGroup>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          How are they paying?
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TENDER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="till"
              variant={tenderType === option.value ? "default" : "outline"}
              className="gap-1.5"
              onClick={() => setTenderType(option.value)}
            >
              {option.value === "CASH" ? <WalletIcon /> : <CreditCardIcon />}
              {option.label}
            </Button>
          ))}
        </div>

        {tenderType === "CASH" && (
          <div className="mt-3 flex flex-col gap-1.5">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Amount tendered (optional)"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              className="h-11 text-base"
            />
            {changeCents !== null && (
              <p
                className={cn(
                  "text-sm",
                  tenderedTooLow ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {tenderedTooLow
                  ? "Amount tendered is less than the total due."
                  : `Change: ${formatMoney(changeCents, currency)}`}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md md:max-w-3xl">
          <Button
            type="button"
            size="till"
            className="w-full gap-1.5"
            loading={isPending}
            disabled={tenderedTooLow}
            onClick={handleComplete}
          >
            {!isPending && <CircleCheckIcon />}
            {isPending ? "Completing…" : "Complete sale"}
          </Button>
        </div>
      </div>
    </div>
  )
}
