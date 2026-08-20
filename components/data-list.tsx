"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon } from "lucide-react"
import type { RowData, SortingState } from "@tanstack/react-table"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

export type DataListFilter<TData extends RowData> = {
  key: string
  label: string
  options: { label: string; value: string }[]
  accessorFn?: (row: TData) => string
}

type DataListProps<TData extends RowData> = {
  columns: LegacyColumnDef<TData>[]
  data: TData[]
  searchKeys: (keyof TData)[]
  filters?: DataListFilter<TData>[]
  getRowId: (row: TData) => string
  onRowClick?: (row: TData) => void
  renderCard: (row: TData) => React.ReactNode
  emptyState?: React.ReactNode
  pageSize?: number
}

export function DataList<TData extends RowData>({
  columns,
  data,
  searchKeys,
  filters = [],
  getRowId,
  onRowClick,
  renderCard,
  emptyState,
  pageSize = 10,
}: DataListProps<TData>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sortDrawerOpen, setSortDrawerOpen] = useState(false)

  const q = searchParams.get("q") ?? ""
  const sort = searchParams.get("sort") ?? undefined
  const dir = searchParams.get("dir") === "desc" ? "desc" : "asc"
  const page = Number(searchParams.get("page") ?? "0") || 0

  function writeParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") params.delete(key)
      else params.set(key, value)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    let rows = data

    if (q) {
      const needle = q.toLowerCase()
      rows = rows.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(needle))
      )
    }

    for (const filter of filters) {
      const value = searchParams.get(filter.key)
      if (value) {
        const accessor =
          filter.accessorFn ?? ((row: TData) => String((row as Record<string, unknown>)[filter.key] ?? ""))
        rows = rows.filter((row) => accessor(row) === value)
      }
    }

    return rows
  }, [data, q, searchKeys, filters, searchParams])

  const sorting: SortingState = sort ? [{ id: sort, desc: dir === "desc" }] : []

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const col = columns.find((c) => (c as { id?: string }).id === sort)
    if (!col) return filtered
    const accessor = (col as { accessorFn?: (row: TData) => unknown }).accessorFn
    if (!accessor) return filtered

    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      let cmp: number
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv
      else cmp = String(av ?? "").localeCompare(String(bv ?? ""))
      return dir === "desc" ? -cmp : cmp
    })
    return copy
  }, [filtered, sort, dir, columns])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize)

  const handleSortingChange: (updater: SortingState | ((old: SortingState) => SortingState)) => void = (
    updater
  ) => {
    const next = typeof updater === "function" ? updater(sorting) : updater
    const nextSort = next[0]
    writeParams({
      sort: nextSort ? String(nextSort.id) : null,
      dir: nextSort?.desc ? "desc" : null,
      page: null,
    })
  }

  const isEmpty = sorted.length === 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 min-w-[170px] flex-1 items-center gap-2 rounded-lg border border-input px-2.5">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            placeholder="Search"
            value={q}
            onChange={(e) => writeParams({ q: e.target.value, page: null })}
          />
        </div>
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={searchParams.get(filter.key) ?? "all"}
            onValueChange={(value) =>
              writeParams({ [filter.key]: value === "all" ? null : String(value), page: null })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.label}>
                {(v: string | null) =>
                  v === "all" || v === null
                    ? filter.label
                    : (filter.options.find((opt) => opt.value === v)?.label ?? filter.label)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.label}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <Button
          type="button"
          variant="outline"
          className="md:hidden"
          onClick={() => setSortDrawerOpen(true)}
        >
          Sort
        </Button>
      </div>

      <div className="hidden md:block">
        <div className="rounded-lg border">
          <DataTable
            columns={columns}
            data={pageRows}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onRowClick={onRowClick}
            emptyState={emptyState}
          />
        </div>
      </div>

      <div className="grid gap-2 md:hidden">
        {isEmpty ? emptyState : pageRows.map((row) => <div key={getRowId(row)}>{renderCard(row)}</div>)}
      </div>

      {!isEmpty && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {currentPage * pageSize + 1}–{Math.min(sorted.length, (currentPage + 1) * pageSize)} of{" "}
            {sorted.length}
          </span>
          <div className="ml-auto flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => writeParams({ page: String(currentPage - 1) })}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => writeParams({ page: String(currentPage + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Drawer open={sortDrawerOpen} onOpenChange={setSortDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Sort by</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-1 p-4 pt-0">
            {columns
              .filter((c) => (c as { id?: string }).id)
              .map((col) => {
                const id = (col as { id?: string }).id!
                const header = (col as { header?: string }).header ?? id
                const active = sort === id
                return (
                  <button
                    key={id}
                    type="button"
                    className="flex items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      writeParams({
                        sort: id,
                        dir: active && dir === "asc" ? "desc" : "asc",
                        page: null,
                      })
                      setSortDrawerOpen(false)
                    }}
                  >
                    <span>{header}</span>
                    {active && <span>{dir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                )
              })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
