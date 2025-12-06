-- Create expense_register table for monthly expense tracking
CREATE TABLE IF NOT EXISTS public.expense_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID,
  CONSTRAINT valid_month CHECK (month >= 1 AND month <= 12),
  CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2100)
);

-- Enable Row Level Security
ALTER TABLE public.expense_register ENABLE ROW LEVEL SECURITY;

-- Create policies for expense_register
CREATE POLICY "Authenticated can view all expenses"
  ON public.expense_register
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create expenses"
  ON public.expense_register
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can update expenses"
  ON public.expense_register
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated can delete expenses"
  ON public.expense_register
  FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_expense_register_updated_at
  BEFORE UPDATE ON public.expense_register
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups by month and year
CREATE INDEX idx_expense_register_month_year ON public.expense_register(month, year);