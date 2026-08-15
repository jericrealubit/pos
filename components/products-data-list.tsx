"use client"

import { useRouter } from "next/navigation"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { DataList } from "@/components/data-list"
import { ProductCard } from "@/components/product-card"
import { formatMoney } from "@/lib/money"

type ProductRow = {
  id: string
  name: string
  size: string | null
  price_cents: number
  barcode: string
  categories: { id: string; name: string } | null
}

export function ProductsDataList({
  products,
  categories,
  currency,
}: {
  products: ProductRow[]
  categories: { id: string; name: string }[]
  currency: string
}) {
  const router = useRouter()

  const columns: LegacyColumnDef<ProductRow>[] = [
    {
      id: "name",
      accessorFn: (p) => p.name,
      header: "Product",
      cell: ({ row }) => row.original.name,
    },
    {
      id: "category",
      accessorFn: (p) => p.categories?.name ?? "",
      header: "Category",
      cell: ({ row }) => row.original.categories?.name ?? "—",
    },
    {
      id: "size",
      accessorFn: (p) => p.size ?? "",
      header: "Size",
      cell: ({ row }) => row.original.size ?? "—",
    },
    {
      id: "price",
      accessorFn: (p) => p.price_cents,
      header: "Price",
      cell: ({ row }) => formatMoney(row.original.price_cents, currency),
    },
    {
      id: "barcode",
      accessorFn: (p) => p.barcode,
      header: "Barcode",
      cell: ({ row }) => row.original.barcode,
    },
  ]

  return (
    <DataList
      columns={columns}
      data={products}
      searchKeys={["name", "barcode"]}
      filters={[
        {
          key: "categoryId",
          label: "Category",
          options: categories.map((c) => ({ label: c.name, value: c.id })),
          accessorFn: (p) => p.categories?.id ?? "",
        },
      ]}
      getRowId={(p) => p.id}
      onRowClick={(p) => router.push(`/admin/products/${p.id}`)}
      renderCard={(p) => (
        <ProductCard
          key={p.id}
          product={p}
          currency={currency}
          onClick={() => router.push(`/admin/products/${p.id}`)}
        />
      )}
      emptyState={
        <div className="p-8 text-center text-sm text-muted-foreground">
          No products yet. Add your first one.
        </div>
      }
    />
  )
}
