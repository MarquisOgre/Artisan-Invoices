-- Add size column to stock_register table
ALTER TABLE public.stock_register 
ADD COLUMN IF NOT EXISTS size text;

-- Rename purchases to production (P)
ALTER TABLE public.stock_register 
RENAME COLUMN purchases TO production;

-- Create unique constraint for product_name, size, month, year combination
CREATE UNIQUE INDEX IF NOT EXISTS stock_register_product_size_month_year_idx 
ON public.stock_register (user_id, product_name, size, month, year);

-- Update existing entries to have default size if needed
UPDATE public.stock_register SET size = '39' WHERE size IS NULL;