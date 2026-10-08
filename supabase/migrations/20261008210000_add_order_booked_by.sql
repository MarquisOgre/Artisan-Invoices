-- Replace the customer-entered signature with a persistent snapshot of the
-- authenticated user who prepared/booked the order.

alter table public.order_sheets
  add column if not exists order_booked_by text;

-- Existing customer signature values must not be treated as staff/user identities.
-- They are intentionally not migrated into the new field.
