"use client"

import { useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// A first-class input, not a fallback — torn labels and loose produce are
// a daily reality at the till, not an edge case.
export function ManualBarcodeEntry({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue("")
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Or type the barcode…"
        inputMode="numeric"
        className="h-11 text-base"
        aria-label="Barcode"
      />
      <Button type="submit" size="till" variant="outline">
        Add
      </Button>
    </form>
  )
}
