"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MailIcon } from "lucide-react"

import { emailReceipt } from "@/app/actions/receipts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { toast } from "@/components/ui/toast"

export function EmailReceiptButton({ saleId, isPremium }: { saleId: string; isPremium: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    setFormError(null)
    startTransition(async () => {
      const result = await emailReceipt(saleId, { email })
      if (!result.ok) {
        setFormError(
          result.formError ?? result.fieldErrors?.email?.[0] ?? "Could not send the receipt."
        )
        return
      }
      toast.add({ title: `Receipt emailed to ${email}`, type: "success" })
      setEmail("")
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="till"
        className="gap-1.5"
        // On the Free tier, tapping this is the upsell moment — send them to
        // /billing instead of opening a dialog they can't use, same pattern
        // as the Pay-later radio on the cart screen.
        onClick={() => (isPremium ? setOpen(true) : router.push("/billing"))}
      >
        <MailIcon />
        Email receipt
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setFormError(null)
        }}
        title="Email receipt"
        description="Send an itemized PDF receipt to this email address."
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button
              type="button"
              size="till"
              loading={isPending}
              className="gap-1.5"
              onClick={submit}
            >
              {!isPending && <MailIcon />}
              Send receipt
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
          type="email"
          placeholder="customer@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
