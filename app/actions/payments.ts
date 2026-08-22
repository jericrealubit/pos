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
): Promise<ActionResult<{ id: string; settledCount: number }>> {
  // Deliberately not gated on the subscription. Recording that a
  // customer settled their tab takes no new value from the product —
  // no new sale can be rung up while lapsed — and blocking it would
  // leave the pay-later book showing debts that have actually been
  // paid. A stale ledger is worse for the shop than a locked till, and
  // it is the shop's own data either way.
  await requireUser()
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
    .rpc("record_payment", {
      p_customer_id: parsed.data.customerId,
      p_amount_cents: amountCents,
    })
    .single()

  if (error) {
    return { ok: false, formError: "Could not record the payment. Try again." }
  }

  revalidatePath(`/admin/customers/${parsed.data.customerId}`)
  revalidatePath("/admin/customers")
  revalidatePath("/admin/sales")
  return { ok: true, data: { id: data.payment_id, settledCount: data.settled_count } }
}
