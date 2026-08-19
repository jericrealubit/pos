"use client"

import { useEffect } from "react"

export function ReceiptAutoPrint({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.print()
  }, [])

  return <>{children}</>
}
