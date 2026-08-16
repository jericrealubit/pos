"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireUser, getProfile } from "@/lib/dal"
import { searchCustomerBalances } from "@/lib/dal/customers"
import { customerFormSchema, type CustomerFormValues } from "@/lib/schemas/customer"
import type { ActionResult } from "@/lib/actions/types"

export type CustomerBalance = {
  id: string
  name: string
  phone: string | null
  balance_cents: number
  unpaid_sales: number
  oldest_unpaid: string | null
}

export async function searchCustomers(query: string): Promise<ActionResult<CustomerBalance[]>> {
  await requireUser()
  if (!query.trim()) return { ok: true, data: [] }

  const data = await searchCustomerBalances(query)
  return { ok: true, data: data as CustomerBalance[] }
}

export async function customerCreate(
  input: CustomerFormValues
): Promise<ActionResult<{ id: string; name: string }>> {
  await requireUser()
  const parsed = customerFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const profile = await getProfile()
  if (!profile) {
    return { ok: false, formError: "Your store isn't set up yet." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      store_id: profile.store_id,
    })
    .select("id, name")
    .single()

  if (error) {
    return { ok: false, formError: "Could not add the customer. Try again." }
  }

  revalidatePath("/admin/customers")
  return { ok: true, data }
}
