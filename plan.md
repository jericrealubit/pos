# Counter — POS & Book

Build plan. Companion to `pos-wireframe.html` (14 screens, clickable).

Stack: **Next.js (App Router) + shadcn/ui + Supabase**.

---

## 1. What we're building

A mobile-first web POS for a single retail store, plus an admin panel.

A cashier scans items with a phone camera or a handheld reader, reviews the cart, and settles the sale as **Paid** or **Pay later**. Pay-later sales attach to a named customer and accumulate in "the book" — an itemised running balance the owner can work through.

Two surfaces, one app:

- **Till** — phone-sized, used standing up, one-handed, in bad light.
- **Admin** — product CRUD, the book, overview. Desktop-friendly but must survive on a phone.

---

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js App Router + TypeScript | Server Components for reads, Server Actions for writes |
| UI | shadcn/ui + Tailwind | Owned components in `components/ui` — edit them freely |
| Database | Supabase Postgres | SQL migrations via the Supabase CLI, checked into the repo |
| Auth | Supabase Auth (email + password) | `@supabase/ssr` for cookie-based sessions |
| Access control | Postgres **RLS** | Store scoping lives in the database, not in your queries |
| Types | `supabase gen types typescript` | Generated, committed, regenerated on every migration |
| Tables | TanStack Table via shadcn's data-table pattern | Sorting, filtering, pagination |
| Forms | react-hook-form + zod (shadcn Form) | Same resolver reused server-side |
| Barcode (camera) | `BarcodeDetector`, falling back to `@zxing/browser` | Native where supported |
| Hosting | Vercel | Supabase project in the same region |

**No Prisma.** With Supabase you get migrations from the CLI, types from the generator, and RLS from Postgres. Adding an ORM on top means two sources of truth about your schema and an awkward relationship with `auth.users`. Write SQL.

**Two setup traps that cost a day each:**

1. **The camera needs HTTPS, including in local dev.** `next dev --experimental-https`, or `mkcert`, or tunnel via ngrok. Over plain `http://192.168.x.x` on your phone, `getUserMedia` silently returns nothing.
2. **Turn off email confirmation** in Supabase Auth settings for now. Otherwise registering a cashier blocks on an inbox that may not exist. Revisit before real deployment.

---

## 3. Data model

Money is stored as **integer minor units** (cents). Never floats, never `numeric` you have to remember to round.

Supabase Auth owns `auth.users` (email, password hash, sessions). Your own user data lives in `public.profiles`, keyed to the same id.

```sql
-- ---------- stores & people ----------
create table stores (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  currency    text not null default 'USD',
  created_at  timestamptz not null default now()
);

create type user_role as enum ('OWNER','ADMIN','CASHIER');

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  store_id    uuid not null references stores(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  role        user_role not null default 'CASHIER',
  created_at  timestamptz not null default now()
);
create index on profiles (store_id);

-- ---------- catalogue ----------
create table categories (
  id        uuid primary key default gen_random_uuid(),
  store_id  uuid not null references stores(id) on delete cascade,
  name      text not null,
  unique (store_id, name)
);

create table products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  name         text not null,
  description  text,
  size         text,                     -- free text: '1 L', '2.5 kg', '6 pk'
  price_cents  integer not null check (price_cents >= 0),
  barcode      text not null,
  category_id  uuid references categories(id) on delete set null,
  is_archived  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (store_id, barcode)
);
create index on products (store_id, name);

-- ---------- the book ----------
create table customers (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references stores(id) on delete cascade,
  name       text not null,
  phone      text,
  created_at timestamptz not null default now()
);
create index on customers (store_id, name);

create type sale_status as enum ('PAID','UNPAID','SETTLED');

create table sales (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references stores(id) on delete cascade,
  cashier_id     uuid not null references profiles(id),
  customer_id    uuid references customers(id) on delete restrict,
  status         sale_status not null,
  subtotal_cents integer not null,
  created_at     timestamptz not null default now(),
  -- an unpaid sale must belong to someone
  constraint unpaid_needs_customer
    check (status <> 'UNPAID' or customer_id is not null)
);
create index on sales (store_id, created_at desc);
create index on sales (customer_id, status);

create table sale_items (
  id               uuid primary key default gen_random_uuid(),
  sale_id          uuid not null references sales(id) on delete cascade,
  product_id       uuid references products(id) on delete set null,
  name_snapshot    text not null,      -- what the receipt said
  size_snapshot    text,
  unit_price_cents integer not null,   -- price at time of sale, never backfilled
  quantity         integer not null check (quantity > 0)
);
create index on sale_items (sale_id);

create table payments (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  customer_id  uuid not null references customers(id) on delete cascade,
  taken_by     uuid not null references profiles(id),
  amount_cents integer not null check (amount_cents > 0),
  created_at   timestamptz not null default now()
);
create index on payments (customer_id);
```

**Four rules the schema enforces for you:**

1. **Price is snapshotted.** Editing a product price must never rewrite history — `sale_items` carries its own name and price.
2. **Products archive, never delete.** `is_archived = true` removes it from the till, not from history. Hence `on delete set null` on `product_id`, and no hard deletes anywhere.
3. **Barcode is unique per store.** Enforced by the DB, not just the form. Two products sharing a code makes every scan ambiguous.
4. **An unpaid sale must name someone.** The check constraint makes an orphaned debt impossible.

**Balance is computed, not stored:**

```sql
create view customer_balances as
select c.id, c.store_id, c.name, c.phone,
       coalesce(s.owed,0) - coalesce(p.paid,0) as balance_cents,
       s.unpaid_sales, s.oldest_unpaid
from customers c
left join lateral (
  select sum(subtotal_cents) owed, count(*) unpaid_sales, min(created_at) oldest_unpaid
  from sales where customer_id = c.id and status = 'UNPAID'
) s on true
left join lateral (
  select sum(amount_cents) paid from payments where customer_id = c.id
) p on true;
```

A stored `balance` column will drift. Don't.

---

## 4. Row Level Security

**Enable RLS on every table before you insert a single row.** This is the whole access-control story — get it right once and no query can leak across stores.

```sql
-- helper: the caller's store, without recursive policy evaluation
create function auth_store_id() returns uuid
language sql stable security definer set search_path = public as $$
  select store_id from profiles where id = auth.uid()
$$;

create function auth_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select role in ('OWNER','ADMIN') from profiles where id = auth.uid()
$$;

alter table stores      enable row level security;
alter table profiles    enable row level security;
alter table categories  enable row level security;
alter table products    enable row level security;
alter table customers   enable row level security;
alter table sales       enable row level security;
alter table sale_items  enable row level security;
alter table payments    enable row level security;

-- everyone in the store reads store data
create policy read_products on products for select
  using (store_id = auth_store_id());

-- only admins change the catalogue
create policy write_products on products for all
  using (store_id = auth_store_id() and auth_is_admin())
  with check (store_id = auth_store_id() and auth_is_admin());

-- cashiers may create sales and customers, not edit the catalogue
create policy read_sales on sales for select using (store_id = auth_store_id());
create policy make_sales on sales for insert
  with check (store_id = auth_store_id() and cashier_id = auth.uid());
```

Repeat the read/write pair per table. `security definer` on the two helpers is what stops the policy on `profiles` from evaluating itself forever.

**Registration** needs a store and a profile created atomically, before the user has a profile to be scoped by. Do it in one `security definer` function called via RPC after `signUp`:

```sql
create function create_store_and_profile(store_name text, first text, last text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_store uuid;
begin
  insert into stores (name) values (store_name) returning id into new_store;
  insert into profiles (id, store_id, first_name, last_name, role)
  values (auth.uid(), new_store, first, last, 'OWNER');
  return new_store;
end $$;
```

Guard it: raise if the caller already has a profile, or one user can spawn stores indefinitely.

---

## 5. Routes

```
/register           store name + first, last, email, password
/signin

/sell               resting state; hidden input captures hardware scans
/sell/scan          camera + cart
/sell/cart          summary, Paid / Pay later
/sell/customer      name search-or-create (pay later only)
/sell/done/[saleId]

/admin              overview
/admin/products     sortable, filterable, paginated
/admin/products/new
/admin/products/[id]
/admin/customers    the book
/admin/customers/[id]
```

`middleware.ts` refreshes the Supabase session and redirects unauthenticated traffic to `/signin`. `/admin/*` additionally checks role — belt and braces alongside RLS, so cashiers get a redirect rather than an empty table.

**Server Actions** (all in `app/actions/`): `lookupByBarcode`, `createSale`, `searchCustomers`, `createCustomer`, `recordPayment`, `productCreate`, `productUpdate`, `productArchive`.

`createSale` inserts the sale and its items together — wrap it in a Postgres function so a half-written sale is impossible.

---

## 6. The two hard parts

### 6.1 Barcode input

Both paths call **one function**: `onBarcode(code)` → look up → add to cart, or offer to create the product.

**Hardware reader (USB/Bluetooth).** These are keyboard-wedge devices — they type digits fast and press Enter. You are not building a scanner integration, you are building a keystroke listener.

- Keep an always-focused, visually hidden `<input>` on `/sell` and `/sell/scan`.
- Buffer keystrokes; 8+ characters in under ~100ms followed by Enter is a scan, not typing.
- Refocus on blur, or tapping elsewhere silently breaks scanning.

**Phone camera.**

- Try `window.BarcodeDetector` first with `['ean_13','ean_8','upc_a','code_128']`.
- Fall back to `@zxing/browser` (iOS Safari has no native detector).
- `facingMode: 'environment'`; expose torch via `track.applyConstraints({ advanced: [{ torch: true }] })`.
- Debounce hard — the same code fires many times a second. Ignore repeats of the same value within ~1.5s.
- Feedback on every hit: a short beep plus the new row flashing. Use `sonner` for the not-found case. The cashier is not looking at the screen.

**Duplicate scan increments quantity. It does not add a second line.**

**Manual entry is a first-class path**, not a fallback. Torn labels are daily.

### 6.2 The data table

Products, customers, and the account view all need sortable + filterable + paginated. Build it **once**, first.

```bash
npx shadcn@latest add table button input select dropdown-menu
npm i @tanstack/react-table
```

Follow shadcn's data-table composition, wrapped as your own `<DataTable columns rows searchKeys filters onRowClick emptyState />`.

Drive state through URL search params — `?sort=name&dir=asc&q=oil&page=2` — so it survives refresh, works with Server Components, and is shareable. Client-side sorting is fine below ~500 rows; keep the props shape identical so swapping to server-side later is a one-file change.

**shadcn's table does not go mobile.** Below `sm:` it scrolls sideways, which is unusable one-handed. Build the responsive shell yourself as `<DataList>`: it owns the search, filters, sort and pager, then renders `<Table>` at `md:` and up, and a stacked `<Card>` list below — same columns, same URL state, different presentation. Sort on mobile moves into a `drawer` triggered by a "Sort" button, since there are no headers to click. The wireframe's **Phone** toggle shows the target.

### shadcn components you'll actually use

`button` `input` `label` `card` `table` `dialog` `drawer` `radio-group` `select` `command` `popover` `form` `sonner` `badge` `skeleton` `sheet` `dropdown-menu` `separator` `tabs`

Three mappings worth naming: the **Paid / Pay later** control is `radio-group`, not a switch — two named states, both explicit. The **customer search-or-create** field is `command` inside a `popover` (desktop) or a `drawer` (mobile), showing each match's outstanding balance in the row. And `drawer` is Vaul — a real bottom sheet with drag-to-dismiss, which is what every confirmation at the till should be.

### 6.3 Making shadcn feel mobile

shadcn is not the obstacle — Radix handles touch fine. The gap is one component and a few layout habits. Four patterns close it:

**`<ResponsiveDialog>`** — one wrapper, `Drawer` below `md:`, `Dialog` above. Write it once in M0 and use it for every confirmation, picker, and quantity editor. A centre-screen modal on a phone feels like a website; a bottom sheet feels like an app.

```tsx
// components/responsive-dialog.tsx
const isDesktop = useMediaQuery("(min-width: 768px)")
return isDesktop ? <Dialog {...props} /> : <Drawer {...props} />
```

**Thumb-zone actions.** The primary action goes bottom-anchored and full-width on till screens — `sticky bottom-0` with `pb-[env(safe-area-inset-bottom)]`. Top-right is out of reach one-handed on a 6" phone. The wireframe's Done button follows this.

**No hover-dependent affordances.** Anything revealed on `:hover` does not exist on a touch device. Row actions are visible, or they live behind an explicit tap.

**Sizes.** shadcn's `size="sm"` is 32px — below the 44px minimum. Never use it at the till; it's fine in admin on desktop.

Add to `globals.css`: `html { -webkit-text-size-adjust: 100%; }` and use `text-base` (16px) on inputs, or iOS Safari zooms the viewport on focus and won't zoom back.

---

## 7. Milestones

Each is independently demoable.

- **M0 — Setup.** `create-next-app`, `shadcn init`, Supabase project, CLI linked, first migration, seed script (~30 products, ~8 customers, some unpaid sales). `<ResponsiveDialog>` written. HTTPS working on a real phone. *Done when: the app loads on your phone over https.*
- **M1 — Auth + RLS.** Register runs `signUp` then `create_store_and_profile`. Sign in, sign out, middleware. Every table has policies. *Done when: a second account sees none of the first account's data.*
- **M2 — Products + DataTable.** Full CRUD, categories, archive instead of delete, barcode uniqueness surfaced as a friendly form error. The reusable table with its mobile card fallback. *Done when: you can manage the catalogue end to end on a phone.*
- **M3 — Scanning.** `onBarcode` wired to both paths. Cart state, quantity steppers, line void, unknown-barcode handling. *Done when: a real reader and a real camera add to the same cart.*
- **M4 — Paid sales.** Cart summary, Paid path, sale + items persisted with snapshots, done screen. *Done when: prices in the database are historical, not live lookups.*
- **M5 — Pay later + the book.** Customer combobox, unpaid sales, customer list from `customer_balances`, account view with itemised lines. *Done when: an unpaid sale lands on the right person's account.*
- **M6 — Settling.** Record a payment, partial allowed, oldest lines first. Overview numbers. *Done when: paying off half a balance leaves the right remainder.*
- **M7 — Polish.** Receipts, role-gated admin nav, offline cart persistence, empty/loading/error states throughout.

M0–M5 is the usable product. M6 makes the book work. M7 makes it pleasant.

---

## 8. Decisions still open

| # | Question | Recommendation |
|---|---|---|
| 1 | Second staff member registering — retype the store name? | No. First registration creates the store; everyone after joins by invite code and never sees the field. |
| 2 | Credit limit on pay later? | Soft warning at a configurable threshold. The customer picker already shows the existing balance. Don't block the sale. |
| 3 | Keep the Overview dashboard? | My addition, not your spec. If it goes, `/admin` redirects to `/admin/products`. |
| 4 | Offline scanning when the connection drops? | Not in M1–M6. If the shop's connection is genuinely unreliable, say so now — it means local-first + sync, which is an architecture, not a feature. |
| 5 | Multi-register / multi-branch? | Assumed single. `store_id` everywhere means multi-store is additive. |
| 6 | Stock tracking? | Not in your spec, but the wireframe shows a stock pill. Delete it, or commit to decrementing on sale. Half-tracked stock is worse than none. |
| 7 | Discounts, price overrides, voiding a whole sale? | Not specced, common at a real counter. Decide before M4. |
| 8 | Currency and tax? | `stores.currency` is in the schema — set it at M0. Say whether prices include tax. |

---

## 9. Conventions

- Money: integer cents, one `formatMoney(cents, currency)` helper. No `toFixed` scattered around.
- Dates: Postgres `timestamptz`, rendered in store-local time.
- Never hard-delete. `is_archived`, always.
- The **service-role key never leaves the server** and never appears in a `NEXT_PUBLIC_` variable.
- Regenerate types after every migration; commit the result.
- Every destructive dialog states the **consequence** ("appears in 38 past sales"), not the risk ("cannot be undone").
- Touch targets ≥ 44px on till screens. shadcn's `size="sm"` is 32px — don't use it at the till.
- Confirmations and pickers go through `<ResponsiveDialog>`, never `<Dialog>` directly.
- Primary actions sit bottom-anchored on till screens, respecting `env(safe-area-inset-bottom)`.
- Nothing important is revealed on `:hover`.
- Three designed states per list: empty, loading, error. Build them with the list, not after.

---

## 10. First session, concretely

```bash
npx create-next-app@latest counter --typescript --tailwind --app --src-dir
cd counter
npx shadcn@latest init
npx shadcn@latest add button input label card table dialog drawer radio-group select command popover form sonner badge skeleton sheet

npm i @supabase/supabase-js @supabase/ssr @tanstack/react-table @zxing/browser zod react-hook-form @hookform/resolvers
npm i -D supabase

npx supabase init
npx supabase link --project-ref <your-ref>
# put §3 and §4 in supabase/migrations/0001_init.sql
npx supabase db push
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only, never NEXT_PUBLIC_
```

Then build `<DataTable>` before anything else. Products, customers, and the account view all sit on it — getting it right once removes about a third of the remaining work.
