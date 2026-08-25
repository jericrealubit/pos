import { z } from "zod"

import { moneyDollars, wholeNumber } from "@/lib/schemas/product"

// Same rules as productFormSchema, but `category` is a free-text NAME rather
// than a categoryId UUID — CSV files carry names, and the import action
// resolves-or-creates the matching category row before insert.
export const productImportRowSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  barcode: z.string().trim().min(1, "Barcode is required").max(64),
  price: moneyDollars,
  stockQuantity: wholeNumber.optional().or(z.literal("")),
  size: z.string().trim().max(50).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
})
export type ProductImportRow = z.infer<typeof productImportRowSchema>

// The columns a CSV must provide, and the aliases we'll accept for each
// (case-insensitive, trimmed) — keeps the template forgiving of common
// spreadsheet-export header variants.
export const IMPORT_COLUMN_ALIASES: Record<keyof ProductImportRow, string[]> = {
  name: ["name", "product", "product name"],
  barcode: ["barcode", "upc", "sku", "ean"],
  price: ["price", "price_cents", "unit price"],
  stockQuantity: ["stock", "stockquantity", "stock quantity", "qty", "quantity"],
  size: ["size"],
  category: ["category", "category name"],
  description: ["description", "notes"],
}

export const IMPORT_TEMPLATE_HEADERS = [
  "name",
  "barcode",
  "price",
  "stock",
  "size",
  "category",
  "description",
] as const

export const IMPORT_TEMPLATE_EXAMPLE_ROW = [
  "Coca-Cola 1.5L",
  "4800000000012",
  "65.00",
  "24",
  "1.5 L",
  "Drinks",
  "",
]

export const IMPORT_MAX_ROWS = 1000

export type ImportRowError = { line: number; message: string }
export type ImportRowSkip = { line: number; barcode: string; reason: string }

export type ImportResult = {
  imported: number
  skipped: ImportRowSkip[]
  errors: ImportRowError[]
}
