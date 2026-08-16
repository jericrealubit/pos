import { getCustomerBalances } from "@/lib/dal/customers"
import { getProfile } from "@/lib/dal"
import { CustomersDataList } from "@/components/customers-data-list"
import type { CustomerBalance } from "@/app/actions/customers"

export default async function CustomersPage() {
  const [customers, profile] = await Promise.all([getCustomerBalances(), getProfile()])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">The book</h1>
      <CustomersDataList
        customers={customers as CustomerBalance[]}
        currency={profile!.stores.currency}
      />
    </div>
  )
}
