import { useCallback, useRef } from "react"

// Keyboard-wedge scanners type fast and press Enter. The heuristic: if at
// least MIN_CHARS characters arrived with an average inter-keystroke gap
// under MAX_AVG_GAP_MS before Enter, treat it as a scan rather than typing.
const MIN_CHARS = 8
const MAX_AVG_GAP_MS = 100

export function useHardwareScannerBuffer({ onScan }: { onScan: (code: string) => void }) {
  const bufferRef = useRef("")
  const firstKeyAtRef = useRef<number | null>(null)
  const lastKeyAtRef = useRef<number | null>(null)

  const reset = useCallback(() => {
    bufferRef.current = ""
    firstKeyAtRef.current = null
    lastKeyAtRef.current = null
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const now = performance.now()

      if (e.key === "Enter") {
        const buffer = bufferRef.current
        const firstAt = firstKeyAtRef.current
        const chars = buffer.length
        const elapsed = firstAt != null ? now - firstAt : Infinity
        const avgGap = chars > 1 ? elapsed / (chars - 1) : Infinity

        reset()

        if (chars >= MIN_CHARS && avgGap < MAX_AVG_GAP_MS) {
          onScan(buffer)
        }
        return
      }

      if (e.key.length !== 1) return // ignore modifier/navigation keys

      if (firstKeyAtRef.current == null) {
        firstKeyAtRef.current = now
      }
      lastKeyAtRef.current = now
      bufferRef.current += e.key
    },
    [onScan, reset]
  )

  return { handleKeyDown }
}
