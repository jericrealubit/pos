import { getStoresForSuperAdmin } from "@/lib/dal/super-admin"
import { StoresDataList } from "@/components/stores-data-list"

export default async function SuperAdminPage() {
  const stores = await getStoresForSuperAdmin()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Stores</h1>
      <StoresDataList stores={stores} />
    </div>
  )
}
