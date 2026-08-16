"use client"

import { useRouter } from "next/navigation"

import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"

export function UnknownBarcodeDialog({
  barcode,
  canManageProducts,
  onOpenChange,
}: {
  barcode: string | null
  canManageProducts: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()

  return (
    <ResponsiveDialog
      open={barcode != null}
      onOpenChange={onOpenChange}
      title="Not in your products"
      description={
        canManageProducts
          ? `“${barcode}” isn't in the catalogue yet. Add it now?`
          : `“${barcode}” isn't in the catalogue yet. Ask an admin to add it.`
      }
      footer={
        <div className="flex w-full flex-col gap-2">
          {canManageProducts && (
            <Button
              type="button"
              size="till"
              onClick={() => {
                onOpenChange(false)
                router.push(`/admin/products/new?barcode=${encodeURIComponent(barcode ?? "")}`)
              }}
            >
              Add this product
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="till"
            onClick={() => onOpenChange(false)}
          >
            {canManageProducts ? "Cancel" : "OK"}
          </Button>
        </div>
      }
    />
  )
}
