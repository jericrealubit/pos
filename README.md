# Counter — POS & Book

A mobile-first point of sale for a single retail store: scan a barcode, ring up a sale, and if a regular customer needs to pay later, it goes straight into their tab instead of a separate notebook. Includes an admin dashboard for products, categories, and customer balances, plus a super-admin console for managing stores across the platform.

**Live site:** [cpos.au](https://cpos.au/)

<!-- screenshot: drop the live-site screenshot here -->

## Features

- **Scan and sell** — camera-based scanning (`BarcodeDetector`, falling back to `@zxing/browser`) or a plugged-in USB/Bluetooth barcode reader
- **The pay-later book** — unpaid sales attach to a named customer and accumulate into an itemised running balance
- **Admin dashboard** — product/category CRUD, customer balances, sortable/filterable/paginated tables
- **Super-admin console** — cross-store view for platform operators, including pausing a store's access
- **Four switchable themes**, including a dark "night till" mode, applied instantly with no flash on load
- **Responsive till** — a real two-pane desktop layout for scanning + cart, alongside the original mobile-first flow

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Server Components for reads, Server Actions for writes |
| UI | Tailwind CSS v4 + shadcn/ui ("base-nova", base-ui/react primitives) | Owned components in `components/ui`, CSS-first theming via `app/globals.css` |
| Database | Supabase Postgres | SQL migrations via the Supabase CLI, checked into `supabase/migrations` |
| Auth | Supabase Auth (email + password) | `@supabase/ssr` for cookie-based sessions |
| Access control | Postgres Row Level Security | Store scoping lives in the database, not in application queries |
| Types | `supabase gen types typescript` | Generated into `lib/database.types.ts`, regenerated on every migration |
| Tables | TanStack Table | Custom `DataTable`/`DataList` components — sorting, search, filtering, pagination |
| Forms | react-hook-form + zod | Schemas in `lib/schemas`, reused for both client and server-side validation |
| Hosting | Vercel | |

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase project's values:
   ```bash
   cp .env.local.example .env.local
   ```
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
3. Link the Supabase CLI to your project and push the schema:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

> The camera scanner needs HTTPS, including in local dev — use `npm run dev:https` (or a tunnel like ngrok) if you're testing camera scanning from a phone on your local network.
