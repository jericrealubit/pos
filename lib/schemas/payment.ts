import { z } from "zod"

const moneyDollars = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 4.20")

export const paymentFormSchema = z.object({
  customerId: z.string().uuid(),
  amount: moneyDollars,
})
export type PaymentFormValues = z.infer<typeof paymentFormSchema>
