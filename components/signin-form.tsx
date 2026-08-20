"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { signInAction } from "@/app/actions/auth"
import { signinSchema, type SigninInput } from "@/lib/schemas/auth"
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

const ERROR_MESSAGES: Record<string, string> = {
  confirmation_failed:
    "That confirmation link is invalid or has expired. Try registering again.",
  setup_failed:
    "We couldn't finish setting up your store. Please contact support.",
}

export function SigninForm() {
  const searchParams = useSearchParams()
  const queryError = searchParams.get("error")
  const [formError, setFormError] = useState<string | null>(
    queryError ? (ERROR_MESSAGES[queryError] ?? null) : null
  )
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
  })

  function onSubmit(values: SigninInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await signInAction(values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof SigninInput, { message: messages[0] })
          }
        }
        if (result.formError) setFormError(result.formError)
      }
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

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <FieldContent>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </FieldContent>
        </Field>

        <Link
          href="/forgot-password"
          className="-mt-2 self-end text-xs text-muted-foreground hover:text-foreground"
        >
          Forgot password?
        </Link>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="w-full gap-1.5">
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full gap-1.5"
          nativeButton={false}
          render={<Link href="/register" />}
        >
          Create an account
          <LinkPendingIndicator />
        </Button>

        <p className="text-xs text-muted-foreground">
          Shift changes happen mid-queue. Consider a 4-digit till PIN for
          switching users once signed in on the device.
        </p>
      </FieldGroup>
    </form>
  )
}
