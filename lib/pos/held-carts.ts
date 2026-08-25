import { cartItemCount, cartTotalCents, type CartState } from "@/lib/pos/cart-reducer"

// A parked sale, separate from the single active-cart persistence in
// sell-provider.tsx (localStorage key "counter:cart") — that one exists to
// survive a crash/tab-close of the sale in progress; this is a deliberate
// multi-slot "put this customer aside, help the next one" list the cashier
// controls directly.
export type HeldCart = {
  id: string
  savedAt: number
  label: string
  state: CartState
}

const STORAGE_KEY = "counter:held-carts"
export const MAX_HELD_CARTS = 5

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export function loadHeldCarts(): HeldCart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HeldCart[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHeldCarts(carts: HeldCart[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carts))
  } catch {
    // storage full/unavailable — the caller's in-memory state still works
    // for this session, it just won't survive a reload
  }
}

/**
 * Adds a held cart, newest first. Returns null (and holds nothing) if
 * already at MAX_HELD_CARTS — the caller should tell the cashier to resume
 * or discard one first rather than silently losing a cart.
 */
export function addHeldCart(state: CartState): HeldCart | null {
  const existing = loadHeldCarts()
  if (existing.length >= MAX_HELD_CARTS) return null

  const held: HeldCart = {
    id: crypto.randomUUID(),
    savedAt: Date.now(),
    label: `${cartItemCount(state.lines)} item${cartItemCount(state.lines) === 1 ? "" : "s"} · ${formatTime(Date.now())}`,
    state,
  }
  saveHeldCarts([held, ...existing])
  return held
}

export function removeHeldCart(id: string): void {
  saveHeldCarts(loadHeldCarts().filter((c) => c.id !== id))
}

export function heldCartTotalCents(held: HeldCart): number {
  return cartTotalCents(held.state.lines)
}
