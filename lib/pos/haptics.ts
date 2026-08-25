// navigator.vibrate is unsupported on iOS Safari and desktop browsers —
// feature-detected and silently a no-op there, same pattern as beep.ts.
export function vibrateSuccess() {
  if (typeof navigator === "undefined" || !navigator.vibrate) return
  navigator.vibrate(30)
}

export function vibrateError() {
  if (typeof navigator === "undefined" || !navigator.vibrate) return
  navigator.vibrate([30, 50, 30])
}
