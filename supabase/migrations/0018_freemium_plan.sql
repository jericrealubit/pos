-- ============================================================
-- Freemium: add an explicit FREE plan value.
--
-- Runtime access is still *derived* in lib/billing.ts from paid_until (a
-- lapsed TRIAL or PAID store simply reads as tier "FREE" — no cron needed
-- to flip anything). This migration exists so an operator can also set a
-- store to FREE explicitly and durably from the super-admin console via
-- super_admin_set_store_billing, e.g. to end a trial early without lying
-- about paid_until, or to record that a store deliberately chose not to
-- pay. Purely additive — enum values can't be removed, only added.
-- ============================================================

alter type counter.store_plan add value if not exists 'FREE';
