-- Add expense_date column to expense_register
ALTER TABLE public.expense_register ADD COLUMN IF NOT EXISTS expense_date date DEFAULT CURRENT_DATE;

-- Add advance_amount column to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS advance_amount numeric DEFAULT 0;

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Folder',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expense_categories
CREATE POLICY "Authenticated users can view all expense categories"
ON public.expense_categories
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own expense categories"
ON public.expense_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories"
ON public.expense_categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense categories"
ON public.expense_categories
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();