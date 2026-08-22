/**
 * Country codes offered at registration.
 *
 * Only the codes are stored; names are rendered with Intl.DisplayNames
 * so there is no parallel list of names to keep correct. The locale is
 * pinned to "en" rather than left to the runtime for the same reason
 * formatMoney pins it — the server's locale and the browser's don't
 * always agree, and a mismatch is a hydration error.
 */

export const COUNTRY_CODES = [
  "AU", "NZ", "PH", // priced regions first — see lib/billing.ts
  "AE", "AR", "AT", "BD", "BE", "BR", "CA", "CH", "CL", "CN", "CO", "CZ",
  "DE", "DK", "EG", "ES", "ET", "FI", "FJ", "FR", "GB", "GH", "GR", "HK",
  "HU", "ID", "IE", "IL", "IN", "IT", "JP", "KE", "KH", "KR", "LK", "MA",
  "MX", "MY", "NG", "NL", "NO", "NP", "PE", "PG", "PK", "PL", "PT", "RO",
  "SA", "SE", "SG", "TH", "TR", "TW", "TZ", "UA", "UG", "US", "VN", "ZA",
] as const

export type CountryCode = (typeof COUNTRY_CODES)[number]

const displayNames = new Intl.DisplayNames(["en"], { type: "region" })

export function countryName(code: string): string {
  try {
    return displayNames.of(code.toUpperCase()) ?? code
  } catch {
    // Intl throws on a structurally invalid code (e.g. a junk header).
    return code
  }
}

export function isKnownCountry(code: string | null | undefined): code is CountryCode {
  return !!code && (COUNTRY_CODES as readonly string[]).includes(code.toUpperCase())
}

/** Countries in the select, priced regions pinned to the top. */
export const COUNTRY_OPTIONS = [
  ...COUNTRY_CODES.slice(0, 3),
  ...COUNTRY_CODES.slice(3)
    .slice()
    .sort((a, b) => countryName(a).localeCompare(countryName(b))),
].map((code) => ({ code, name: countryName(code) }))
