import type { MetadataRoute } from "next"

// Makes Counter installable to a phone's home screen and launchable
// full-screen, so the till behaves like a native app rather than a browser
// tab. `start_url` opens straight into the till — the surface a cashier
// installs it for; an unauthenticated launch still redirects to /signin.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Counter — POS & Book",
    short_name: "Counter",
    description: "Mobile-first POS and pay-later book for a single retail store.",
    start_url: "/sell",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Tropical (default theme) surface + brand teal, matching app/globals.css.
    background_color: "#ffffff",
    theme_color: "#097c87",
    categories: ["business", "shopping", "productivity"],
    icons: [
      // One 512×512 source (public/logo-mark.png), declared at both sizes so
      // Chrome's installability check (needs 192 and 512) is satisfied; the
      // browser downscales for the smaller slot.
      { src: "/logo-mark.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo-mark.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  }
}
