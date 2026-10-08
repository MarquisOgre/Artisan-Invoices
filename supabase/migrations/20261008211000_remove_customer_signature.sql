-- Customer Signature is no longer part of Order Sheets.
-- The order is instead attributed to the authenticated user who booked/prepared it.
alter table public.order_sheets
  drop column if exists customer_signature;
