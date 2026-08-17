import Link from "next/link"
import Image from "next/image"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

const FEATURES = [
  {
    title: "Scan and sell",
    description:
      "A camera or a plugged-in barcode reader rings up a sale in seconds — built for a real till, not a tablet demo.",
  },
  {
    title: "The pay-later book",
    description:
      "Regular customers can settle up later instead of at the counter. Every unpaid sale goes straight onto their tab — no separate ledger.",
  },
  {
    title: "Run the store",
    description:
      "Manage products, categories, and customer balances from an admin dashboard that works from the shop floor or the back office.",
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 p-6">
      <div className="max-w-lg text-center">
        <Image
          src="/logo-mark.png"
          alt=""
          width={64}
          height={64}
          className="mx-auto mb-4"
          priority
        />
        <h1 className="text-3xl font-semibold">Counter</h1>
        <p className="mt-3 text-base text-muted-foreground">
          The till and the pay-later book, in one place. Scan a barcode, ring up a sale, and keep
          track of who still owes you — without juggling a separate notebook.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-lg border p-4 text-left">
            <div className="text-sm font-medium">{feature.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "w-full gap-1.5")}>
          Create an account
          <LinkPendingIndicator />
        </Link>
        <Link
          href="/signin"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full gap-1.5")}
        >
          Sign in
          <LinkPendingIndicator />
        </Link>
      </div>
    </div>
  )
}
