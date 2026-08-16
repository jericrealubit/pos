import { z } from "zod"

export const saleLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(9999),
})

export const createSaleSchema = z.object({
  items: z.array(saleLineSchema).min(1, "Cart is empty"),
  customerId: z.string().uuid().optional(),
  status: z.enum(["PAID", "UNPAID"]).default("PAID"),
})
export type CreateSaleInput = z.input<typeof createSaleSchema>
