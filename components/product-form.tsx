"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SaveIcon } from "lucide-react"

import { productCreate, productUpdate } from "@/app/actions/products"
import { productFormSchema, type ProductFormValues } from "@/lib/schemas/product"
import { centsToDollars } from "@/lib/money"
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
import { CategorySelect } from "@/components/category-select"
import { ProductArchiveDialog } from "@/components/product-archive-dialog"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { CameraScanner } from "@/components/sell/camera-scanner"
import { toast } from "@/components/ui/toast"

type Category = { id: string; name: string }
type Product = {
  id: string
  name: string
  description: string | null
  size: string | null
  price_cents: number
  barcode: string
  category_id: string | null
  sale_count?: number
}

export function ProductForm({
  mode,
  product,
  categories,
  saleCount = 0,
  defaultBarcode,
}: {
  mode: "create" | "edit"
  product?: Product
  categories: Category[]
  saleCount?: number
  defaultBarcode?: string
}) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description ?? "",
          size: product.size ?? "",
          price: centsToDollars(product.price_cents),
          barcode: product.barcode,
          categoryId: product.category_id ?? "",
        }
      : {
          name: "",
          description: "",
          size: "",
          price: "",
          barcode: defaultBarcode ?? "",
          categoryId: "",
        },
  })

  function onSubmit(values: ProductFormValues) {
    setFormError(null)
    startTransition(async () => {
      const result =
        mode === "create"
          ? await productCreate(values)
          : await productUpdate(product!.id, values)

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof ProductFormValues, { message: messages[0] })
          }
        }
        if (result.formError) setFormError(result.formError)
        return
      }

      toast.add({
        title: mode === "create" ? "Product added" : "Product saved",
        type: "success",
      })
      router.push("/admin/products")
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Product name</FieldLabel>
            <FieldContent>
              <Input id="name" placeholder="Sunflower oil" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <FieldContent>
              <textarea
                id="description"
                placeholder="Refined, for frying and salads"
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                {...register("description")}
              />
              <FieldError errors={[errors.description]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.size}>
            <FieldLabel htmlFor="size">Size</FieldLabel>
            <FieldContent>
              <Input id="size" placeholder="1 L" {...register("size")} />
              <FieldError errors={[errors.size]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.price}>
            <FieldLabel htmlFor="price">Price</FieldLabel>
            <FieldContent>
              <Input
                id="price"
                inputMode="decimal"
                placeholder="4.20"
                {...register("price")}
              />
              <FieldError errors={[errors.price]} />
            </FieldContent>
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field data-invalid={!!errors.barcode}>
            <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
            <FieldContent>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  placeholder="6009812340012"
                  {...register("barcode")}
                />
                <Button type="button" variant="outline" onClick={() => setScanOpen(true)}>
                  Scan
                </Button>
              </div>
              <FieldDescription>
                Duplicate barcodes are refused on save — two products sharing one
                code makes every scan ambiguous.
              </FieldDescription>
              <FieldError errors={[errors.barcode]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.categoryId}>
            <FieldLabel htmlFor="categoryId">Category</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <CategorySelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    categories={categories}
                  />
                )}
              />
              <FieldError errors={[errors.categoryId]} />
            </FieldContent>
          </Field>

          {mode === "edit" && product && (
            <Field>
              <FieldLabel>Remove from till</FieldLabel>
              <FieldContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setArchiveOpen(true)}
                >
                  Archive this product
                </Button>
              </FieldContent>
            </Field>
          )}
        </FieldGroup>
      </div>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <Button type="submit" size="till" loading={isPending} className="gap-1.5">
          {!isPending && <SaveIcon />}
          {isPending ? "Saving…" : mode === "create" ? "Save product" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
      </div>

      {mode === "edit" && product && (
        <ProductArchiveDialog
          open={archiveOpen}
          onOpenChange={setArchiveOpen}
          productId={product.id}
          productName={product.name}
          saleCount={saleCount}
        />
      )}

      <ResponsiveDialog open={scanOpen} onOpenChange={setScanOpen} title="Scan barcode">
        {scanOpen && (
          <CameraScanner
            stopAfterFirst
            onDetect={(code) => {
              setValue("barcode", code, { shouldValidate: true })
              setScanOpen(false)
            }}
          />
        )}
      </ResponsiveDialog>
    </form>
  )
}
