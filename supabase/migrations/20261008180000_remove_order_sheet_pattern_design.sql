-- Remove Pattern / Design fields from Order Sheets.
-- Pattern / Design is no longer part of the order form or print template.

alter table public.order_sheets
  drop column if exists shirt_patterns,
  drop column if exists pant_patterns;
