"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { productArchive } from "@/app/actions/products"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"

export function ProductArchiveDialog({
  open,
  onOpenChange,
  productId,
  productName,
  saleCount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productName: string
  saleCount: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function runArchive() {
    startTransition(async () => {
      const result = await productArchive(productId)
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not archive the product.", type: "error" })
        return
      }
      toast.add({ title: "Product hidden from the till", type: "success" })
      onOpenChange(false)
      router.push("/admin/products")
    })
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Archive ${productName}?`}
      description={`It appears in ${saleCount} past sales. Archiving removes it from the till; those receipts keep their line and price.`}
      footer={
        <div className="flex w-full flex-col gap-2">
          <Button
            type="button"
            variant="default"
            disabled={isPending}
            className="gap-1.5"
            onClick={runArchive}
          >
            {isPending && <Spinner className="size-3.5" />}
            Archive product
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      }
    />
  )
}
