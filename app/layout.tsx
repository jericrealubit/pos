import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cpos.au"),
  title: "Counter — POS & Book",
  description: "Mobile-first POS and pay-later book for a single retail store.",
  applicationName: "Counter",
  // Launched full-screen from the home screen on iOS (Android reads the
  // manifest instead). Keeps the till out of a browser chrome frame.
  appleWebApp: {
    capable: true,
    title: "Counter",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // `viewport-fit: cover` is what actually gives the app non-zero
  // env(safe-area-inset-*) values — the till's sticky bottom action bars
  // already depend on them. Zoom is left enabled for accessibility.
  viewportFit: "cover",
  themeColor: "#097c87",
};

// Runs before first paint so the stored theme applies immediately —
// without this, the page would flash the default theme then swap.
const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||${JSON.stringify(DEFAULT_THEME)};document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
