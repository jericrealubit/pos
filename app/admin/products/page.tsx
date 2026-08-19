import Link from "next/link"
import { PackagePlusIcon } from "lucide-react"

import { getProducts, getCategories } from "@/lib/dal/products"
import { getProfile } from "@/lib/dal"
import { ProductsDataList } from "@/components/products-data-list"
import { Button } from "@/components/ui/button"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

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
          size="till"
          className="ml-auto gap-1.5"
          nativeButton={false}
          render={<Link href="/admin/products/new" />}
        >
          <PackagePlusIcon />
          Add product
          <LinkPendingIndicator />
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
