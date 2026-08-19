-- Store contact info, shown on receipts.
alter table counter.stores
  add column address text,
  add column phone text;
