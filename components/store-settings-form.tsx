"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SaveIcon } from "lucide-react"

import { storeUpdate } from "@/app/actions/store"
import { storeSettingsSchema, type StoreSettingsValues } from "@/lib/schemas/store"
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
import { toast } from "@/components/ui/toast"

type Store = {
  name: string
  address: string | null
  phone: string | null
  low_stock_threshold: number
}

export function StoreSettingsForm({ store }: { store: Store }) {
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StoreSettingsValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: store.name,
      address: store.address ?? "",
      phone: store.phone ?? "",
      lowStockThreshold: String(store.low_stock_threshold),
    },
  })

  function onSubmit(values: StoreSettingsValues) {
    setFormError(null)
    startTransition(async () => {
      const result = await storeUpdate(values)

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof StoreSettingsValues, { message: messages[0] })
          }
        }
        if (result.formError) setFormError(result.formError)
        return
      }

      toast.add({ title: "Store settings saved", type: "success" })
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Store name</FieldLabel>
          <FieldContent>
            <Input id="name" placeholder="Corner Store" {...register("name")} />
            <FieldError errors={[errors.name]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.address}>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <FieldContent>
            <Input id="address" placeholder="123 Main St" {...register("address")} />
            <FieldError errors={[errors.address]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <FieldContent>
            <Input id="phone" placeholder="+1 555 123 4567" {...register("phone")} />
            <FieldError errors={[errors.phone]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.lowStockThreshold}>
          <FieldLabel htmlFor="lowStockThreshold">Low stock threshold</FieldLabel>
          <FieldContent>
            <Input
              id="lowStockThreshold"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              {...register("lowStockThreshold")}
            />
            <FieldDescription>
              Products at or below this quantity are flagged as low stock in the products list.
            </FieldDescription>
            <FieldError errors={[errors.lowStockThreshold]} />
          </FieldContent>
        </Field>
      </FieldGroup>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <Button type="submit" size="till" loading={isPending} className="gap-1.5">
          {!isPending && <SaveIcon />}
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
