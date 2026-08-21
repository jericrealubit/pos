import { getProfile } from "@/lib/dal"
import { StoreSettingsForm } from "@/components/store-settings-form"

export default async function SettingsPage() {
  const profile = await getProfile()
  const store = profile!.stores

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <StoreSettingsForm
        store={{
          name: store.name,
          address: store.address,
          phone: store.phone,
          low_stock_threshold: store.low_stock_threshold,
        }}
      />
    </div>
  )
}
