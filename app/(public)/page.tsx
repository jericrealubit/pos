import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export const metadata: Metadata = {
  title: "Counter — stop tracking sales in a notebook",
  description:
    "The till and the pay-later book, in one place. Scan a barcode, ring up a sale, and always know who still owes you — no separate notebook.",
}

const FEATURES = [
  {
    title: "Scan and sell",
    description:
      "No more writing prices by hand. Scan a barcode with your phone's camera or a plugged-in barcode reader, and the sale rings up in seconds.",
  },
  {
    title: "The pay-later book",
    description:
      "Stop flipping through a notebook to remember who owes what. Every unpaid sale goes straight onto a customer's tab, itemised and always up to date.",
  },
  {
    title: "Run the store",
    description:
      "See your products, stock, and every customer's balance from one dashboard — from the shop floor or the back office.",
  },
]

const SCREENSHOTS = [
  {
    src: "/screenshots/sell.png",
    alt: "Ringing up a sale with the option to mark it paid or pay later",
    caption: "Scan and sell",
    width: 770,
    height: 510,
  },
  {
    src: "/screenshots/customer-balance.png",
    alt: "A customer's itemised pay-later balance",
    caption: "The pay-later book",
    width: 1178,
    height: 420,
  },
  {
    src: "/screenshots/admin-products.png",
    alt: "The admin dashboard showing the product list",
    caption: "Run the store",
    width: 1178,
    height: 230,
  },
]

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-14">
      <div className="max-w-lg text-center">
        <Image
          src="/logo-mark.png"
          alt=""
          width={64}
          height={64}
          className="mx-auto mb-4"
          priority
        />
        <h1 className="text-3xl font-semibold text-balance">
          Stop tracking sales in a notebook.
        </h1>
        <p className="mt-3 text-base text-muted-foreground text-balance">
          Counter is the till and the pay-later book, in one place. Scan a barcode, ring up a
          sale, and always know who still owes you — no more flipping through pages at closing
          time.
        </p>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4">
        {SCREENSHOTS.map((shot) => (
          <figure key={shot.src} className="overflow-hidden rounded-lg border">
            <Image
              src={shot.src}
              alt={shot.alt}
              width={shot.width}
              height={shot.height}
              className="w-full"
            />
            <figcaption className="border-t bg-muted/40 px-3 py-2 text-xs font-medium">
              {shot.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-lg border p-4 text-left">
            <div className="text-sm font-medium">{feature.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-3">
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
        <p className="text-xs text-muted-foreground">
          Takes about a minute to set up your store — no separate app to install.
        </p>
      </div>
    </div>
  )
}
