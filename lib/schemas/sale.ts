import { z } from "zod"

export const saleLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(9999),
})

export const createSaleSchema = z.object({
  items: z.array(saleLineSchema).min(1, "Cart is empty"),
})
export type CreateSaleInput = z.infer<typeof createSaleSchema>
