-- Defense in depth: RLS already correctly restricts the `authenticated`/
-- `anon` roles on every table (verified live across all tables during a
-- full store-isolation audit). FORCE additionally makes RLS apply even to
-- the tables' owning role, closing off the exact class of bug that let
-- counter.customer_balances leak cross-store data before it had
-- security_invoker set (0008) — a database object quietly running with
-- elevated privileges instead of the querying user's.
--
-- counter.stores and counter.profiles are deliberately excluded: 0009's
-- super_admin_list_stores()/super_admin_set_store_paused() are SECURITY
-- DEFINER functions owned by the same role that owns these two tables,
-- and they intentionally rely on that owner's RLS bypass to read/update
-- every store's row regardless of the caller's own store (guarded
-- instead by the explicit auth_is_super_admin() check inside each
-- function body). FORCE on these two tables would break that feature —
-- a super admin has no counter.profiles row, so auth_store_id() resolves
-- to null and every store-scoped policy would then match zero rows.
alter table counter.categories   force row level security;
alter table counter.products     force row level security;
alter table counter.customers    force row level security;
alter table counter.sales        force row level security;
alter table counter.sale_items   force row level security;
alter table counter.payments     force row level security;
alter table counter.super_admins force row level security;
