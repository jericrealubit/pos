import { z } from "zod"

export const emailReceiptSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
})
export type EmailReceiptInput = z.infer<typeof emailReceiptSchema>
