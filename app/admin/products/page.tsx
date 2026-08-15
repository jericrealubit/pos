import Link from "next/link"

import { getProducts, getCategories } from "@/lib/dal/products"
import { getProfile } from "@/lib/dal"
import { ProductsDataList } from "@/components/products-data-list"
import { Button } from "@/components/ui/button"

export default async function ProductsPage() {
  const [products, categories, profile] = await Promise.all([
    getProducts(),
    getCategories(),
    getProfile(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Products</h1>
        <Button
          className="ml-auto"
          nativeButton={false}
          render={<Link href="/admin/products/new" />}
        >
          + Add product
        </Button>
      </div>
      <ProductsDataList
        products={products}
        categories={categories}
        currency={profile!.stores.currency}
      />
    </div>
  )
}
