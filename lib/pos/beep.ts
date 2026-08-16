let audioContext: AudioContext | null = null

// Web Audio oscillator instead of a bundled audio file: zero asset weight,
// and creating the context lazily inside a scan handler (a user gesture)
// sidesteps the browser's autoplay-policy restriction.
export function playSuccessBeep() {
  if (typeof window === "undefined") return
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return

  audioContext ??= new Ctor()
  const ctx = audioContext
  if (ctx.state === "suspended") void ctx.resume()

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = "sine"
  oscillator.frequency.value = 1800
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.1)
}
