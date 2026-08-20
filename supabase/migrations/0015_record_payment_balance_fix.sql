-- ============================================================
-- record_payment (0013) computed "owed" from UNPAID sales only,
-- but customer_balances (0014) was fixed to count UNPAID + SETTLED
-- as owed (so old settled debt keeps offsetting the payments that
-- funded it, instead of double-counting against future debt). This
-- left the two computing different balances: once any sale for a
-- customer had ever settled, record_payment would see a much
-- smaller "balance owed" than what's actually displayed, and reject
-- valid payments. Bring the function's math in line with the view.
-- ============================================================

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

  select coalesce(sum(subtotal_cents), 0) into v_owed
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
