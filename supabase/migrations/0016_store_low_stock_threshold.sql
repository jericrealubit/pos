-- Makes the "low stock" cutoff used by the products list's Stock filter/badge
-- an adjustable per-store setting instead of a hardcoded constant.
alter table counter.stores
  add column low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0);
