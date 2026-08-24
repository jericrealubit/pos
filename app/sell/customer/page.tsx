import { requirePremiumStore } from "@/lib/dal"
import { CustomerScreen } from "@/components/sell/customer-screen"

export default async function CustomerPage() {
  // The pay-later flow is premium; a Free-tier deep-link lands on /billing.
  await requirePremiumStore()
  return <CustomerScreen />
}
