"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"

import { categoryCreate } from "@/app/actions/categories"
import { categoryFormSchema, type CategoryFormValues } from "@/lib/schemas/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { toast } from "@/components/ui/toast"

type Category = { id: string; name: string }

export function CategorySelect({
  value,
  onChange,
  categories,
}: {
  value: string
  onChange: (value: string) => void
  categories: Category[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(categories)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
  })

  function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      const result = await categoryCreate(values)
      if (!result.ok) {
        toast.add({
          title: result.formError ?? "Could not create the category.",
          type: "error",
        })
        return
      }
      setItems((prev) => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(result.data.id)
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value || undefined} onValueChange={(v) => onChange(String(v))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {items.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        + Add category
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Add category"
        footer={
          <Button type="submit" form="add-category-form" loading={isPending} className="gap-1.5">
            {isPending ? "Adding…" : "Add category"}
          </Button>
        }
      >
        <form id="add-category-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="categoryName">Category name</FieldLabel>
            <FieldContent>
              <Input id="categoryName" placeholder="Cooking oils" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </FieldContent>
          </Field>
        </form>
      </ResponsiveDialog>
    </div>
  )
}
