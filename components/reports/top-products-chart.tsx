"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { formatMoney, formatMoneyCompact } from "@/lib/money"

type TopProduct = {
  product_id: string | null
  name: string
  quantity: number
  revenue_cents: number
}

function TooltipContent({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: { payload: TopProduct }[]
  currency: string
}) {
  if (!active || !payload?.length) return null
  const product = payload[0].payload
  return (
    <div className="max-w-48 rounded-md border bg-popover px-3 py-2 text-xs shadow-sm">
      <div className="truncate font-medium">{product.name}</div>
      <div className="text-muted-foreground">{product.quantity} sold</div>
      <div className="font-medium tabular-nums">{formatMoney(product.revenue_cents, currency)}</div>
    </div>
  )
}

export function TopProductsChart({ data, currency }: { data: TopProduct[]; currency: string }) {
  // Longest names would otherwise blow out the axis width — trim for the
  // tick label only, the full name still shows in the tooltip.
  const chartData = data.map((p) => ({
    ...p,
    shortName: p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 36)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(cents: number) => formatMoneyCompact(cents, currency)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip content={<TooltipContent currency={currency} />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="revenue_cents" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
