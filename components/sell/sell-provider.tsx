"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useTransition,
} from "react"
import { usePathname } from "next/navigation"

import { lookupByBarcode } from "@/app/actions/sales"
import {
  cartReducer,
  cartItemCount,
  cartTotalCents,
  emptyCart,
  type CartLine,
  type CartState,
} from "@/lib/pos/cart-reducer"
import { addHeldCart, loadHeldCarts, removeHeldCart, type HeldCart } from "@/lib/pos/held-carts"
import { playSuccessBeep } from "@/lib/pos/beep"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"
import { HardwareScannerInput } from "@/components/sell/hardware-scanner-input"
import { UnknownBarcodeDialog } from "@/components/sell/unknown-barcode-dialog"

const STORAGE_KEY = "counter:cart"
// localStorage (not sessionStorage) so an in-progress sale survives a tab
// close, a browser crash, or an accidental navigation away — not just an
// in-tab reload. Guarded by an age check so a cart abandoned yesterday
// doesn't silently reappear at the till the next morning.
const CART_MAX_AGE_MS = 12 * 60 * 60 * 1000 // 12 hours
const SCANNER_ROUTES = ["/sell", "/sell/scan"]

type PersistedCart = { savedAt: number; state: CartState }

type Role = "OWNER" | "ADMIN" | "CASHIER"

type SellContextValue = {
  lines: CartLine[]
  totalCents: number
  itemCount: number
  setQuantity: (productId: string, quantity: number) => void
  removeLine: (productId: string) => void
  clear: () => void
  onBarcode: (code: string) => void
  scanPending: boolean
  justAddedProductId: string | null
  role: Role
  currency: string
  canManageProducts: boolean
  /** Premium: the pay-later book is unlocked. False on the Free tier. */
  canUsePayLater: boolean
  heldCarts: HeldCart[]
  /** false if already at the held-cart cap — nothing was held. */
  holdCurrentCart: () => boolean
  resumeHeldCart: (id: string) => void
  discardHeldCart: (id: string) => void
}

const SellContext = createContext<SellContextValue | null>(null)

export function useSellCart() {
  const ctx = useContext(SellContext)
  if (!ctx) throw new Error("useSellCart must be used within SellProvider")
  return ctx
}

export function SellProvider({
  children,
  role,
  currency,
  canUsePayLater,
}: {
  children: React.ReactNode
  role: Role
  currency: string
  canUsePayLater: boolean
}) {
  const [state, dispatch] = useReducer(cartReducer, emptyCart)
  const [hydrated, setHydrated] = useState(false)
  const [justAddedProductId, setJustAddedProductId] = useState<string | null>(null)
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null)
  const [scanPending, startScanTransition] = useTransition()
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([])
  const pathname = usePathname()

  // Hydrate from localStorage after mount, not in a lazy initializer —
  // the first client render must match the server's empty-cart render.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedCart
        const fresh = Date.now() - parsed.savedAt < CART_MAX_AGE_MS
        if (fresh && parsed.state?.lines?.length) {
          dispatch({ type: "HYDRATE", state: parsed.state })
        } else {
          // Stale or empty — drop it so it can't resurface later.
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {
      // corrupt/unavailable storage — start with an empty cart
    }
    // One-time sync from a browser-only external system (localStorage isn't
    // available during SSR) — the correct use of an effect, not the
    // cascading-render case this rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeldCarts(loadHeldCarts())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      if (state.lines.length === 0) {
        // Keep storage clean: a cleared cart (e.g. after a completed sale)
        // shouldn't leave a stub that a later mount tries to restore.
        localStorage.removeItem(STORAGE_KEY)
      } else {
        const payload: PersistedCart = { savedAt: Date.now(), state }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      }
    } catch {
      // storage full/unavailable — the in-memory cart still works
    }
  }, [state, hydrated])

  const onBarcode = useCallback((code: string) => {
    startScanTransition(async () => {
      const result = await lookupByBarcode(code)
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not look up that barcode.", type: "error" })
        return
      }
      if (!result.data) {
        setUnknownBarcode(code)
        return
      }

      const product = result.data
      dispatch({
        type: "ADD_OR_INCREMENT",
        product: {
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          size: product.size,
          priceCents: product.price_cents,
        },
      })
      playSuccessBeep()
      setJustAddedProductId(product.id)
      window.setTimeout(() => {
        setJustAddedProductId((current) => (current === product.id ? null : current))
      }, 1200)
    })
  }, [])

  const holdCurrentCart = useCallback((): boolean => {
    const held = addHeldCart(state)
    if (!held) return false
    setHeldCarts((prev) => [held, ...prev])
    dispatch({ type: "CLEAR" })
    return true
  }, [state])

  const resumeHeldCart = useCallback(
    (id: string) => {
      const held = heldCarts.find((c) => c.id === id)
      if (!held) return
      dispatch({ type: "HYDRATE", state: held.state })
      removeHeldCart(id)
      setHeldCarts((prev) => prev.filter((c) => c.id !== id))
    },
    [heldCarts]
  )

  const discardHeldCart = useCallback((id: string) => {
    removeHeldCart(id)
    setHeldCarts((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const value = useMemo<SellContextValue>(
    () => ({
      lines: state.lines,
      totalCents: cartTotalCents(state.lines),
      itemCount: cartItemCount(state.lines),
      setQuantity: (productId, quantity) =>
        dispatch({ type: "SET_QUANTITY", productId, quantity }),
      removeLine: (productId) => dispatch({ type: "REMOVE_LINE", productId }),
      clear: () => dispatch({ type: "CLEAR" }),
      onBarcode,
      scanPending,
      justAddedProductId,
      role,
      currency,
      canManageProducts: role === "OWNER" || role === "ADMIN",
      canUsePayLater,
      heldCarts,
      holdCurrentCart,
      resumeHeldCart,
      discardHeldCart,
    }),
    [
      state,
      onBarcode,
      scanPending,
      justAddedProductId,
      role,
      currency,
      canUsePayLater,
      heldCarts,
      holdCurrentCart,
      resumeHeldCart,
      discardHeldCart,
    ]
  )

  const scannerEnabled = SCANNER_ROUTES.includes(pathname)

  return (
    <SellContext.Provider value={value}>
      {children}
      {scanPending && (
        <div className="fixed top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-popover px-3 py-1 text-xs text-muted-foreground shadow-sm">
          <Spinner className="size-3.5" /> Looking up…
        </div>
      )}
      <HardwareScannerInput enabled={scannerEnabled} onScan={onBarcode} />
      <UnknownBarcodeDialog
        barcode={unknownBarcode}
        canManageProducts={value.canManageProducts}
        onOpenChange={(open) => {
          if (!open) setUnknownBarcode(null)
        }}
      />
    </SellContext.Provider>
  )
}
