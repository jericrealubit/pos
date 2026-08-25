"use client"

import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { PackageSearchIcon } from "lucide-react"

import { DataList } from "@/components/data-list"
import { EmptyState } from "@/components/empty-state"
import { formatMoney } from "@/lib/money"

type VelocityRow = {
  product_id: string
  name: string
  quantity_sold: number
  revenue_cents: number
  stock_quantity: number
}

export function InventoryVelocityTable({
  data,
  currency,
}: {
  data: VelocityRow[]
  currency: string
}) {
  const columns: LegacyColumnDef<VelocityRow>[] = [
    {
      id: "name",
      accessorFn: (p) => p.name,
      header: "Product",
      cell: ({ row }) => row.original.name,
    },
    {
      id: "quantity_sold",
      accessorFn: (p) => p.quantity_sold,
      header: "Sold",
      cell: ({ row }) =>
        row.original.quantity_sold === 0 ? (
          <span className="text-destructive">0</span>
        ) : (
          row.original.quantity_sold
        ),
    },
    {
      id: "revenue_cents",
      accessorFn: (p) => p.revenue_cents,
      header: "Revenue",
      cell: ({ row }) => formatMoney(row.original.revenue_cents, currency),
    },
    {
      id: "stock_quantity",
      accessorFn: (p) => p.stock_quantity,
      header: "In stock",
      cell: ({ row }) => row.original.stock_quantity,
    },
  ]

  return (
    <DataList
      columns={columns}
      data={data}
      searchKeys={["name"]}
      getRowId={(p) => p.product_id}
      renderCard={(p) => (
        <div key={p.product_id} className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="min-w-0 truncate font-medium">{p.name}</span>
            <span className={p.quantity_sold === 0 ? "text-destructive" : ""}>
              {p.quantity_sold} sold
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{p.stock_quantity} in stock</span>
            <span className="font-medium text-foreground tabular-nums">
              {formatMoney(p.revenue_cents, currency)}
            </span>
          </div>
        </div>
      )}
      emptyState={
        <EmptyState icon={PackageSearchIcon} title="No products to show" />
      }
    />
  )
}
