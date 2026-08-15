import { notFound } from "next/navigation"

import { getProduct, getCategories, getProductSaleCount } from "@/lib/dal/products"
import { ProductForm } from "@/components/product-form"

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params
  const [product, categories] = await Promise.all([getProduct(id), getCategories()])
  if (!product) notFound()
  const saleCount = await getProductSaleCount(id)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{product.name}</h1>
      <ProductForm mode="edit" product={product} categories={categories} saleCount={saleCount} />
    </div>
  )
}
