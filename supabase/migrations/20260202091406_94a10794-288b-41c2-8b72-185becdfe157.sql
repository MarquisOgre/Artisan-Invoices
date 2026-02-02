-- Add tax_type and tax_mode columns to quotations table
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS tax_type text DEFAULT 'IGST_18',
ADD COLUMN IF NOT EXISTS tax_mode text DEFAULT 'exclusive';

-- Add tax_type and tax_mode columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS tax_type text DEFAULT 'IGST_18',
ADD COLUMN IF NOT EXISTS tax_mode text DEFAULT 'exclusive';