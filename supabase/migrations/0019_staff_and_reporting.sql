-- ============================================================
-- Staff accounts + advanced sale reporting (premium features)
--
-- Two independent pieces of work bundled in one migration because they
-- share nothing structurally but both build on the freemium billing
-- model (0018) and both needed a security review pass first — see the
-- profiles fix below, found during that review.
-- ============================================================

-- ------------------------------------------------------------
-- Critical fix, unrelated to the features below but made load-bearing
-- by them: counter.profiles has row-only RLS (update_own_profile checks
-- only `id = auth.uid()`) combined with 0005's blanket
-- `grant all on all tables ... to authenticated` — never column-
-- restricted, unlike counter.stores (locked down in 0017 after the
-- exact same class of bug: RLS gates the row, not the column). Today,
-- any signed-in user can PATCH their own `role` straight to 'OWNER' via
-- the Data API. Once `deactivated_at` exists below, the same hole would
-- let a deactivated user silently reactivate themselves. Fix it the
-- same way 0017 fixed stores: hand back only the columns a user is
-- meant to self-edit.
-- ------------------------------------------------------------

revoke update on counter.profiles from authenticated;
grant update (first_name, last_name) on counter.profiles to authenticated;

-- ============================================================
-- Staff accounts
-- ============================================================

alter table counter.profiles
  add column deactivated_at timestamptz;

create table counter.staff_invites (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references counter.stores(id) on delete cascade,
  email       text not null,
  role        counter.user_role not null check (role in ('ADMIN','CASHIER')),
  -- Two v4 UUIDs concatenated (hyphens stripped) rather than
  -- encode(gen_random_bytes(24),'hex'): pgcrypto's functions live in
  -- whatever schema Supabase installed the extension into (typically
  -- `extensions`, not `public`/`counter`), which isn't reliably on the
  -- search_path at DDL time. gen_random_uuid() is built into Postgres
  -- core (no extension needed) and gives ~244 bits of randomness from
  -- two independent UUIDs — more than the 192 bits gen_random_bytes(24)
  -- would have produced, with no schema-resolution risk.
  token       text not null unique
                default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_by  uuid not null references counter.profiles(id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at  timestamptz
);
create index on counter.staff_invites (store_id);

alter table counter.staff_invites enable row level security;

-- Admins manage their own store's invites directly; nobody else can
-- read this table at all — the join page reaches invite data only
-- through staff_invite_preview() below, never a direct select, so an
-- invite row (and its unguessable token) can never be enumerated.
create policy admin_read_invites on counter.staff_invites for select
  using (store_id = counter.auth_store_id() and counter.auth_is_admin());
create policy admin_insert_invites on counter.staff_invites for insert
  with check (store_id = counter.auth_store_id() and counter.auth_is_admin());
create policy admin_revoke_invites on counter.staff_invites for update
  using (store_id = counter.auth_store_id() and counter.auth_is_admin())
  with check (store_id = counter.auth_store_id() and counter.auth_is_admin());

-- Pre-auth lookup: the join page needs to show "You're invited to join
-- {store} as {role}" before the visitor has a session. Returns nothing
-- for a wrong token AND for an expired/revoked/accepted one — the same
-- empty result in every non-valid case, so the link can't be used to
-- fingerprint a store's onboarding progress. plan/paid_until ride along
-- so the caller can run the real getBillingState() in TypeScript rather
-- than re-implementing "is this store premium" here in SQL.
create function counter.staff_invite_preview(p_token text)
returns table (
  store_name text,
  email      text,
  role       counter.user_role,
  plan       counter.store_plan,
  paid_until timestamptz
)
language plpgsql security definer set search_path = counter, public as $$
begin
  return query
    select s.name, i.email, i.role, s.plan, s.paid_until
    from counter.staff_invites i
    join counter.stores s on s.id = i.store_id
    where i.token = p_token
      and i.revoked_at is null
      and i.accepted_at is null
      and i.expires_at > now();
end;
$$;

-- 0005 only granted schema usage to authenticated/service_role. anon
-- needs it too — USAGE on the schema is required to resolve/call any
-- function inside it via PostgREST, even one already EXECUTE-granted,
-- and the join page must work for a logged-out visitor.
grant usage on schema counter to anon;
grant execute on function counter.staff_invite_preview(text) to authenticated, anon;

create function counter.create_staff_invite(p_email text, p_role counter.user_role)
returns table (token text, expires_at timestamptz)
language plpgsql security definer set search_path = counter, public as $$
declare v_store uuid;
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_role not in ('ADMIN','CASHIER') then
    raise exception 'Invalid role';
  end if;

  v_store := counter.auth_store_id();

  return query
    insert into counter.staff_invites (store_id, email, role, invited_by)
    values (v_store, lower(trim(p_email)), p_role, auth.uid())
    returning staff_invites.token, staff_invites.expires_at;
end;
$$;

grant execute on function counter.create_staff_invite(text, counter.user_role) to authenticated;

create function counter.revoke_staff_invite(p_invite_id uuid)
returns void
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;

  update counter.staff_invites
     set revoked_at = now()
   where id = p_invite_id
     and store_id = counter.auth_store_id()
     and accepted_at is null;

  if not found then
    raise exception 'No such invite';
  end if;
end;
$$;

grant execute on function counter.revoke_staff_invite(uuid) to authenticated;

-- Accepting requires a session (auth.uid() is null otherwise). Validates
-- the invite is pending AND that the confirming user's own verified
-- email matches the invite — the two checks are combined into a single
-- generic failure so a caller can't tell "wrong token" from "right
-- token, wrong email" from "already used". A duplicate-profile failure
-- is raised as its own distinct message (same idiom as
-- create_store_and_profile) since it describes the ACCEPTING USER's own
-- account state, not the invite's — safe to distinguish, and needed so
-- /auth/confirm can treat a double-click as idempotent success.
--
-- p_first/p_last are explicit params (not read from the JWT) — the same
-- style create_store_and_profile already uses, and it lets both the
-- fresh-signup path and the already-has-a-session path supply a real
-- name rather than a placeholder, since that name shows up on every
-- sale this person rings up.
create function counter.accept_staff_invite(p_token text, p_first text, p_last text)
returns uuid
language plpgsql security definer set search_path = counter, public, auth as $$
declare
  v_invite counter.staff_invites%rowtype;
  v_new_profile uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'This account already belongs to a store';
  end if;

  select * into v_invite
    from counter.staff_invites
   where token = p_token
     and revoked_at is null
     and accepted_at is null
     and expires_at > now();

  if v_invite.id is null or trim(lower(v_invite.email)) <> trim(lower(auth.email())) then
    raise exception 'Invalid invite';
  end if;

  insert into profiles (id, store_id, first_name, last_name, role)
  values (auth.uid(), v_invite.store_id, p_first, p_last, v_invite.role)
  returning id into v_new_profile;

  update counter.staff_invites set accepted_at = now() where id = v_invite.id;

  return v_new_profile;
end;
$$;

grant execute on function counter.accept_staff_invite(text, text, text) to authenticated;

create function counter.set_staff_role(p_profile_id uuid, p_role counter.user_role)
returns void
language plpgsql security definer set search_path = counter, public as $$
declare v_current_role counter.user_role;
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_role not in ('ADMIN','CASHIER') then
    raise exception 'Invalid role';
  end if;

  select role into v_current_role
    from profiles
   where id = p_profile_id and store_id = counter.auth_store_id();

  if v_current_role is null then
    raise exception 'No such staff member';
  end if;
  if v_current_role = 'OWNER' then
    raise exception 'The store owner''s role can''t be changed';
  end if;

  update profiles set role = p_role where id = p_profile_id;
end;
$$;

grant execute on function counter.set_staff_role(uuid, counter.user_role) to authenticated;

-- Blocks targeting an OWNER (can never be deactivated) and blocks
-- self-deactivation (a cheap footgun guard, not a security necessity —
-- the OWNER can always undo any ADMIN/CASHIER deactivation since OWNER
-- itself can never be deactivated, so the store can never be
-- permanently locked out regardless of what admins do to each other).
create function counter.set_staff_deactivated(p_profile_id uuid, p_deactivated boolean)
returns void
language plpgsql security definer set search_path = counter, public as $$
declare v_current_role counter.user_role;
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_profile_id = auth.uid() then
    raise exception 'You can''t deactivate your own account';
  end if;

  select role into v_current_role
    from profiles
   where id = p_profile_id and store_id = counter.auth_store_id();

  if v_current_role is null then
    raise exception 'No such staff member';
  end if;
  if v_current_role = 'OWNER' then
    raise exception 'The store owner can''t be deactivated';
  end if;

  update profiles
     set deactivated_at = case when p_deactivated then now() else null end
   where id = p_profile_id;
end;
$$;

grant execute on function counter.set_staff_deactivated(uuid, boolean) to authenticated;

-- ============================================================
-- Advanced sale reporting (Essentials)
--
-- Both derive store_id from auth_store_id() internally rather than
-- accepting it as a parameter — the same reason create_sale doesn't
-- take store_id either: a caller can't point the query at another
-- store just by passing a different id.
-- ============================================================

create function counter.sales_revenue_by_day(p_from timestamptz, p_to timestamptz)
returns table (day date, total_cents bigint, sale_count bigint)
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select date_trunc('day', s.created_at)::date as day,
           coalesce(sum(s.subtotal_cents), 0)::bigint as total_cents,
           count(*)::bigint as sale_count
    from counter.sales s
    where s.store_id = counter.auth_store_id()
      and (p_from is null or s.created_at >= p_from)
      and (p_to is null or s.created_at < p_to)
    group by 1
    order by 1;
end;
$$;

grant execute on function counter.sales_revenue_by_day(timestamptz, timestamptz) to authenticated;

-- Groups by product_id (nullable — set_null on product delete) and
-- reports name_snapshot ("what the receipt said" at time of sale)
-- rather than joining the live product name, since a report should
-- reflect what was actually sold even if the product was later
-- renamed or archived.
create function counter.sales_top_products(p_from timestamptz, p_to timestamptz, p_limit int default 10)
returns table (product_id uuid, name text, quantity bigint, revenue_cents bigint)
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select si.product_id,
           max(si.name_snapshot) as name,
           sum(si.quantity)::bigint as quantity,
           sum(si.quantity * si.unit_price_cents)::bigint as revenue_cents
    from counter.sale_items si
    join counter.sales s on s.id = si.sale_id
    where s.store_id = counter.auth_store_id()
      and (p_from is null or s.created_at >= p_from)
      and (p_to is null or s.created_at < p_to)
    group by si.product_id
    order by revenue_cents desc
    limit p_limit;
end;
$$;

grant execute on function counter.sales_top_products(timestamptz, timestamptz, int) to authenticated;
