export function dollarsToCents(dollars: string): number {
  const [whole, frac = ""] = dollars.trim().split(".")
  const cents = (frac + "00").slice(0, 2)
  return Number(whole || "0") * 100 + Number(cents || "0")
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function formatMoney(cents: number, currency = "USD"): string {
  // Locale pinned explicitly (not `undefined`) so server and client render
  // identically — the server process's locale and the browser's don't
  // always agree, which otherwise produces a hydration mismatch.
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100)
}
