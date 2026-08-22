-- ============================================================
-- Billing — a per-store subscription, enforced by a single date.
--
-- `paid_until` is the one source of truth for access: it covers the
-- free trial and paid periods identically, so there is no status enum
-- to keep in sync. Access is `paid_until > now() - grace`, with the
-- grace window applied in the application (lib/billing.ts) so the
-- banner, the gate and the billing page all agree on one number.
--
-- Collection is manual to begin with: a human takes payment out of
-- band and extends `paid_until` from the super-admin console. The
-- webhook of whatever processor lands later writes these same two
-- columns, so nothing else in the app has to change.
-- ============================================================

create type counter.store_plan as enum ('TRIAL','PAID');

alter table counter.stores
  add column plan         counter.store_plan not null default 'TRIAL',
  add column paid_until   timestamptz,
  add column billing_note text,
  -- 2-letter ISO country, chosen at registration. Drives which price
  -- the store is quoted (lib/billing.ts REGIONS) and defaults its
  -- currency. Null means the rest-of-world/USD tier.
  add column country      text check (country is null or country ~ '^[A-Z]{2}$');

-- Existing stores are grandfathered a year rather than dropped into a
-- paywall the moment this deploys.
update counter.stores
   set paid_until = now() + interval '1 year',
       plan       = 'PAID'
 where paid_until is null;

-- ============================================================
-- Close the hole this feature depends on.
--
-- `update_store` (0005) lets an OWNER/ADMIN update their own store
-- row, and 0005's blanket `grant all on all tables` means that covers
-- every column. Via the Data API a store admin could therefore PATCH
-- `is_paused` to false and undo a suspension — and, once the columns
-- above exist, set their own `paid_until` to 2099. RLS gates the row,
-- not the column, so the fix is column-level UPDATE privileges: hand
-- back only the settings a store is meant to edit.
--
-- Billing columns are then writable solely through the security
-- definer functions below, which check super-admin membership.
-- ============================================================

revoke update on counter.stores from authenticated;
grant update (name, address, phone, low_stock_threshold, currency)
  on counter.stores to authenticated;

-- 0005 set default privileges granting `all` on future tables in this
-- schema; that applies per-table at creation and does not re-grant the
-- revoke above, but be explicit that this table is the exception.

-- ============================================================
-- Registration now records where the store is and starts the trial.
-- Replaces the 3-arg version from 0005.
-- ============================================================

drop function counter.create_store_and_profile(text, text, text);

create function counter.create_store_and_profile(
  store_name text,
  first      text,
  last       text,
  p_currency text default 'USD',
  p_country  text default null
)
returns uuid language plpgsql security definer set search_path = counter, public as $$
declare new_store uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'This account already belongs to a store';
  end if;

  insert into stores (name, currency, country, plan, paid_until)
  values (
    store_name,
    coalesce(nullif(p_currency, ''), 'USD'),
    nullif(upper(p_country), ''),
    'TRIAL',
    now() + interval '90 days'
  )
  returning id into new_store;

  insert into profiles (id, store_id, first_name, last_name, role)
  values (auth.uid(), new_store, first, last, 'OWNER');

  return new_store;
end $$;

grant execute on function counter.create_store_and_profile(text, text, text, text, text)
  to authenticated;

-- ============================================================
-- Super admin: see and set billing across every store.
-- Same shape as 0009 — security definer, with the authorisation
-- check in the body rather than in an RLS policy.
-- ============================================================

drop function counter.super_admin_list_stores();

create function counter.super_admin_list_stores()
returns table (
  store_id         uuid,
  store_name       text,
  currency         text,
  country          text,
  created_at       timestamptz,
  is_paused        boolean,
  plan             counter.store_plan,
  paid_until       timestamptz,
  billing_note     text,
  owner_first_name text,
  owner_last_name  text,
  owner_email      text
)
language plpgsql security definer set search_path = counter, public, auth as $$
begin
  if not counter.auth_is_super_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select s.id, s.name, s.currency, s.country, s.created_at, s.is_paused,
           s.plan, s.paid_until, s.billing_note,
           p.first_name, p.last_name, u.email::text
    from counter.stores s
    join counter.profiles p on p.store_id = s.id and p.role = 'OWNER'
    left join auth.users u on u.id = p.id
    order by s.created_at desc;
end;
$$;

grant execute on function counter.super_admin_list_stores() to authenticated;

-- Extends a store's access. `p_extend_interval` is added to whichever
-- is later, now() or the existing paid_until, so paying early never
-- costs a store the days it had already bought.
-- p_extend_interval is text rather than interval, checked against a
-- fixed set here: it keeps the allowed extensions declared in one place
-- and avoids depending on PostgREST coercing a JSON string into an
-- interval parameter.
create function counter.super_admin_extend_store(
  p_store_id        uuid,
  p_extend_interval text,
  p_note            text default null
)
returns timestamptz
language plpgsql security definer set search_path = counter, public as $$
declare
  new_paid_until timestamptz;
  extend_by      interval;
begin
  if not counter.auth_is_super_admin() then
    raise exception 'Not authorized';
  end if;

  extend_by := case p_extend_interval
    when '1 month' then interval '1 month'
    when '1 year'  then interval '1 year'
    else null
  end;

  if extend_by is null then
    raise exception 'Unsupported extension: %', p_extend_interval;
  end if;

  update counter.stores
     set paid_until   = greatest(now(), coalesce(paid_until, now())) + extend_by,
         plan         = 'PAID',
         billing_note = coalesce(nullif(p_note, ''), billing_note)
   where id = p_store_id
   returning paid_until into new_paid_until;

  if new_paid_until is null then
    raise exception 'No such store';
  end if;

  return new_paid_until;
end;
$$;

grant execute on function counter.super_admin_extend_store(uuid, text, text)
  to authenticated;

-- Sets billing state outright, for corrections the extend button can't
-- express (a refund, a wrong date, revoking access without pausing).
create function counter.super_admin_set_store_billing(
  p_store_id   uuid,
  p_plan       counter.store_plan,
  p_paid_until timestamptz,
  p_note       text default null
)
returns void
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_super_admin() then
    raise exception 'Not authorized';
  end if;

  update counter.stores
     set plan         = p_plan,
         paid_until   = p_paid_until,
         billing_note = coalesce(nullif(p_note, ''), billing_note)
   where id = p_store_id;

  if not found then
    raise exception 'No such store';
  end if;
end;
$$;

grant execute on function counter.super_admin_set_store_billing(uuid, counter.store_plan, timestamptz, text)
  to authenticated;
