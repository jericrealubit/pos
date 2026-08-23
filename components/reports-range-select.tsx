"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SALES_RANGES, type SalesRange } from "@/lib/sales-date-range"

export function ReportsRangeSelect({ range }: { range: SalesRange }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setRange(next: SalesRange) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "all") params.delete("range")
    else params.set("range", next)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
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
  )
}
