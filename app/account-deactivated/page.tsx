import { SignOutButton } from "@/components/sign-out-button"

export default function AccountDeactivatedPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-xl font-semibold">Access deactivated</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your access to this store has been deactivated. Contact your store owner to have it
        restored.
      </p>
      <SignOutButton />
    </div>
  )
}
