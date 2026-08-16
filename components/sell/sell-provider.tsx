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
} from "@/lib/pos/cart-reducer"
import { playSuccessBeep } from "@/lib/pos/beep"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"
import { HardwareScannerInput } from "@/components/sell/hardware-scanner-input"
import { UnknownBarcodeDialog } from "@/components/sell/unknown-barcode-dialog"

const STORAGE_KEY = "counter:cart"
const SCANNER_ROUTES = ["/sell", "/sell/scan"]

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
}: {
  children: React.ReactNode
  role: Role
  currency: string
}) {
  const [state, dispatch] = useReducer(cartReducer, emptyCart)
  const [hydrated, setHydrated] = useState(false)
  const [justAddedProductId, setJustAddedProductId] = useState<string | null>(null)
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null)
  const [scanPending, startScanTransition] = useTransition()
  const pathname = usePathname()

  // Hydrate from sessionStorage after mount, not in a lazy initializer —
  // the first client render must match the server's empty-cart render.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) dispatch({ type: "HYDRATE", state: JSON.parse(raw) })
    } catch {
      // corrupt/unavailable storage — start with an empty cart
    }
    // One-time sync from a browser-only external system (sessionStorage
    // isn't available during SSR) — the correct use of an effect, not the
    // cascading-render case this rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
    }),
    [state.lines, onBarcode, scanPending, justAddedProductId, role, currency]
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
