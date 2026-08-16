import { z } from "zod"

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
})
export type CustomerFormValues = z.infer<typeof customerFormSchema>
