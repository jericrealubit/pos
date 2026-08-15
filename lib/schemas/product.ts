import { z } from "zod"

const moneyDollars = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a price like 4.20")

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  size: z.string().trim().max(50).optional().or(z.literal("")),
  price: moneyDollars,
  barcode: z.string().trim().min(1, "Barcode is required").max(64),
  categoryId: z.string().uuid().optional().or(z.literal("")),
})
export type ProductFormValues = z.infer<typeof productFormSchema>

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
})
export type CategoryFormValues = z.infer<typeof categoryFormSchema>
