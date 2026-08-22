/**
 * Subscription pricing and access state.
 *
 * `paid_until` on the store row is the single source of truth for
 * access — it covers the free trial and paid periods identically, so
 * there is no status field to keep in sync. Everything here is pure
 * and framework-free so the gate (lib/dal.ts), the trial banner, the
 * billing page and the public pricing page all derive the same
 * numbers from it.
 */

export const TRIAL_DAYS = 90

/**
 * Days past `paid_until` that a store keeps working. Deliberately
 * generous: at these prices the revenue protected by a tight window is
 * worth less than one support conversation about a bank transfer that
 * landed on the Monday.
 */
export const GRACE_DAYS = 7

/** Only start nagging about renewal inside this window. */
export const RENEWAL_BANNER_DAYS = 14

export type Region = {
  /** ISO 4217, also written to stores.currency at registration. */
  currency: string
  /** Minor units, matching the price_cents convention used throughout. */
  monthly: number
  annual: number
  /**
   * Whether monthly is offered at all. False for PH: at ₱50 a month a
   * payment processor's fixed per-transaction fee eats 30-40% of the
   * take, while the same fee on ₱500 a year is ~5%. Annual there works
   * out cheaper per month anyway (~₱42), so it is a better offer, not
   * a restriction.
   */
  monthlyAvailable: boolean
}

/**
 * Prices are set per market, not converted. PH is ~73% below the AUD
 * price because the target customer is a sari-sari store, not because
 * of any exchange rate. NZ reuses the AU numerals rather than a
 * converted figure — NZ$5 is a cleaner price than NZ$5.40.
 *
 * Adding a market is one line here. A rest-of-world price of US$50/yr
 * is right for the US, UK, EU and Canada and wrong for lower-income
 * markets; when signups from one of those show up in the super-admin
 * console, add it here at roughly the PH level rather than leaving
 * those stores to churn at the trial wall.
 */
export const REGIONS = {
  AU: { currency: "AUD", monthly: 500, annual: 5000, monthlyAvailable: true },
  NZ: { currency: "NZD", monthly: 500, annual: 5000, monthlyAvailable: true },
  PH: { currency: "PHP", monthly: 5000, annual: 50000, monthlyAvailable: false },
  DEFAULT: { currency: "USD", monthly: 500, annual: 5000, monthlyAvailable: true },
} as const satisfies Record<string, Region>

export type RegionCode = keyof typeof REGIONS

/** Regions a visitor can pick between on the pricing page. */
export const PRICED_REGIONS = ["AU", "NZ", "PH", "DEFAULT"] as const

export const REGION_LABELS: Record<RegionCode, string> = {
  AU: "Australia",
  NZ: "New Zealand",
  PH: "Philippines",
  DEFAULT: "Rest of world",
}

export function regionFor(country?: string | null): Region {
  if (!country) return REGIONS.DEFAULT
  const code = country.toUpperCase()
  // DEFAULT is a fallback bucket, not a country — don't let the string
  // "DEFAULT" arriving as a country code resolve to itself.
  if (code === "DEFAULT") return REGIONS.DEFAULT
  return (REGIONS as Record<string, Region>)[code] ?? REGIONS.DEFAULT
}

export function regionCodeFor(country?: string | null): RegionCode {
  if (!country) return "DEFAULT"
  const code = country.toUpperCase()
  return code !== "DEFAULT" && code in REGIONS ? (code as RegionCode) : "DEFAULT"
}

/** Currency to stamp on a new store, given the country it registered from. */
export function currencyForCountry(country?: string | null): string {
  return regionFor(country).currency
}

const DAY_MS = 86_400_000

export type BillingState = {
  /** The store may ring up sales. */
  isActive: boolean
  /** Still inside the free trial (never paid). */
  isTrialing: boolean
  /** Past paid_until but inside the grace window — still active. */
  inGrace: boolean
  /**
   * Whole days until paid_until, rounded up. Negative once past it,
   * so `daysRemaining > -GRACE_DAYS` is the access test.
   */
  daysRemaining: number
  paidUntil: Date | null
  /** Worth showing a renewal prompt. */
  shouldWarn: boolean
}

type BillingRow = {
  plan?: string | null
  paid_until?: string | null
}

export function getBillingState(store: BillingRow | null | undefined, now = new Date()): BillingState {
  const paidUntil = store?.paid_until ? new Date(store.paid_until) : null

  // A null paid_until cannot occur: 0017 backfills every existing
  // store and create_store_and_profile always sets a trial. Treat it
  // as expired rather than active anyway — a store wrongly locked out
  // is loud and fixable from the super-admin console in one click,
  // whereas silently giving the product away is invisible.
  if (!paidUntil || Number.isNaN(paidUntil.getTime())) {
    return {
      isActive: false,
      isTrialing: false,
      inGrace: false,
      daysRemaining: 0,
      paidUntil: null,
      shouldWarn: true,
    }
  }

  const daysRemaining = Math.ceil((paidUntil.getTime() - now.getTime()) / DAY_MS)
  const isExpired = daysRemaining <= 0
  const inGrace = isExpired && daysRemaining > -GRACE_DAYS

  return {
    isActive: !isExpired || inGrace,
    isTrialing: store?.plan === "TRIAL",
    inGrace,
    daysRemaining,
    paidUntil,
    shouldWarn: daysRemaining <= RENEWAL_BANNER_DAYS,
  }
}
