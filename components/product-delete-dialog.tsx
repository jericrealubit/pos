"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { productArchive, productDelete } from "@/app/actions/products"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { toast } from "@/components/ui/toast"

export function ProductDeleteDialog({
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

  function runDelete() {
    startTransition(async () => {
      const result = await productDelete(productId)
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not delete the product.", type: "error" })
        return
      }
      toast.add({ title: "Product deleted", type: "success" })
      onOpenChange(false)
      router.push("/admin/products")
    })
  }

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
      title={`Delete ${productName}?`}
      description={`It appears in ${saleCount} past sales. Those receipts keep their line and price, but the product stops being scannable.`}
      footer={
        <div className="flex w-full flex-col gap-2">
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={runDelete}
          >
            Delete product
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={runArchive}
          >
            Keep it, hide from the till
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
