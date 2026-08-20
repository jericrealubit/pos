"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { resetPasswordAction } from "@/app/actions/auth"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth"
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

export function ResetPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  function onSubmit(values: ResetPasswordInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await resetPasswordAction(values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof ResetPasswordInput, { message: messages[0] })
          }
        }
        if (result.formError) setFormError(result.formError)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <FieldContent>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <FieldContent>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </FieldContent>
        </Field>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="w-full gap-1.5">
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Saving…" : "Save new password"}
        </Button>
      </FieldGroup>
    </form>
  )
}
