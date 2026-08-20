"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { WalletIcon } from "lucide-react"

import { recordPayment } from "@/app/actions/payments"
import { formatMoney, centsToDollars } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { toast } from "@/components/ui/toast"

export function RecordPaymentButton({
  customerId,
  balanceCents,
  currency,
}: {
  customerId: string
  balanceCents: number
  currency: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(() => centsToDollars(balanceCents))
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (balanceCents <= 0) return null

  function submit() {
    setFormError(null)
    startTransition(async () => {
      const result = await recordPayment({ customerId, amount })
      if (!result.ok) {
        setFormError(
          result.formError ?? result.fieldErrors?.amount?.[0] ?? "Could not record the payment."
        )
        return
      }

      toast.add({
        title:
          result.data.settledCount > 0
            ? `Payment recorded — ${result.data.settledCount} sale${result.data.settledCount === 1 ? "" : "s"} marked as settled`
            : "Payment recorded",
        type: "success",
      })
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button type="button" variant="outline" size="till" className="gap-1.5" onClick={() => setOpen(true)}>
        <WalletIcon />
        Record a payment
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setFormError(null)
        }}
        title="Record a payment"
        description={`Current balance: ${formatMoney(balanceCents, currency)}`}
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button type="button" size="till" loading={isPending} className="gap-1.5" onClick={submit}>
              {!isPending && <WalletIcon />}
              Record payment
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        }
      >
        <Input
          type="text"
          inputMode="decimal"
          placeholder="4.20"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
        {formError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {formError}
          </p>
        )}
      </ResponsiveDialog>
    </>
  )
}
