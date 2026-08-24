"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { acceptInviteExisting } from "@/app/actions/staff-invite-accept"
import { joinExistingSchema, type JoinExistingInput } from "@/lib/schemas/staff"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

export function JoinExistingForm({ token }: { token: string }) {
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<JoinExistingInput>({
    resolver: zodResolver(joinExistingSchema),
  })

  function onSubmit(values: JoinExistingInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await acceptInviteExisting(token, values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof JoinExistingInput, { message: messages[0] })
          }
        }
        if (result.formError) setFormError(result.formError)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
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

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="w-full gap-1.5">
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Joining…" : "Accept and join"}
        </Button>
      </FieldGroup>
    </form>
  )
}
