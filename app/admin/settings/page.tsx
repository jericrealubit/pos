import { getProfile } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { StoreSettingsForm } from "@/components/store-settings-form"

export default async function SettingsPage() {
  const profile = await getProfile()
  const store = profile!.stores

  // Currency is only editable before the first sale — see storeUpdate.
  const supabase = await createClient()
  const { count } = await supabase
    .from("sales")
    .select("id", { count: "exact", head: true })
    .eq("store_id", profile!.store_id)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <StoreSettingsForm
        store={{
          name: store.name,
          address: store.address,
          phone: store.phone,
          low_stock_threshold: store.low_stock_threshold,
          currency: store.currency,
          hasSales: (count ?? 0) > 0,
        }}
      />
    </div>
  )
}
