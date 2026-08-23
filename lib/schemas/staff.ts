import { z } from "zod"

export const staffInviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["ADMIN", "CASHIER"]),
})
export type StaffInviteInput = z.infer<typeof staffInviteSchema>

export const staffRoleSchema = z.enum(["ADMIN", "CASHIER"])

export const joinSignupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  password: z.string().min(8, "8 characters minimum"),
})
export type JoinSignupInput = z.infer<typeof joinSignupSchema>

export const joinExistingSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
})
export type JoinExistingInput = z.infer<typeof joinExistingSchema>
