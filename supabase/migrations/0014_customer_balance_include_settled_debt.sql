-- ============================================================
-- customer_balances previously computed "owed" from UNPAID sales
-- only. Once record_payment (0013) started flipping fully-paid
-- sales to SETTLED, their subtotal dropped out of "owed" while the
-- payment that funded it stayed in "paid" forever — permanently
-- skewing balance_cents negative and wrongly offsetting any *new*
-- unpaid debt the same customer racks up later.
--
-- Fix: "owed" (for the balance calculation) sums UNPAID + SETTLED
-- sales — i.e. all credit ever extended — while unpaid_sales/
-- oldest_unpaid stay scoped to UNPAID only, since those two drive
-- the "Unpaid sales" stat and unpaid-items list on the customer
-- page and must still reflect the drop after a full payoff.
-- ============================================================

create or replace view counter.customer_balances as
select c.id, c.store_id, c.name, c.phone,
       coalesce(s.owed,0) - coalesce(p.paid,0) as balance_cents,
       u.unpaid_sales, u.oldest_unpaid
from counter.customers c
left join lateral (
  select sum(subtotal_cents) owed
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
