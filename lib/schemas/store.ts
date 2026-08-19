import { z } from "zod"

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "Store name is required").max(200),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
})
export type StoreSettingsValues = z.infer<typeof storeSettingsSchema>
