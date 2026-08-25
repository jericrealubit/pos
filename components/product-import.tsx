"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { CheckCircle2Icon, DownloadIcon, TriangleAlertIcon, UploadIcon } from "lucide-react"

import { productsImport, type ProductImportRowInput } from "@/app/actions/products"
import {
  productImportRowSchema,
  IMPORT_COLUMN_ALIASES,
  IMPORT_TEMPLATE_HEADERS,
  IMPORT_TEMPLATE_EXAMPLE_ROW,
  IMPORT_MAX_ROWS,
  type ProductImportRow,
  type ImportResult,
} from "@/lib/schemas/product-import"
import { toCsv } from "@/lib/csv"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

type PreviewRow = ProductImportRowInput & {
  status: "valid" | "invalid"
  message?: string
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase()
}

// Maps each raw CSV header to one of our known fields, accepting the
// aliases in IMPORT_COLUMN_ALIASES (case-insensitive) so common spreadsheet
// export variants ("Product Name", "Qty") still line up.
function buildHeaderMap(rawHeaders: string[]): Partial<Record<keyof ProductImportRow, string>> {
  const map: Partial<Record<keyof ProductImportRow, string>> = {}
  for (const [field, aliases] of Object.entries(IMPORT_COLUMN_ALIASES) as [
    keyof ProductImportRow,
    string[],
  ][]) {
    const match = rawHeaders.find((h) => aliases.includes(normalizeHeader(h)))
    if (match) map[field] = match
  }
  return map
}

function downloadTemplate() {
  const csv = toCsv([...IMPORT_TEMPLATE_HEADERS], [IMPORT_TEMPLATE_EXAMPLE_ROW])
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "counter-products-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export function ProductImport() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const validRows = rows.filter((r) => r.status === "valid")
  const invalidCount = rows.length - validRows.length

  function handleFile(file: File) {
    setResult(null)
    setFileName(file.name)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const rawHeaders = parsed.meta.fields ?? []
        const headerMap = buildHeaderMap(rawHeaders)

        if (!headerMap.name || !headerMap.barcode || !headerMap.price) {
          toast.add({
            title: "Missing required columns",
            description: "The CSV needs at least name, barcode, and price columns.",
            type: "error",
          })
          setRows([])
          return
        }

        const parsedRows: PreviewRow[] = parsed.data.slice(0, IMPORT_MAX_ROWS).map((raw, i) => {
          const candidate = {
            name: (headerMap.name ? raw[headerMap.name] : "") ?? "",
            barcode: (headerMap.barcode ? raw[headerMap.barcode] : "") ?? "",
            price: (headerMap.price ? raw[headerMap.price] : "") ?? "",
            stockQuantity: (headerMap.stockQuantity ? raw[headerMap.stockQuantity] : "") ?? "",
            size: (headerMap.size ? raw[headerMap.size] : "") ?? "",
            category: (headerMap.category ? raw[headerMap.category] : "") ?? "",
            description: (headerMap.description ? raw[headerMap.description] : "") ?? "",
          }
          const line = i + 2 // header is line 1
          const check = productImportRowSchema.safeParse(candidate)
          if (!check.success) {
            const message =
              Object.values(check.error.flatten().fieldErrors)[0]?.[0] ?? "Invalid row."
            return { line, ...candidate, status: "invalid", message }
          }
          return { line, ...candidate, status: "valid" }
        })

        setRows(parsedRows)
      },
      error: () => {
        toast.add({ title: "Could not read that file.", type: "error" })
      },
    })
  }

  function handleImport() {
    if (validRows.length === 0) return
    startTransition(async () => {
      const payload: ProductImportRowInput[] = validRows.map((r) => ({
        line: r.line,
        name: r.name,
        barcode: r.barcode,
        price: r.price,
        stockQuantity: r.stockQuantity,
        size: r.size,
        category: r.category,
        description: r.description,
      }))
      const res = await productsImport(payload)
      if (!res.ok) {
        toast.add({ title: res.formError ?? "Import failed.", type: "error" })
        return
      }
      setResult(res.data)
      if (res.data.imported > 0) {
        toast.add({ title: `Imported ${res.data.imported} product(s)`, type: "success" })
        router.refresh()
      } else {
        toast.add({ title: "No rows were imported.", type: "warning" })
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon />
          {fileName ? "Choose a different file" : "Choose CSV file"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ""
          }}
        />
        {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
        <button
          type="button"
          onClick={downloadTemplate}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto gap-1.5")}
        >
          <DownloadIcon className="size-4" />
          Download template
        </button>
      </div>

      {rows.length > 0 && !result && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2Icon className="size-3.5" />
              {validRows.length} ready
            </Badge>
            {invalidCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <TriangleAlertIcon className="size-3.5" />
                {invalidCount} need fixing
              </Badge>
            )}
            <span className="text-muted-foreground">{rows.length} rows total</span>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Line</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.line} data-invalid={row.status === "invalid"}>
                    <TableCell className="text-muted-foreground">{row.line}</TableCell>
                    <TableCell className="max-w-40 truncate">{row.name}</TableCell>
                    <TableCell className="tabular-nums">{row.barcode}</TableCell>
                    <TableCell className="tabular-nums">{row.price}</TableCell>
                    <TableCell className="tabular-nums">{row.stockQuantity || "0"}</TableCell>
                    <TableCell className="max-w-32 truncate text-muted-foreground">
                      {row.category || "—"}
                    </TableCell>
                    <TableCell>
                      {row.status === "valid" ? (
                        <span className="text-primary">Ready</span>
                      ) : (
                        <span className="text-destructive">{row.message}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            type="button"
            className="w-fit gap-1.5"
            loading={isPending}
            disabled={validRows.length === 0}
            onClick={handleImport}
          >
            {isPending ? "Importing…" : `Import ${validRows.length} valid row(s)`}
          </Button>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="text-sm font-medium">Import complete</div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{result.imported} imported</Badge>
            {result.skipped.length > 0 && (
              <Badge variant="outline">{result.skipped.length} skipped</Badge>
            )}
            {result.errors.length > 0 && (
              <Badge variant="destructive">{result.errors.length} failed</Badge>
            )}
          </div>

          {(result.skipped.length > 0 || result.errors.length > 0) && (
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {result.skipped.map((s) => (
                <div key={`skip-${s.line}`}>
                  Line {s.line} ({s.barcode}): {s.reason}
                </div>
              ))}
              {result.errors.map((e) => (
                <div key={`err-${e.line}`}>
                  Line {e.line}: {e.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Link href="/admin/products" className={cn(buttonVariants({ size: "sm" }))}>
              View products
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRows([])
                setResult(null)
                setFileName(null)
              }}
            >
              Import another file
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
