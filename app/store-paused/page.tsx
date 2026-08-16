import { SignOutButton } from "@/components/sign-out-button"

export default function StorePausedPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-xl font-semibold">Access paused</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your store&apos;s access has been paused. Contact support to have it restored.
      </p>
      <SignOutButton />
    </div>
  )
}
