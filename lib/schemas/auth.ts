import { z } from "zod"

export const registerSchema = z.object({
  storeName: z.string().trim().min(1, "Store name is required").max(200),
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "8 characters minimum"),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const signinSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})
export type SigninInput = z.infer<typeof signinSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "8 characters minimum"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
