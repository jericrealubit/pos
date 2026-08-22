import { z } from "zod"

const wholeNumber = z
  .string()
  .trim()
  .regex(/^\d{1,6}$/, "Enter a whole number like 5")

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "Store name is required").max(200),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  lowStockThreshold: wholeNumber,
  // Only honoured while the store has no sales — past that, changing it
  // would silently reinterpret every price_cents already recorded.
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code like AUD")
    .optional(),
})
export type StoreSettingsValues = z.infer<typeof storeSettingsSchema>
