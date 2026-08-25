"use client"

import Link from "next/link"
import { ArchiveIcon } from "lucide-react"

import { useSellCart } from "@/components/sell/sell-provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HeldSalesEntry() {
  const { heldCarts } = useSellCart()
  if (heldCarts.length === 0) return null

  return (
    <Link
      href="/sell/held"
      className={cn(buttonVariants({ size: "till", variant: "outline" }), "w-full gap-1.5")}
    >
      <ArchiveIcon />
      Held sales ({heldCarts.length})
    </Link>
  )
}
