"use client"

import { useEffect, useRef } from "react"

import { useHardwareScannerBuffer } from "@/hooks/use-hardware-scanner-buffer"

// A USB/Bluetooth barcode reader is a keyboard-wedge device — it types
// into whatever has focus. This input stays invisible and always focused
// while active, so a scan works without anyone clicking anything.
export function HardwareScannerInput({
  enabled,
  onScan,
}: {
  enabled: boolean
  onScan: (code: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { handleKeyDown } = useHardwareScannerBuffer({ onScan })

  useEffect(() => {
    if (!enabled) return
    inputRef.current?.focus()
  }, [enabled])

  if (!enabled) return null

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="none"
      aria-hidden="true"
      tabIndex={-1}
      autoComplete="off"
      className="absolute h-px w-px overflow-hidden opacity-0"
      value=""
      onChange={() => {
        // controlled to a fixed empty value; the buffer hook reads keydown,
        // not this value, so there's nothing to sync here
      }}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        // Only steal focus back if nothing else is intentionally focused
        // (a real input, a dialog, a button) — never fight the cashier.
        window.setTimeout(() => {
          if (document.activeElement === document.body) {
            inputRef.current?.focus()
          }
        }, 0)
      }}
    />
  )
}
