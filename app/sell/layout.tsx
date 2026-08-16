import { requireUser, getProfile } from "@/lib/dal"
import { SellProvider } from "@/components/sell/sell-provider"

export default async function SellLayout({ children }: LayoutProps<"/sell">) {
  await requireUser()
  const profile = await getProfile()
  if (!profile) {
    // signUp succeeded but create_store_and_profile hasn't run yet
    return <div className="p-4">Setting up your store…</div>
  }

  return (
    <SellProvider role={profile.role} currency={profile.stores.currency as string}>
      <div className="mx-auto min-h-full w-full max-w-md">{children}</div>
    </SellProvider>
  )
}
