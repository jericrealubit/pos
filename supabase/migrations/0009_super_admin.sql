-- ============================================================
-- Super admin — cross-tenant read of every store + the ability
-- to pause a store's access.
--
-- A super admin isn't a counter.profiles row (that table requires a
-- non-null store_id — it's inherently single-tenant). Instead it's
-- membership in counter.super_admins, checked explicitly inside two
-- security definer functions that are the *only* place in this schema
-- allowed to read across stores / read auth.users. Unlike
-- counter.customer_balances (see 0008), these intentionally bypass
-- RLS — the guard is the `auth_is_super_admin()` check inside the
-- function body, not the table-level RLS policies.
-- ============================================================

alter table counter.stores add column is_paused boolean not null default false;

create table counter.super_admins (
  id         uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table counter.super_admins enable row level security;

-- a user may only check their own membership; nothing else is exposed
-- via RLS — reads of the full list happen only through the security
-- definer functions below.
create policy read_own_super_admin on counter.super_admins for select
  using (id = auth.uid());

create function counter.auth_is_super_admin() returns boolean
language sql stable security definer set search_path = counter, public as $$
  select exists (select 1 from counter.super_admins where id = auth.uid())
$$;

grant execute on function counter.auth_is_super_admin() to authenticated;

create function counter.super_admin_list_stores()
returns table (
  store_id         uuid,
  store_name       text,
  currency         text,
  created_at       timestamptz,
  is_paused        boolean,
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
    select s.id, s.name, s.currency, s.created_at, s.is_paused,
           p.first_name, p.last_name, u.email::text
    from counter.stores s
    join counter.profiles p on p.store_id = s.id and p.role = 'OWNER'
    left join auth.users u on u.id = p.id
    order by s.created_at desc;
end;
$$;

grant execute on function counter.super_admin_list_stores() to authenticated;

create function counter.super_admin_set_store_paused(p_store_id uuid, p_paused boolean)
returns void
language plpgsql security definer set search_path = counter, public as $$
begin
  if not counter.auth_is_super_admin() then
    raise exception 'Not authorized';
  end if;

  update counter.stores set is_paused = p_paused where id = p_store_id;
end;
$$;

grant execute on function counter.super_admin_set_store_paused(uuid, boolean) to authenticated;
