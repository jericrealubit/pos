"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { formatMoney, formatMoneyCompact } from "@/lib/money"

type HourRow = { hour: number; total_cents: number; sale_count: number }
type DowRow = { dow: number; total_cents: number; sale_count: number }

const DOW_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function hourLabel(hour: number): string {
  if (hour === 0) return "12am"
  if (hour === 12) return "12pm"
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

function PatternTooltip<T extends { total_cents: number; sale_count: number }>({
  active,
  payload,
  currency,
  label,
}: {
  active?: boolean
  payload?: { payload: T }[]
  currency: string
  label: (row: T) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-sm">
      <div className="font-medium">{label(row)}</div>
      <div className="text-muted-foreground">
        {row.sale_count} {row.sale_count === 1 ? "sale" : "sales"}
      </div>
      <div className="font-medium tabular-nums">{formatMoney(row.total_cents, currency)}</div>
    </div>
  )
}

export function SalesPatternsChart({
  byHour,
  byDayOfWeek,
  currency,
}: {
  byHour: HourRow[]
  byDayOfWeek: DowRow[]
  currency: string
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">By hour of day</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byHour} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="hour"
              tickFormatter={hourLabel}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(cents: number) => formatMoneyCompact(cents, currency)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              content={
                <PatternTooltip<HourRow>
                  currency={currency}
                  label={(row) => hourLabel(row.hour)}
                />
              }
              cursor={{ fill: "var(--muted)" }}
            />
            <Bar dataKey="total_cents" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">By day of week</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byDayOfWeek} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="dow"
              tickFormatter={(d: number) => DOW_LABEL[d] ?? String(d)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tickFormatter={(cents: number) => formatMoneyCompact(cents, currency)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              content={
                <PatternTooltip<DowRow>
                  currency={currency}
                  label={(row) => DOW_LABEL[row.dow] ?? String(row.dow)}
                />
              }
              cursor={{ fill: "var(--muted)" }}
            />
            <Bar dataKey="total_cents" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
