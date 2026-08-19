export type SalesRange = "day" | "week" | "month" | "all"

export const SALES_RANGES: { value: SalesRange; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
]

export function isSalesRange(value: string | undefined): value is SalesRange {
  return !!value && SALES_RANGES.some((r) => r.value === value)
}

export function getRangeBounds(range: SalesRange): { from: string | null; to: string | null } {
  if (range === "all") return { from: null, to: null }

  const from = new Date()
  if (range === "day") {
    from.setHours(0, 0, 0, 0)
  } else if (range === "week") {
    const day = from.getDay() // 0 = Sunday
    const diff = (day === 0 ? -6 : 1) - day // back to Monday
    from.setDate(from.getDate() + diff)
    from.setHours(0, 0, 0, 0)
  } else if (range === "month") {
    from.setDate(1)
    from.setHours(0, 0, 0, 0)
  }
  return { from: from.toISOString(), to: null }
}
