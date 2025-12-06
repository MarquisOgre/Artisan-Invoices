-- Add missing tax-related columns to quotations table
ALTER TABLE public.quotations 
ADD COLUMN subtotal numeric DEFAULT 0,
ADD COLUMN tax_amount numeric DEFAULT 0,
ADD COLUMN tax_type text DEFAULT 'IGST';

-- Add missing tax-related columns to invoices table  
ALTER TABLE public.invoices
ADD COLUMN subtotal numeric DEFAULT 0,
ADD COLUMN tax_amount numeric DEFAULT 0,
ADD COLUMN tax_type text DEFAULT 'IGST',
ADD COLUMN paid_date date;