"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { useSellCart } from "@/components/sell/sell-provider"
import { TillAppBar } from "@/components/sell/till-app-bar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"
import { searchCustomers, customerCreate, type CustomerBalance } from "@/app/actions/customers"
import { createSale } from "@/app/actions/sales"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"

const SEARCH_DEBOUNCE_MS = 250

export function CustomerScreen() {
  const router = useRouter()
  const { lines, itemCount, totalCents, currency, clear } = useSellCart()
  const [query, setQuery] = useState("")
  const [rawMatches, setRawMatches] = useState<CustomerBalance[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<number | null>(null)
  // clear() empties the cart synchronously, re-rendering this screen while
  // the router.push navigation is still in flight — this flag stops that
  // re-render from hitting the empty-cart branches below.
  const leavingRef = useRef(false)

  // Derived, not stored: an empty query has no matches regardless of
  // whatever the last debounced search happened to return.
  const matches = query.trim() ? rawMatches : []

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (!query.trim()) return

    // Kicking off a debounced call to an external system (the server
    // search), not deriving a value from existing state — the correct
    // use of an effect, not the cascading-render case this rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSearching(true)
    debounceRef.current = window.setTimeout(() => {
      searchCustomers(query).then((result) => {
        if (result.ok) setRawMatches(result.data)
        setIsSearching(false)
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query])

  function completeSale(customerId: string) {
    startTransition(async () => {
      const result = await createSale({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        status: "UNPAID",
        customerId,
      })
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not complete the sale.", type: "error" })
        return
      }
      leavingRef.current = true
      clear()
      router.push(`/sell/done/${result.data.saleId}`)
    })
  }

  function createAndComplete() {
    const name = query.trim()
    if (!name) return
    startTransition(async () => {
      const created = await customerCreate({ name })
      if (!created.ok) {
        toast.add({ title: created.formError ?? "Could not add the customer.", type: "error" })
        return
      }
      const result = await createSale({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        status: "UNPAID",
        customerId: created.data.id,
      })
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not complete the sale.", type: "error" })
        return
      }
      leavingRef.current = true
      clear()
      router.push(`/sell/done/${result.data.saleId}`)
    })
  }

  if (leavingRef.current) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="size-5" />
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <TillAppBar backHref="/sell/cart" title="Pay later" />
        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
        <Button type="button" size="till" onClick={() => router.push("/sell/scan")}>
          Scan an item
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <TillAppBar backHref="/sell/cart" title="Pay later" />

      <div>
        <h1 className="text-lg font-semibold">Whose book?</h1>
        <p className="text-sm text-muted-foreground">
          {formatMoney(totalCents, currency)} across {itemCount} item{itemCount === 1 ? "" : "s"}
        </p>
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Start typing a name…"
        className="h-11 text-base"
        autoFocus
        disabled={isPending}
      />

      {query.trim() && (
        <div>
          <div className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Matches
          </div>
          {isSearching ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Spinner className="size-3.5" /> Searching…
            </p>
          ) : matches.length > 0 ? (
            <div className="divide-y rounded-lg border">
              {matches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => completeSale(c.id)}
                  className="flex w-full items-center gap-3 p-3 text-left text-sm disabled:opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.phone ? `${c.phone} · ` : ""}
                      owes {formatMoney(c.balance_cents, currency)}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isPending ? <Spinner className="size-3.5" /> : "Select"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No matches.</p>
          )}

          <Button
            type="button"
            variant="ghost"
            size="till"
            className="mt-3 w-full gap-1.5"
            disabled={isPending}
            onClick={createAndComplete}
          >
            {isPending && <Spinner className="size-3.5" />}
            + New customer — &ldquo;{query.trim()}&rdquo;
          </Button>
        </div>
      )}

      <p className="border-l-2 pl-3 text-xs text-muted-foreground">
        New customer needs a name only. A phone number is optional but is the one field that
        makes chasing a balance possible later — add it from the admin customer page.
      </p>
    </div>
  )
}
