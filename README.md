# Counter — POS & Book

A mobile-first point of sale for a single retail store: scan a barcode, ring up a sale, and if a regular customer needs to pay later, it goes straight into their tab instead of a separate notebook. Includes an admin dashboard for products, categories, and customer balances, plus a super-admin console for managing stores across the platform.

**Live site:** [cpos.au](https://cpos.au/) — see the [About page](https://cpos.au/about) for a plain-language walkthrough of what it does, the tech stack, and how to reach the developer.

<!-- screenshot: drop the live-site screenshot here -->

## Features

- **Scan and sell** — camera-based scanning (`BarcodeDetector`, falling back to `@zxing/browser`) or a plugged-in USB/Bluetooth barcode reader
- **The pay-later book** — unpaid sales attach to a named customer and accumulate into an itemised running balance
- **Admin dashboard** — product/category CRUD, customer balances, sortable/filterable/paginated tables
- **Super-admin console** — cross-store view for platform operators, including pausing a store's access
- **Freemium billing** — a 90-day trial, then Free (the till stays fully usable) or Premium (pay-later book, reports, emailed receipts), enforced by a single `paid_until` field (`lib/billing.ts`)
- **Sales tools** — discounts, multi-tender checkout (cash/card/e-wallet) with change due, holding and resuming a sale
- **Reports & receipts** — Recharts-based analytics, CSV exports, and PDF/emailed receipts with a store-configurable footer message
- **Staff accounts** — email invites with role-based access (owner/admin/cashier)
- **Installable** — a PWA manifest so the till can be added to a phone's home screen and launched full-screen
- **Admin command palette** — ⌘K/Ctrl+K quick navigation and actions
- **Four switchable themes**, including a dark "night till" mode, applied instantly with no flash on load
- **Responsive till** — a real two-pane desktop layout for scanning + cart, alongside the original mobile-first flow
- **Accessibility & resilience polish** — a skip link, `prefers-reduced-motion` support, styled error boundaries, and haptic scan feedback

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
| Charts | Recharts | Revenue, top-product, and sales-pattern charts in the reports dashboard |
| PDFs | pdf-lib | Generates downloadable/emailed PDF receipts (`lib/receipt-pdf.ts`) |
| Email | Resend | Staff invites and receipts, via a raw HTTP `fetch` (no SDK) — `lib/email/send.ts` |
| Command palette | cmdk | Unstyled primitives behind the admin ⌘K palette (`components/ui/command.tsx`) |
| Hosting | Cloudflare Workers | Via the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare) (`@opennextjs/cloudflare`) |

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

   # Optional — transactional email (staff invites, receipts). Features that
   # send email degrade gracefully (e.g. staff invites fall back to a
   # copy-link) if these are unset. Requires a Resend account with a
   # verified sending domain.
   RESEND_API_KEY=
   RESEND_FROM=
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

## Deploying to Cloudflare

This app deploys to Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). Config lives in `open-next.config.ts` and `wrangler.jsonc`.

1. `npx wrangler login` — one-time Cloudflare account authorization.
2. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are committed directly in `wrangler.jsonc`'s `vars` — this is deliberate, not an oversight. Once a Wrangler config file exists, **it is the source of truth**: every `wrangler deploy` overwrites whatever's set in the Cloudflare dashboard's "Variables and Secrets" UI with whatever's (or isn't) in this file. Setting these two only in the dashboard means the next deploy silently wipes them and the Worker 500s on every request (middleware runs on all of them). Both values are safe to commit — they're `NEXT_PUBLIC_*`, meant to be exposed to every browser client and protected server-side by Supabase RLS, not secrets. Never add `SUPABASE_SERVICE_ROLE_KEY` here or to the Worker's dashboard vars — it's only used by the local `scripts/create-super-admin.mjs` utility, never by the deployed app, and as a real secret it belongs in `wrangler secret put` if it's ever needed at runtime, not in plaintext `vars`.
3. `npm run preview` — builds and boots the app locally under Cloudflare's actual Workers runtime (not just `next dev`), for a final check before deploying.
4. `npm run deploy` — builds and pushes to your Cloudflare account.

For local development with `next dev`, copy the two `NEXT_PUBLIC_*` values into `.dev.vars` (gitignored) so `npm run preview` has what it needs.

## Backups

See [BACKUPS.md](./BACKUPS.md) — what's backed up, how to set up the automated daily backup to Cloudflare R2, and how to restore.

## Author

Built and maintained by [Jeric Realubit](https://www.linkedin.com/in/jericrealubit).
