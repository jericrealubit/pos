"use client"

import { useRouter } from "next/navigation"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { UsersIcon } from "lucide-react"

import { DataList } from "@/components/data-list"
import { CustomerCard } from "@/components/customer-card"
import { EmptyState } from "@/components/empty-state"
import { formatMoney } from "@/lib/money"
import type { CustomerBalance } from "@/app/actions/customers"

export function CustomersDataList({
  customers,
  currency,
}: {
  customers: CustomerBalance[]
  currency: string
}) {
  const router = useRouter()

  const columns: LegacyColumnDef<CustomerBalance>[] = [
    {
      id: "name",
      accessorFn: (c) => c.name,
      header: "Customer",
      cell: ({ row }) => row.original.name,
    },
    {
      id: "phone",
      accessorFn: (c) => c.phone ?? "",
      header: "Phone",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      id: "unpaid_sales",
      accessorFn: (c) => c.unpaid_sales,
      header: "Items",
      cell: ({ row }) => row.original.unpaid_sales,
    },
    {
      id: "balance",
      accessorFn: (c) => c.balance_cents,
      header: "Owed",
      cell: ({ row }) => formatMoney(row.original.balance_cents, currency),
    },
    {
      id: "oldest_unpaid",
      accessorFn: (c) => c.oldest_unpaid ?? "",
      header: "Oldest",
      cell: ({ row }) =>
        row.original.oldest_unpaid
          ? new Date(row.original.oldest_unpaid).toLocaleDateString("en-US")
          : "—",
    },
  ]

  return (
    <DataList
      columns={columns}
      data={customers}
      searchKeys={["name", "phone"]}
      getRowId={(c) => c.id}
      onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
      renderCard={(c) => (
        <CustomerCard
          key={c.id}
          customer={c}
          currency={currency}
          onClick={() => router.push(`/admin/customers/${c.id}`)}
        />
      )}
      emptyState={
        <EmptyState
          icon={UsersIcon}
          title="No customers yet"
          description="Customers are added from the till during a Pay Later sale."
        />
      }
    />
  )
}
