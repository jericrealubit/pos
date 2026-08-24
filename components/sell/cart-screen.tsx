"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleCheckIcon, ScanLineIcon, ShoppingCartIcon } from "lucide-react"

import { useSellCart } from "@/components/sell/sell-provider"
import { TillAppBar } from "@/components/sell/till-app-bar"
import { CartLines } from "@/components/sell/cart-lines"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { EmptyState } from "@/components/empty-state"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"
import { formatMoney } from "@/lib/money"
import { createSale } from "@/app/actions/sales"

export function CartScreen() {
  const router = useRouter()
  const { lines, itemCount, totalCents, currency, clear, canUsePayLater } = useSellCart()
  const [isPending, startTransition] = useTransition()
  // clear() empties the cart synchronously, re-rendering this screen while
  // the router.push navigation is still in flight — this flag stops that
  // re-render from hitting the "cart is empty" fallback below.
  const leavingRef = useRef(false)

  function handleComplete() {
    startTransition(async () => {
      const result = await createSale({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      })
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not complete the sale.", type: "error" })
        return
      }
      leavingRef.current = true
      clear()
      router.push(`/sell/done/${result.data.saleId}`)
    })
  }

  if (leavingRef.current) {
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

      <CartLines lines={lines} currency={currency} editable={false} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
        <span>{formatMoney(totalCents, currency)}</span>
      </div>
      <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
        <span>Total</span>
        <span>{formatMoney(totalCents, currency)}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="till"
        className="gap-1.5"
        onClick={() => router.push("/sell/scan")}
      >
        <ScanLineIcon />
        Scan another item
      </Button>

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

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md md:max-w-3xl">
          <Button
            type="button"
            size="till"
            className="w-full gap-1.5"
            loading={isPending}
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
