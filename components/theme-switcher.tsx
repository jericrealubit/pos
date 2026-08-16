"use client"

import { useState } from "react"
import { PaletteIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { THEMES, THEME_STORAGE_KEY, DEFAULT_THEME, type Theme } from "@/lib/theme"

function readTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME
  return (document.documentElement.dataset.theme as Theme) ?? DEFAULT_THEME
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  function applyTheme(value: Theme) {
    setTheme(value)
    document.documentElement.setAttribute("data-theme", value)
    localStorage.setItem(THEME_STORAGE_KEY, value)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="ghost" size="icon" aria-label="Change theme" />
        }
      >
        <PaletteIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => applyTheme(value as Theme)}
        >
          {THEMES.map((t) => (
            <DropdownMenuRadioItem key={t.value} value={t.value}>
              {t.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
