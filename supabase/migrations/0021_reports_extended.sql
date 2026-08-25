-- ============================================================
-- Tier 2: deeper reporting RPCs, plus a book-balance fix found
-- while building them.
--
-- Fix: customer_balances and record_payment both summed
-- subtotal_cents (pre-discount) instead of total_cents. Dormant
-- today — the pay-later completion screen never sends a discount,
-- so no UNPAID sale can currently carry one via the UI — but the
-- book-aging report below builds directly on customer_balances, so
-- this is the right moment to make "total_cents is what's owed"
-- consistent everywhere, matching 0020's revenue-reporting fix.
--
-- New RPCs, all following the sales_revenue_by_day/sales_top_products
-- shape: security definer, auth_is_admin() gate, auth_store_id()
-- scoping, sum total_cents (post-discount) for anything money-shaped.
--   - sales_by_hour / sales_by_day_of_week: staffing-pattern charts.
--   - sales_by_tender: cash/card/e-wallet breakdown, PAID sales only
--     (tender is meaningless for an UNPAID/pay-later sale).
--   - product_velocity: sold-quantity + revenue per product over a
--     range, LEFT JOINed so a never-sold product still appears with
--     quantity_sold = 0 — that's what surfaces dead stock.
-- ============================================================

create or replace view counter.customer_balances as
select c.id, c.store_id, c.name, c.phone,
       coalesce(s.owed,0) - coalesce(p.paid,0) as balance_cents,
       u.unpaid_sales, u.oldest_unpaid
from counter.customers c
left join lateral (
  select sum(total_cents) owed
  from counter.sales where customer_id = c.id and status in ('UNPAID', 'SETTLED')
) s on true
left join lateral (
  select count(*) unpaid_sales, min(created_at) oldest_unpaid
  from counter.sales where customer_id = c.id and status = 'UNPAID'
) u on true
left join lateral (
  select sum(amount_cents) paid from counter.payments where customer_id = c.id
) p on true;

alter view counter.customer_balances set (security_invoker = true);

create or replace function counter.record_payment(
  p_customer_id uuid,
  p_amount_cents integer
)
returns table (payment_id uuid, balance_cents integer, settled_count integer)
language plpgsql
security definer
set search_path = counter, public
as $$
declare
  v_store_id       uuid;
  v_owed           integer;
  v_paid           integer;
  v_balance_before integer;
  v_payment_id     uuid;
  v_new_balance    integer;
  v_settled_count  integer := 0;
begin
  v_store_id := counter.auth_store_id();
  if v_store_id is null then
    raise exception 'No store for the current user';
  end if;

  if not exists (
    select 1 from counter.customers where id = p_customer_id and store_id = v_store_id
  ) then
    raise exception 'Customer not found';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Enter an amount greater than zero';
  end if;

  select coalesce(sum(total_cents), 0) into v_owed
  from counter.sales
  where customer_id = p_customer_id and status in ('UNPAID', 'SETTLED');

  select coalesce(sum(amount_cents), 0) into v_paid
  from counter.payments
  where customer_id = p_customer_id;

  v_balance_before := v_owed - v_paid;

  if p_amount_cents > v_balance_before then
    raise exception 'Amount can''t exceed the balance owed';
  end if;

  insert into counter.payments (store_id, customer_id, taken_by, amount_cents)
  values (v_store_id, p_customer_id, auth.uid(), p_amount_cents)
  returning id into v_payment_id;

  v_new_balance := v_balance_before - p_amount_cents;

  if v_new_balance <= 0 then
    update counter.sales
    set status = 'SETTLED'
    where customer_id = p_customer_id and status = 'UNPAID';
    get diagnostics v_settled_count = row_count;
  end if;

  return query select v_payment_id, v_new_balance, v_settled_count;
end;
$$;

grant execute on function counter.record_payment(uuid, integer) to authenticated;

create function counter.sales_by_hour(p_from timestamptz, p_to timestamptz)
returns table (hour integer, total_cents bigint, sale_count bigint)
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select extract(hour from s.created_at)::integer as hour,
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

grant execute on function counter.sales_by_hour(timestamptz, timestamptz) to authenticated;

-- dow: 0=Sunday..6=Saturday, matching JS Date#getDay() for easy client-side
-- label mapping.
create function counter.sales_by_day_of_week(p_from timestamptz, p_to timestamptz)
returns table (dow integer, total_cents bigint, sale_count bigint)
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select extract(dow from s.created_at)::integer as dow,
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

grant execute on function counter.sales_by_day_of_week(timestamptz, timestamptz) to authenticated;

create function counter.sales_by_tender(p_from timestamptz, p_to timestamptz)
returns table (tender_type counter.tender_type, total_cents bigint, sale_count bigint)
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select s.tender_type,
           coalesce(sum(s.total_cents), 0)::bigint as total_cents,
           count(*)::bigint as sale_count
    from counter.sales s
    where s.store_id = counter.auth_store_id()
      and s.status = 'PAID'
      and (p_from is null or s.created_at >= p_from)
      and (p_to is null or s.created_at < p_to)
    group by 1
    order by 1;
end;
$$;

grant execute on function counter.sales_by_tender(timestamptz, timestamptz) to authenticated;

create function counter.product_velocity(p_from timestamptz, p_to timestamptz)
returns table (
  product_id uuid,
  name text,
  quantity_sold bigint,
  revenue_cents bigint,
  stock_quantity integer
)
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select p.id as product_id,
           p.name,
           coalesce(v.quantity_sold, 0)::bigint as quantity_sold,
           coalesce(v.revenue_cents, 0)::bigint as revenue_cents,
           p.stock_quantity
    from counter.products p
    left join (
      select si.product_id,
             sum(si.quantity) as quantity_sold,
             sum(si.quantity * si.unit_price_cents) as revenue_cents
      from counter.sale_items si
      join counter.sales s on s.id = si.sale_id
      where s.store_id = counter.auth_store_id()
        and (p_from is null or s.created_at >= p_from)
        and (p_to is null or s.created_at < p_to)
      group by si.product_id
    ) v on v.product_id = p.id
    where p.store_id = counter.auth_store_id() and p.is_archived = false
    order by quantity_sold asc, p.name;
end;
$$;

grant execute on function counter.product_velocity(timestamptz, timestamptz) to authenticated;
