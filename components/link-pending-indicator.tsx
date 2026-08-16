"use client"

import { useLinkStatus } from "next/link"

import { Spinner } from "@/components/ui/spinner"

export function LinkPendingIndicator({ className }: { className?: string }) {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return <Spinner className={className} />
}
