"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { useSellCart } from "@/components/sell/sell-provider"
import { TillAppBar } from "@/components/sell/till-app-bar"
import { CartLines } from "@/components/sell/cart-lines"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"
import { formatMoney } from "@/lib/money"
import { createSale } from "@/app/actions/sales"

export function CartScreen() {
  const router = useRouter()
  const { lines, itemCount, totalCents, currency, clear } = useSellCart()
  const [isPending, startTransition] = useTransition()

  function handleComplete() {
    startTransition(async () => {
      const result = await createSale({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      })
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not complete the sale.", type: "error" })
        return
      }
      clear()
      router.push(`/sell/done/${result.data.saleId}`)
    })
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <TillAppBar backHref="/sell/scan" title="Sale summary" />
        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
        <Button type="button" size="till" onClick={() => router.push("/sell/scan")}>
          Scan an item
        </Button>
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
        variant="ghost"
        size="till"
        onClick={() => router.push("/sell/scan")}
      >
        + Scan another item
      </Button>

      <div>
        <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          How is this being settled?
        </div>
        <RadioGroup
          value="PAID"
          onValueChange={(value) => {
            if (value === "UNPAID") router.push("/sell/customer")
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
            <span className="flex-1">Pay later</span>
            <span className="text-xs text-muted-foreground">Goes in the book</span>
          </label>
        </RadioGroup>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button
          type="button"
          size="till"
          className="w-full gap-1.5"
          disabled={isPending}
          onClick={handleComplete}
        >
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Completing…" : "Complete sale"}
        </Button>
      </div>
    </div>
  )
}
