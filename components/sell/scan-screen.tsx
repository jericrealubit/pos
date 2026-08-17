"use client"

import { useRouter } from "next/navigation"

import { useSellCart } from "@/components/sell/sell-provider"
import { TillAppBar } from "@/components/sell/till-app-bar"
import { CameraScanner } from "@/components/sell/camera-scanner"
import { ManualBarcodeEntry } from "@/components/sell/manual-barcode-entry"
import { CartLines } from "@/components/sell/cart-lines"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"

export function ScanScreen() {
  const router = useRouter()
  const { lines, itemCount, totalCents, currency, onBarcode, justAddedProductId, setQuantity } =
    useSellCart()

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 md:pb-4">
      <TillAppBar
        backHref="/sell"
        title="Scanning"
        right={`${itemCount} item${itemCount === 1 ? "" : "s"}`}
      />

      <div className="md:grid md:grid-cols-[1fr_320px] md:items-start md:gap-6">
        <div className="md:max-w-sm">
          <CameraScanner onDetect={onBarcode} />
          <ManualBarcodeEntry onSubmit={onBarcode} />
        </div>

        <div className="md:sticky md:top-4">
          <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            In this sale
          </div>
          <CartLines
            lines={lines}
            currency={currency}
            editable
            justAddedProductId={justAddedProductId}
            onQuantityChange={setQuantity}
          />
          <Button
            type="button"
            size="till"
            className="mt-4 hidden w-full md:flex"
            disabled={lines.length === 0}
            onClick={() => router.push("/sell/cart")}
          >
            Done — {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
            {formatMoney(totalCents, currency)}
          </Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
        <Button
          type="button"
          size="till"
          className="w-full"
          disabled={lines.length === 0}
          onClick={() => router.push("/sell/cart")}
        >
          Done — {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
          {formatMoney(totalCents, currency)}
        </Button>
      </div>
    </div>
  )
}
