import { getCategories } from "@/lib/dal/products"
import { ProductForm } from "@/components/product-form"

export default async function NewProductPage() {
  const categories = await getCategories()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Add product</h1>
      <ProductForm mode="create" categories={categories} />
    </div>
  )
}
