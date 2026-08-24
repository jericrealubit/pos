"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { acceptInviteSignup } from "@/app/actions/staff-invite-accept"
import { joinSignupSchema, type JoinSignupInput } from "@/lib/schemas/staff"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

export function JoinSignupForm({ token, email }: { token: string; email: string }) {
  const [formError, setFormError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<JoinSignupInput>({
    resolver: zodResolver(joinSignupSchema),
  })

  function onSubmit(values: JoinSignupInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await acceptInviteSignup(token, values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof JoinSignupInput, { message: messages[0] })
          }
        }
        if (result.formError) setFormError(result.formError)
        return
      }
      if (result.data.pendingConfirmation) setCheckEmail(true)
    })
  }

  if (checkEmail) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        We sent a confirmation link to {email}. Open it to finish joining.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="joinEmail">Email</FieldLabel>
          <FieldContent>
            <Input id="joinEmail" value={email} disabled readOnly />
            <FieldDescription>This invite is for {email}.</FieldDescription>
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.firstName}>
          <FieldLabel htmlFor="firstName">First name</FieldLabel>
          <FieldContent>
            <Input
              id="firstName"
              placeholder="Jane"
              autoComplete="given-name"
              {...register("firstName")}
            />
            <FieldError errors={[errors.firstName]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.lastName}>
          <FieldLabel htmlFor="lastName">Last name</FieldLabel>
          <FieldContent>
            <Input
              id="lastName"
              placeholder="Doe"
              autoComplete="family-name"
              {...register("lastName")}
            />
            <FieldError errors={[errors.lastName]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <FieldContent>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
            />
            <FieldDescription>8 characters minimum</FieldDescription>
            <FieldError errors={[errors.password]} />
          </FieldContent>
        </Field>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="w-full gap-1.5">
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Joining…" : "Join the team"}
        </Button>
      </FieldGroup>
    </form>
  )
}
