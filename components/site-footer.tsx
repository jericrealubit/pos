import Link from "next/link"
import { Flame } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t p-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
      <span className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
        &copy; {new Date().getFullYear()} Counter, by{" "}
        <a
          href="https://waai.au/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          WA AI Digital
        </a>
        <Link href="/terms" className="hover:text-foreground">
          Terms &amp; Privacy
        </Link>
      </span>

      {/* Build credit — flame + smoke, aria-hidden. A 16px decorative badge, not
          motion in the reading path, so it animates unconditionally rather than
          deferring to prefers-reduced-motion. */}
      <div className="relative flex items-center gap-2 self-start overflow-visible rounded-full border border-border bg-muted px-3.5 py-1.5 font-mono text-xs text-muted-foreground sm:self-auto">
        <span
          aria-hidden="true"
          className="relative flex h-4 w-4 shrink-0 items-end justify-center overflow-visible"
        >
          <span className="pointer-events-none absolute bottom-3 h-2 w-2 rounded-full bg-muted-foreground/60 blur-[2px] animate-smoke-1" />
          <span className="pointer-events-none absolute bottom-3 left-0 h-2.5 w-2.5 rounded-full bg-primary/45 blur-[3px] animate-smoke-2" />
          <span className="pointer-events-none absolute bottom-3 right-0 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 blur-[2px] animate-smoke-3" />
          <Flame className="h-4 w-4 origin-bottom text-primary animate-flame" />
        </span>

        <span className="text-foreground">Smoked &amp; Coded by:</span>

        <a
          href="https://www.linkedin.com/in/jericrealubit"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1 font-semibold text-primary transition duration-200 hover:text-primary/80"
        >
          jeric
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-3.5 w-3.5 fill-current transition-transform group-hover:scale-110"
          >
            <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.11 20.45H3.56V9h3.55v11.45Z" />
          </svg>
          <span className="sr-only"> — LinkedIn profile</span>
        </a>
      </div>
    </footer>
  )
}
