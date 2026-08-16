export const THEMES = [
  { value: "tropical", label: "Tropical jade sunrise" },
  { value: "neutral", label: "Neutral elegance" },
  { value: "pastels", label: "Rainbow pastels" },
  { value: "dark", label: "Dark" },
] as const

export type Theme = (typeof THEMES)[number]["value"]

export const DEFAULT_THEME: Theme = "tropical"

export const THEME_STORAGE_KEY = "pos-theme"
