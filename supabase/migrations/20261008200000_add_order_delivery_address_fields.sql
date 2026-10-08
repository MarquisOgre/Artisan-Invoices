-- Store structured delivery address fields on each order.
alter table public.order_sheets
  add column if not exists delivery_city text,
  add column if not exists delivery_state text,
  add column if not exists delivery_pincode text;
