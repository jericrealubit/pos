-- 0017 locked store updates from `authenticated` down to an explicit
-- column allowlist (name, address, phone, low_stock_threshold, currency)
-- to stop admins writing billing columns. 0022 added
-- receipt_footer_message as another store-editable setting, but missed
-- extending that allowlist — writes silently failed for regular admins
-- (only the service role, which bypasses grants, could write it).
grant update (receipt_footer_message) on counter.stores to authenticated;
