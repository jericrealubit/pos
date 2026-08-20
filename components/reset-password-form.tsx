"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { resetPasswordAction } from "@/app/actions/auth"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth"
import { createClient } from "@/lib/supabase/client"
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
import { Skeleton } from "@/components/ui/skeleton"

export function ResetPasswordForm() {
  // The recovery session comes from the URL fragment the emailed link
  // lands with (`#access_token=...`), which the browser client picks up
  // and turns into a real session automatically — the server never sees
  // that fragment, so there's nothing to check until this runs client-side.
  const [sessionStatus, setSessionStatus] = useState<"checking" | "ready" | "invalid">(
    "checking"
  )
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

  useEffect(() => {
    const supabase = createClient()

    // @supabase/ssr's browser client doesn't auto-detect a session from the
    // URL fragment the way a plain supabase-js client would, so the
    // access_token/refresh_token pair the emailed link lands with has to be
    // read and applied by hand.
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = hashParams.get("access_token")
    const refreshToken = hashParams.get("refresh_token")

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          window.history.replaceState(null, "", window.location.pathname)
          setSessionStatus(!error && data.session ? "ready" : "invalid")
        })
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSessionStatus(data.session ? "ready" : "invalid")
    })
  }, [])

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

  if (sessionStatus === "checking") {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }

  if (sessionStatus === "invalid") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          This reset link is invalid or has expired. Request a new one.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href="/forgot-password" />}
        >
          Request a new link
        </Button>
      </div>
    )
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
