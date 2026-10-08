-- Remove the legacy Stock and Expenses modules completely.
-- This intentionally removes the tables and all dependent objects/data.
drop table if exists public.inward_register cascade;
drop table if exists public.outward_register cascade;
drop table if exists public.stock_register cascade;
drop table if exists public.expense_register cascade;
drop table if exists public.expense_categories cascade;
