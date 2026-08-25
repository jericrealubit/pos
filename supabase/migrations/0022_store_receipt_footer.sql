-- Store-configurable receipt footer message, shown on both the printable
-- HTML receipt and the downloaded/emailed PDF in place of the hardcoded
-- "Thanks for your business!" line.
alter table counter.stores
  add column receipt_footer_message text;
