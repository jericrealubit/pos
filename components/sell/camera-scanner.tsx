"use client"

import { useEffect, useRef, useState } from "react"
import { FlashlightIcon, FlashlightOffIcon } from "lucide-react"

import { createBarcodeEngine, type BarcodeEngine } from "@/lib/pos/barcode-detection"
import { Button } from "@/components/ui/button"

type CameraState = "requesting" | "active" | "denied" | "unavailable"

// A code fires many times a second while it's held in frame. Debouncing by
// "time since last fire" still double-counts if the item is held longer
// than the window (very easy — repositioning, autofocus settling). Instead
// track continuous presence: only re-fire once the code has been genuinely
// absent for this long, meaning the item actually left frame.
const PRESENCE_GONE_MS = 700

export function CameraScanner({
  onDetect,
  stopAfterFirst,
}: {
  onDetect: (code: string) => void
  stopAfterFirst?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const engineRef = useRef<BarcodeEngine | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const activeCodeRef = useRef<{ code: string; lastSeenAt: number } | null>(null)
  const [state, setState] = useState<CameraState>("requesting")
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function setup() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setState("unavailable")
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const track = stream.getVideoTracks()[0]
        const caps = track?.getCapabilities?.() as
          | (MediaTrackCapabilities & { torch?: boolean })
          | undefined
        setTorchSupported(!!caps?.torch)

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play().catch(() => {})

        const engine = await createBarcodeEngine()
        if (cancelled) {
          engine.stop()
          return
        }
        engineRef.current = engine
        engine.start(video, (code) => {
          const now = Date.now()
          const active = activeCodeRef.current
          if (active && active.code === code && now - active.lastSeenAt < PRESENCE_GONE_MS) {
            // Same item, still sitting in frame — refresh presence, don't re-fire.
            activeCodeRef.current = { code, lastSeenAt: now }
            return
          }
          activeCodeRef.current = { code, lastSeenAt: now }
          onDetect(code)
          if (stopAfterFirst) {
            engineRef.current?.stop()
            streamRef.current?.getTracks().forEach((t) => t.stop())
          }
        })
        setState("active")
      } catch {
        if (!cancelled) setState("denied")
      }
    }

    setup()

    return () => {
      cancelled = true
      engineRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [onDetect, stopAfterFirst])

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({
        advanced: [{ torch: next }],
      } as unknown as MediaTrackConstraints)
      setTorchOn(next)
    } catch {
      // torch toggle failed silently — button stays in its previous state
    }
  }

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-lg border bg-black"
      style={{ aspectRatio: "4 / 3" }}
    >
      <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

      {state === "requesting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-white">
          Requesting camera…
        </div>
      )}
      {(state === "denied" || state === "unavailable") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/85 p-4 text-center text-sm text-white">
          <p>{state === "denied" ? "Camera unavailable." : "No camera on this device."}</p>
          <p className="text-xs text-white/70">Type the barcode below instead.</p>
        </div>
      )}

      {state === "active" && torchSupported && (
        <Button
          type="button"
          size="icon-till"
          variant="outline"
          className="absolute top-2 right-2 border-white/30 bg-black/40 text-white hover:bg-black/60"
          onClick={toggleTorch}
          aria-label={torchOn ? "Turn off torch" : "Turn on torch"}
        >
          {torchOn ? <FlashlightOffIcon /> : <FlashlightIcon />}
        </Button>
      )}
    </div>
  )
}
