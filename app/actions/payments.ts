"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireUser, getProfile } from "@/lib/dal"
import { getCustomerWithUnpaidItems } from "@/lib/dal/customers"
import { paymentFormSchema, type PaymentFormValues } from "@/lib/schemas/payment"
import { dollarsToCents, formatMoney } from "@/lib/money"
import type { ActionResult } from "@/lib/actions/types"

export async function recordPayment(
  input: PaymentFormValues
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser()
  const parsed = paymentFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const profile = await getProfile()
  if (!profile) {
    return { ok: false, formError: "Your store isn't set up yet." }
  }

  const result = await getCustomerWithUnpaidItems(parsed.data.customerId)
  if (!result) {
    return { ok: false, formError: "Customer not found." }
  }

  const balanceCents = result.customer.balance_cents ?? 0
  const amountCents = dollarsToCents(parsed.data.amount)
  if (amountCents <= 0) {
    return { ok: false, fieldErrors: { amount: ["Enter an amount greater than zero."] } }
  }
  if (amountCents > balanceCents) {
    return {
      ok: false,
      fieldErrors: {
        amount: [`Amount can't exceed the balance of ${formatMoney(balanceCents, profile.stores.currency)}.`],
      },
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payments")
    .insert({
      store_id: profile.store_id,
      customer_id: parsed.data.customerId,
      taken_by: user.id,
      amount_cents: amountCents,
    })
    .select("id")
    .single()

  if (error) {
    return { ok: false, formError: "Could not record the payment. Try again." }
  }

  revalidatePath(`/admin/customers/${parsed.data.customerId}`)
  revalidatePath("/admin/customers")
  return { ok: true, data }
}
