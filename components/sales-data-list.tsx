"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { ReceiptIcon } from "lucide-react"

import { DataList } from "@/components/data-list"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { EmptyState } from "@/components/empty-state"
import { formatMoney } from "@/lib/money"
import { SALES_RANGES, type SalesRange } from "@/lib/sales-date-range"

export type SaleRow = {
  id: string
  status: "PAID" | "UNPAID" | "SETTLED"
  subtotal_cents: number
  total_cents: number
  tender_type: "CASH" | "CARD" | "EWALLET"
  created_at: string
  customerName: string
  cashierName: string
  reference: string
  itemCount: number
}

const STATUS_LABEL: Record<SaleRow["status"], string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  SETTLED: "Settled",
}

const STATUS_VARIANT: Record<SaleRow["status"], "default" | "secondary" | "destructive"> = {
  PAID: "default",
  UNPAID: "destructive",
  SETTLED: "secondary",
}

const TENDER_LABEL: Record<SaleRow["tender_type"], string> = {
  CASH: "Cash",
  CARD: "Card",
  EWALLET: "E-wallet",
}

export function SalesDataList({
  sales,
  currency,
  range,
}: {
  sales: SaleRow[]
  currency: string
  range: SalesRange
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setRange(next: SalesRange) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "all") params.delete("range")
    else params.set("range", next)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  const columns: LegacyColumnDef<SaleRow>[] = [
    {
      id: "created_at",
      accessorFn: (s) => new Date(s.created_at).getTime(),
      header: "Date",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString("en-US"),
    },
    {
      id: "customerName",
      accessorFn: (s) => s.customerName,
      header: "Customer",
      cell: ({ row }) => row.original.customerName || "—",
    },
    {
      id: "cashierName",
      accessorFn: (s) => s.cashierName,
      header: "Cashier",
      cell: ({ row }) => row.original.cashierName || "—",
    },
    {
      id: "status",
      accessorFn: (s) => s.status,
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "itemCount",
      accessorFn: (s) => s.itemCount,
      header: "Items",
      cell: ({ row }) => row.original.itemCount,
    },
    {
      id: "tender_type",
      accessorFn: (s) => s.tender_type,
      header: "Tender",
      cell: ({ row }) =>
        row.original.status === "PAID" ? (
          <Badge variant="outline">{TENDER_LABEL[row.original.tender_type]}</Badge>
        ) : (
          "—"
        ),
    },
    {
      id: "total_cents",
      accessorFn: (s) => s.total_cents,
      header: "Total",
      cell: ({ row }) => formatMoney(row.original.total_cents, currency),
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <RadioGroup
        value={range}
        onValueChange={(value) => setRange(value as SalesRange)}
        className="grid w-fit grid-flow-col gap-1 rounded-lg border p-1"
      >
        {SALES_RANGES.map((r) => (
          <label
            key={r.value}
            className="flex cursor-pointer items-center rounded-md px-3 py-1.5 text-sm text-muted-foreground has-data-checked:bg-primary has-data-checked:text-primary-foreground"
          >
            <RadioGroupItem value={r.value} className="sr-only" />
            {r.label}
          </label>
        ))}
      </RadioGroup>

      <DataList
        columns={columns}
        data={sales}
        searchKeys={["customerName", "cashierName", "reference"]}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Paid", value: "PAID" },
              { label: "Unpaid", value: "UNPAID" },
              { label: "Settled", value: "SETTLED" },
            ],
          },
        ]}
        getRowId={(s) => s.id}
        onRowClick={(s) => router.push(`/admin/sales/${s.id}`)}
        renderCard={(s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => router.push(`/admin/sales/${s.id}`)}
            className="flex w-full flex-col gap-1 rounded-lg border p-3 text-left text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{s.customerName || "Walk-in"}</span>
              <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{new Date(s.created_at).toLocaleString("en-US")}</span>
              <span className="font-medium text-foreground tabular-nums">
                {formatMoney(s.total_cents, currency)}
              </span>
            </div>
          </button>
        )}
        emptyState={
          <EmptyState
            icon={ReceiptIcon}
            title="No sales in this period"
            description="Try a different date range."
          />
        }
      />
    </div>
  )
}
