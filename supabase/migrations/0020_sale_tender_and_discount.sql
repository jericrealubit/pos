-- ============================================================
-- Tier 1: tender/change capture, sale-level discounts.
--
-- Adds three concepts to a sale, all optional/defaulted so every
-- existing row backfills cleanly:
--   - tender_type: how a PAID sale was settled (cash/card/e-wallet).
--     Only meaningful for PAID sales; UNPAID (pay-later) rows just get
--     the default and the UI never surfaces it for them.
--   - tendered_cents: cash handed over, optional even for cash sales
--     (till-side "amount tendered" is an optional convenience, not a
--     requirement) and meaningless for card/e-wallet, hence the check
--     constraint tying it to tender_type = 'CASH'.
--   - discount_cents: a single sale-level discount (no per-line
--     discounts — kept deliberately simple). total_cents is generated
--     rather than stored/recomputed by hand, so it can never drift from
--     subtotal_cents - discount_cents. Change is NOT stored — it's
--     tendered_cents - total_cents, computed at render time, since it
--     has no independent meaning worth persisting.
--
-- Revenue semantics change here: subtotal_cents stays gross (pre-
-- discount); total_cents is what's actually owed/collected. Reports
-- that mean "revenue" should sum total_cents, not subtotal_cents — see
-- the sales_revenue_by_day redefinition below. sales_top_products is
-- untouched: it sums sale_items at snapshotted unit price, and there's
-- no per-line discount to net out.
-- ============================================================

create type counter.tender_type as enum ('CASH', 'CARD', 'EWALLET');

alter table counter.sales
  add column tender_type     counter.tender_type not null default 'CASH',
  add column tendered_cents  integer,
  add column discount_cents  integer not null default 0,
  add column total_cents     integer generated always as (subtotal_cents - discount_cents) stored,
  add constraint tendered_only_for_cash
    check (tender_type = 'CASH' or tendered_cents is null),
  add constraint discount_within_subtotal
    check (discount_cents >= 0 and discount_cents <= subtotal_cents);

create or replace function counter.create_sale(
  items jsonb,
  p_customer_id uuid default null,
  p_status counter.sale_status default 'PAID',
  p_discount_cents integer default 0,
  p_tender_type counter.tender_type default 'CASH',
  p_tendered_cents integer default null
)
returns table (sale_id uuid, subtotal_cents integer)
language plpgsql
security invoker
set search_path = counter, public
as $$
declare
  v_store_id    uuid;
  v_sale_id     uuid;
  v_subtotal    integer := 0;
  v_item        jsonb;
  v_product_id  uuid;
  v_quantity    integer;
  v_name        text;
  v_size        text;
  v_price_cents integer;
  v_stock       integer;
begin
  v_store_id := counter.auth_store_id();
  if v_store_id is null then
    raise exception 'No store for the current user';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Cart is empty';
  end if;

  if p_status = 'UNPAID' and p_customer_id is null then
    raise exception 'Pay-later sales need a customer';
  end if;

  if p_customer_id is not null and not exists (
    select 1 from counter.customers where id = p_customer_id and store_id = v_store_id
  ) then
    raise exception 'Customer not found';
  end if;

  -- pass 1: validate and price every line before writing anything
  for v_item in select * from jsonb_array_elements(items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid quantity for product %', v_product_id;
    end if;

    select price_cents, stock_quantity into v_price_cents, v_stock
    from counter.products
    where id = v_product_id and store_id = v_store_id and is_archived = false;

    if not found then
      raise exception 'Product % not found', v_product_id;
    end if;

    if v_stock < v_quantity then
      raise exception 'Insufficient stock for product % (has %, requested %)', v_product_id, v_stock, v_quantity;
    end if;

    v_subtotal := v_subtotal + v_price_cents * v_quantity;
  end loop;

  if p_discount_cents is null or p_discount_cents < 0 or p_discount_cents > v_subtotal then
    raise exception 'Discount cannot exceed the sale subtotal';
  end if;

  if p_tendered_cents is not null and p_tendered_cents < (v_subtotal - p_discount_cents) then
    raise exception 'Amount tendered is less than the total due';
  end if;

  insert into counter.sales
    (store_id, cashier_id, customer_id, status, subtotal_cents,
     discount_cents, tender_type, tendered_cents)
  values
    (v_store_id, auth.uid(), p_customer_id, p_status, v_subtotal,
     p_discount_cents, p_tender_type, p_tendered_cents)
  returning id into v_sale_id;

  -- pass 2: write the snapshot lines (name/size/price captured now, never backfilled)
  -- and deduct stock
  for v_item in select * from jsonb_array_elements(items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::integer;

    select name, size, price_cents into v_name, v_size, v_price_cents
    from counter.products
    where id = v_product_id and store_id = v_store_id and is_archived = false;

    insert into counter.sale_items
      (sale_id, product_id, name_snapshot, size_snapshot, unit_price_cents, quantity)
    values (v_sale_id, v_product_id, v_name, v_size, v_price_cents, v_quantity);

    update counter.products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product_id;
  end loop;

  return query select v_sale_id, v_subtotal;
end;
$$;

grant execute on function counter.create_sale(
  jsonb, uuid, counter.sale_status, integer, counter.tender_type, integer
) to authenticated;

-- Revenue now means "what's actually owed/collected" (post-discount),
-- not the pre-discount subtotal.
create or replace function counter.sales_revenue_by_day(p_from timestamptz, p_to timestamptz)
returns table (day date, total_cents bigint, sale_count bigint)
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select date_trunc('day', s.created_at)::date as day,
           coalesce(sum(s.total_cents), 0)::bigint as total_cents,
           count(*)::bigint as sale_count
    from counter.sales s
    where s.store_id = counter.auth_store_id()
      and (p_from is null or s.created_at >= p_from)
      and (p_to is null or s.created_at < p_to)
    group by 1
    order by 1;
end;
$$;
