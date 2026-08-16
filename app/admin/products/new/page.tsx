import { getCategories } from "@/lib/dal/products"
import { ProductForm } from "@/components/product-form"

export default async function NewProductPage({
  searchParams,
}: PageProps<"/admin/products/new">) {
  const [categories, params] = await Promise.all([getCategories(), searchParams])
  const defaultBarcode = typeof params.barcode === "string" ? params.barcode : undefined

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Add product</h1>
      <ProductForm mode="create" categories={categories} defaultBarcode={defaultBarcode} />
    </div>
  )
}
