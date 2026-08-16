-- customer_balances was created without security_invoker, so it ran with
-- the view owner's (privileged migration role's) rights against the
-- underlying customers/sales/payments tables — bypassing RLS entirely and
-- leaking every store's customers to every other store. security_invoker
-- makes the view evaluate RLS as the querying role instead, matching every
-- other read in this app.
alter view counter.customer_balances set (security_invoker = true);
