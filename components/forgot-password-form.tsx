"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { forgotPasswordAction } from "@/app/actions/auth"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export function ForgotPasswordForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  function onSubmit(values: ForgotPasswordInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await forgotPasswordAction(values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof ForgotPasswordInput, { message: messages[0] })
          }
        }
        if (result.formError) setFormError(result.formError)
        return
      }

      router.push(`/forgot-password/check-email?email=${encodeURIComponent(values.email)}`)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <FieldContent>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              autoComplete="email"
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </FieldContent>
        </Field>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="w-full gap-1.5">
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full gap-1.5"
          nativeButton={false}
          render={<Link href="/signin" />}
        >
          Back to sign in
          <LinkPendingIndicator />
        </Button>
      </FieldGroup>
    </form>
  )
}
