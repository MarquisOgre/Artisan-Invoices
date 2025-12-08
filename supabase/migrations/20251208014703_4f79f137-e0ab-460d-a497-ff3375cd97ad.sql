-- Add paid_date column to invoices table
ALTER TABLE public.invoices ADD COLUMN paid_date date;