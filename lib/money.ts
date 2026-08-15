export function dollarsToCents(dollars: string): number {
  const [whole, frac = ""] = dollars.trim().split(".")
  const cents = (frac + "00").slice(0, 2)
  return Number(whole || "0") * 100 + Number(cents || "0")
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100)
}
