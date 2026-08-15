-- ============================================================
-- Counter — initial schema, RLS, and store/profile bootstrap
--
-- Lives entirely in its own `counter` schema (not `public`) because
-- this Supabase project is shared with other, unrelated apps whose
-- `public` schema already has colliding table names (e.g. `profiles`).
-- ============================================================

create schema if not exists counter;

create extension if not exists pgcrypto;

-- ---------- stores & people ----------
create table counter.stores (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  currency    text not null default 'USD',
  created_at  timestamptz not null default now()
);

create type counter.user_role as enum ('OWNER','ADMIN','CASHIER');

create table counter.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  store_id    uuid not null references counter.stores(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  role        counter.user_role not null default 'CASHIER',
  created_at  timestamptz not null default now()
);
create index on counter.profiles (store_id);

-- ---------- catalogue ----------
create table counter.categories (
  id        uuid primary key default gen_random_uuid(),
  store_id  uuid not null references counter.stores(id) on delete cascade,
  name      text not null,
  unique (store_id, name)
);

create table counter.products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references counter.stores(id) on delete cascade,
  name         text not null,
  description  text,
  size         text,                     -- free text: '1 L', '2.5 kg', '6 pk'
  price_cents  integer not null check (price_cents >= 0),
  barcode      text not null,
  category_id  uuid references counter.categories(id) on delete set null,
  is_archived  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (store_id, barcode)
);
create index on counter.products (store_id, name);

-- ---------- the book ----------
create table counter.customers (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references counter.stores(id) on delete cascade,
  name       text not null,
  phone      text,
  created_at timestamptz not null default now()
);
create index on counter.customers (store_id, name);

create type counter.sale_status as enum ('PAID','UNPAID','SETTLED');

create table counter.sales (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references counter.stores(id) on delete cascade,
  cashier_id     uuid not null references counter.profiles(id),
  customer_id    uuid references counter.customers(id) on delete restrict,
  status         counter.sale_status not null,
  subtotal_cents integer not null,
  created_at     timestamptz not null default now(),
  -- an unpaid sale must belong to someone
  constraint unpaid_needs_customer
    check (status <> 'UNPAID' or customer_id is not null)
);
create index on counter.sales (store_id, created_at desc);
create index on counter.sales (customer_id, status);

create table counter.sale_items (
  id               uuid primary key default gen_random_uuid(),
  sale_id          uuid not null references counter.sales(id) on delete cascade,
  product_id       uuid references counter.products(id) on delete set null,
  name_snapshot    text not null,      -- what the receipt said
  size_snapshot    text,
  unit_price_cents integer not null,   -- price at time of sale, never backfilled
  quantity         integer not null check (quantity > 0)
);
create index on counter.sale_items (sale_id);

create table counter.payments (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references counter.stores(id) on delete cascade,
  customer_id  uuid not null references counter.customers(id) on delete cascade,
  taken_by     uuid not null references counter.profiles(id),
  amount_cents integer not null check (amount_cents > 0),
  created_at   timestamptz not null default now()
);
create index on counter.payments (customer_id);

-- ---------- computed balance ----------
create view counter.customer_balances as
select c.id, c.store_id, c.name, c.phone,
       coalesce(s.owed,0) - coalesce(p.paid,0) as balance_cents,
       s.unpaid_sales, s.oldest_unpaid
from counter.customers c
left join lateral (
  select sum(subtotal_cents) owed, count(*) unpaid_sales, min(created_at) oldest_unpaid
  from counter.sales where customer_id = c.id and status = 'UNPAID'
) s on true
left join lateral (
  select sum(amount_cents) paid from counter.payments where customer_id = c.id
) p on true;

-- ============================================================
-- Row Level Security
-- ============================================================

-- helper: the caller's store, without recursive policy evaluation
create function counter.auth_store_id() returns uuid
language sql stable security definer set search_path = counter, public as $$
  select store_id from profiles where id = auth.uid()
$$;

create function counter.auth_is_admin() returns boolean
language sql stable security definer set search_path = counter, public as $$
  select role in ('OWNER','ADMIN') from profiles where id = auth.uid()
$$;

grant execute on function counter.auth_store_id() to authenticated;
grant execute on function counter.auth_is_admin() to authenticated;

alter table counter.stores      enable row level security;
alter table counter.profiles    enable row level security;
alter table counter.categories  enable row level security;
alter table counter.products    enable row level security;
alter table counter.customers   enable row level security;
alter table counter.sales       enable row level security;
alter table counter.sale_items  enable row level security;
alter table counter.payments    enable row level security;

-- stores
create policy read_stores  on counter.stores  for select using (id = counter.auth_store_id());
create policy update_store on counter.stores  for update
  using (id = counter.auth_store_id() and counter.auth_is_admin())
  with check (id = counter.auth_store_id() and counter.auth_is_admin());

-- profiles
create policy read_profiles      on counter.profiles for select using (store_id = counter.auth_store_id());
create policy update_own_profile on counter.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and store_id = counter.auth_store_id());

-- categories
create policy read_categories  on counter.categories for select using (store_id = counter.auth_store_id());
create policy write_categories on counter.categories for all
  using (store_id = counter.auth_store_id() and counter.auth_is_admin())
  with check (store_id = counter.auth_store_id() and counter.auth_is_admin());

-- cashiers may create sales and customers, not edit the catalogue
create policy read_products  on counter.products for select using (store_id = counter.auth_store_id());
create policy write_products on counter.products for all
  using (store_id = counter.auth_store_id() and counter.auth_is_admin())
  with check (store_id = counter.auth_store_id() and counter.auth_is_admin());

-- customers
create policy read_customers   on counter.customers for select using (store_id = counter.auth_store_id());
create policy insert_customers on counter.customers for insert with check (store_id = counter.auth_store_id());
create policy update_customers on counter.customers for update
  using (store_id = counter.auth_store_id() and counter.auth_is_admin())
  with check (store_id = counter.auth_store_id() and counter.auth_is_admin());

-- sales
create policy read_sales on counter.sales for select using (store_id = counter.auth_store_id());
create policy make_sales on counter.sales for insert
  with check (store_id = counter.auth_store_id() and cashier_id = auth.uid());

-- sale_items
create policy read_sale_items on counter.sale_items for select
  using (exists (select 1 from counter.sales s where s.id = sale_items.sale_id and s.store_id = counter.auth_store_id()));
create policy insert_sale_items on counter.sale_items for insert
  with check (exists (select 1 from counter.sales s where s.id = sale_items.sale_id and s.store_id = counter.auth_store_id()));

-- payments
create policy read_payments   on counter.payments for select using (store_id = counter.auth_store_id());
create policy insert_payments on counter.payments for insert
  with check (store_id = counter.auth_store_id() and taken_by = auth.uid());

-- ============================================================
-- Registration: create a store and its first profile atomically
-- ============================================================

create function counter.create_store_and_profile(store_name text, first text, last text)
returns uuid language plpgsql security definer set search_path = counter, public as $$
declare new_store uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'This account already belongs to a store';
  end if;

  insert into stores (name) values (store_name) returning id into new_store;
  insert into profiles (id, store_id, first_name, last_name, role)
  values (auth.uid(), new_store, first, last, 'OWNER');

  return new_store;
end $$;

grant execute on function counter.create_store_and_profile(text, text, text) to authenticated;

-- ============================================================
-- Data API access: everything above is gated by RLS per-row;
-- these grants are the table-level prerequisite PostgREST needs
-- before RLS is even evaluated. `counter` must also be added to
-- the project's exposed schemas (Dashboard: Settings > API > Data
-- API Settings) before Supabase's REST API will serve it at all.
-- ============================================================

grant usage on schema counter to authenticated, service_role;
grant all on all tables in schema counter to authenticated, service_role;
grant all on all sequences in schema counter to authenticated, service_role;
grant execute on all functions in schema counter to authenticated, service_role;
alter default privileges in schema counter grant all on tables to authenticated, service_role;
alter default privileges in schema counter grant all on sequences to authenticated, service_role;
alter default privileges in schema counter grant execute on functions to authenticated, service_role;
