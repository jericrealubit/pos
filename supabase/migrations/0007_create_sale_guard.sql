-- ============================================================
-- create_sale — same signature as 0006, adds two guards before
-- the existing pricing pass:
--   1. an UNPAID sale must name a customer (the table already has
--      this as a check constraint; this gives a friendlier error
--      before the insert ever runs)
--   2. a supplied customer_id must actually belong to the caller's
--      store — previously trusted the caller-supplied uuid with no
--      ownership check
-- ============================================================

create or replace function counter.create_sale(
  items jsonb,
  p_customer_id uuid default null,
  p_status counter.sale_status default 'PAID'
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

    select price_cents into v_price_cents
    from counter.products
    where id = v_product_id and store_id = v_store_id and is_archived = false;

    if not found then
      raise exception 'Product % not found', v_product_id;
    end if;

    v_subtotal := v_subtotal + v_price_cents * v_quantity;
  end loop;

  insert into counter.sales (store_id, cashier_id, customer_id, status, subtotal_cents)
  values (v_store_id, auth.uid(), p_customer_id, p_status, v_subtotal)
  returning id into v_sale_id;

  -- pass 2: write the snapshot lines (name/size/price captured now, never backfilled)
  for v_item in select * from jsonb_array_elements(items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::integer;

    select name, size, price_cents into v_name, v_size, v_price_cents
    from counter.products
    where id = v_product_id and store_id = v_store_id and is_archived = false;

    insert into counter.sale_items
      (sale_id, product_id, name_snapshot, size_snapshot, unit_price_cents, quantity)
    values (v_sale_id, v_product_id, v_name, v_size, v_price_cents, v_quantity);
  end loop;

  return query select v_sale_id, v_subtotal;
end;
$$;

grant execute on function counter.create_sale(jsonb, uuid, counter.sale_status) to authenticated;
