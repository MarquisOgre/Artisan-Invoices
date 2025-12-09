-- Update SELECT policies to allow all authenticated users to view shared business data

-- Invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Authenticated users can view all invoices" 
ON public.invoices 
FOR SELECT 
TO authenticated
USING (true);

-- Quotations
DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;
CREATE POLICY "Authenticated users can view all quotations" 
ON public.quotations 
FOR SELECT 
TO authenticated
USING (true);

-- Customers
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
CREATE POLICY "Authenticated users can view all customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (true);

-- Expense Register
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expense_register;
CREATE POLICY "Authenticated users can view all expenses" 
ON public.expense_register 
FOR SELECT 
TO authenticated
USING (true);