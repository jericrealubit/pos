const FUNCTIONALITY = [
  {
    title: "Scan and sell",
    description:
      "Ring up a sale by scanning with a phone/tablet camera or a plugged-in USB/Bluetooth barcode reader — no dedicated scanner hardware required.",
  },
  {
    title: "The pay-later book",
    description:
      "Regular customers can settle up later instead of at the counter. Unpaid sales attach to a named customer and accumulate into an itemised running balance, replacing a paper tab.",
  },
  {
    title: "Admin dashboard",
    description:
      "Manage products, categories, stock, and customer balances from sortable, searchable, paginated tables — usable from the shop floor or the back office.",
  },
  {
    title: "Super-admin console",
    description:
      "A separate cross-store view for platform operators running Counter for more than one store, including the ability to pause a store's access.",
  },
]

const STACK = [
  {
    name: "Next.js + TypeScript",
    note: "App Router, with Server Components for reads and Server Actions for writes",
  },
  {
    name: "Tailwind CSS v4 + shadcn/ui",
    note: "base-ui/react primitives, CSS-first theming with four switchable themes",
  },
  {
    name: "Supabase",
    note: "Postgres, Auth, and Row Level Security — store scoping lives in the database itself",
  },
  {
    name: "TanStack Table",
    note: "Powers the sortable, filterable, paginated admin tables",
  },
  {
    name: "react-hook-form + zod",
    note: "Shared validation schemas on both the client and the server",
  },
  {
    name: "Cloudflare Workers",
    note: "Deployed via the OpenNext Cloudflare adapter",
  },
]

export default function AboutPage() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-10 py-8">
      <div>
        <h1 className="text-3xl font-semibold">About Counter</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Counter is a point of sale built for a single small retail store — the kind of shop
          where the person ringing up a sale might also be the one restocking shelves and
          keeping track of who still owes money. It replaces a separate notebook for customer
          tabs with one running system: scan an item, ring it up, and either take payment on the
          spot or put it straight onto a regular customer&apos;s account to settle later.
        </p>
        <p className="mt-3 text-base text-muted-foreground">
          Beyond the till itself, an admin dashboard handles the day-to-day of running the store
          — products, categories, stock levels, and every customer&apos;s balance — while a
          separate super-admin console lets a platform operator oversee multiple stores at once.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">What it does</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FUNCTIONALITY.map((item) => (
            <div key={item.title} className="rounded-lg border p-4 text-left">
              <div className="text-sm font-medium">{item.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Built with</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {STACK.map((item) => (
            <div key={item.name} className="rounded-lg border p-4 text-left">
              <div className="text-sm font-medium">{item.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Developer</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Counter is built and maintained by{" "}
          <a
            href="https://www.linkedin.com/in/jericrealubit"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:text-primary/80"
          >
            Jeric Realubit
          </a>
          . Feel free to reach out on LinkedIn.
        </p>
      </div>
    </div>
  )
}
