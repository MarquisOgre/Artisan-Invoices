-- Add tax_type column to invoices table
ALTER TABLE public.invoices ADD COLUMN tax_type TEXT;