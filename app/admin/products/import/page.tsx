import { requireAdmin } from "@/lib/dal"
import { ProductImport } from "@/components/product-import"

export default async function ImportProductsPage() {
  await requireAdmin()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Import products</h1>
        <p className="text-sm text-muted-foreground">
          Add a whole catalogue at once from a CSV file.
        </p>
      </div>
      <ProductImport />
    </div>
  )
}
