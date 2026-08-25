"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatMoney, formatMoneyCompact } from "@/lib/money"

type RevenueDay = { day: string; total_cents: number; sale_count: number }

function TooltipContent({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: { payload: RevenueDay }[]
  currency: string
}) {
  if (!active || !payload?.length) return null
  const day = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-sm">
      <div className="font-medium">
        {new Date(day.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
      <div className="text-muted-foreground">
        {day.sale_count} {day.sale_count === 1 ? "sale" : "sales"}
      </div>
      <div className="font-medium tabular-nums">{formatMoney(day.total_cents, currency)}</div>
    </div>
  )
}

export function RevenueChart({ data, currency }: { data: RevenueDay[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={(day: string) =>
            new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          }
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          tickFormatter={(cents: number) => formatMoneyCompact(cents, currency)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip content={<TooltipContent currency={currency} />} />
        <Area
          type="monotone"
          dataKey="total_cents"
          stroke="var(--chart-5)"
          strokeWidth={2}
          fill="url(#revenueFill)"
          // A single day of data can't draw a line/area (needs 2+ points to
          // interpolate a path) and would otherwise render nothing — a dot
          // keeps that day visible instead of looking broken.
          dot={{ r: 3, fill: "var(--chart-5)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
