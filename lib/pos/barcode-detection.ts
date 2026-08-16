// Minimal ambient type for the experimental BarcodeDetector API — not yet
// part of TypeScript's DOM lib. Chromium-only (desktop/Android Chrome, Edge).
type DetectedBarcode = { rawValue: string }
type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike

const BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "code_128"]

export type BarcodeEngine = {
  start(video: HTMLVideoElement, onDetect: (code: string) => void): void
  stop(): void
}

function getNativeDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector ?? null
}

export function supportsNativeBarcodeDetector(): boolean {
  return getNativeDetectorCtor() != null
}

function createNativeEngine(): BarcodeEngine {
  const Ctor = getNativeDetectorCtor()!
  const detector = new Ctor({ formats: BARCODE_FORMATS })
  let intervalId: number | null = null

  return {
    start(video, onDetect) {
      intervalId = window.setInterval(() => {
        if (video.readyState < video.HAVE_CURRENT_DATA) return
        detector
          .detect(video)
          .then((results) => {
            if (results.length > 0) onDetect(results[0].rawValue)
          })
          .catch(() => {
            // transient per-frame decode failures are expected; ignore
          })
      }, 200)
    },
    stop() {
      if (intervalId != null) window.clearInterval(intervalId)
      intervalId = null
    },
  }
}

async function createZXingEngine(): Promise<BarcodeEngine> {
  // Dynamically imported so Chromium users (the common case) never
  // download the zxing bundle at all.
  const { BrowserMultiFormatReader } = await import("@zxing/browser")
  const reader = new BrowserMultiFormatReader()
  let controls: { stop: () => void } | null = null

  return {
    start(video, onDetect) {
      const stream = video.srcObject as MediaStream | null
      if (!stream) return
      reader
        .decodeFromStream(stream, video, (result) => {
          if (result) onDetect(result.getText())
        })
        .then((c) => {
          controls = c
        })
        .catch(() => {
          // stream ended or decode setup failed; caller's error state handles this
        })
    },
    stop() {
      controls?.stop()
      controls = null
    },
  }
}

export function createBarcodeEngine(): Promise<BarcodeEngine> {
  if (supportsNativeBarcodeDetector()) {
    return Promise.resolve(createNativeEngine())
  }
  return createZXingEngine()
}
