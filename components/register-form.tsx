"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { registerAction } from "@/app/actions/auth"
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COUNTRY_OPTIONS, countryName } from "@/lib/countries"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export function RegisterForm({ defaultCountry }: { defaultCountry: string }) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { country: defaultCountry },
  })

  function onSubmit(values: RegisterInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await registerAction(values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof RegisterInput, { message: messages[0] })
          }
        }
        if (result.formError) setFormError(result.formError)
        return
      }
      if (result.data.pendingConfirmation) {
        router.push(`/register/check-email?email=${encodeURIComponent(values.email)}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.storeName}>
          <FieldLabel htmlFor="storeName">Store name</FieldLabel>
          <FieldContent>
            <Input
              id="storeName"
              placeholder="Acme General Store"
              autoComplete="organization"
              {...register("storeName")}
            />
            <FieldDescription>
              Prints on receipts and heads the admin panel.
            </FieldDescription>
            <FieldError errors={[errors.storeName]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.country}>
          <FieldLabel htmlFor="country">Country</FieldLabel>
          <FieldContent>
            <Controller
              control={control}
              name="country"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(String(v))}>
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Select a country">
                      {(v: string | null) => (v ? countryName(v) : "")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldDescription>
              Sets your currency and pricing. Ask us if you need to change it later.
            </FieldDescription>
            <FieldError errors={[errors.country]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.firstName}>
          <FieldLabel htmlFor="firstName">First name</FieldLabel>
          <FieldContent>
            <Input
              id="firstName"
              placeholder="John"
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
          {isPending ? "Creating account…" : "Create account"}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full gap-1.5"
          nativeButton={false}
          render={<Link href="/signin" />}
        >
          I already have an account
          <LinkPendingIndicator />
        </Button>
      </FieldGroup>
    </form>
  )
}
