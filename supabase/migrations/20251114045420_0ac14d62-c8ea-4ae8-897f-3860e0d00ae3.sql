-- Centralize data access: allow all authenticated users to read/write shared data
-- Update RLS policies for shared tables

-- CUSTOMERS
DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;

CREATE POLICY "Authenticated can view all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (true);

-- INVOICES
DROP POLICY IF EXISTS "Users can create their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;

CREATE POLICY "Authenticated can view all invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can create invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete invoices"
ON public.invoices
FOR DELETE
TO authenticated
USING (true);

-- QUOTATIONS
DROP POLICY IF EXISTS "Users can create their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can delete their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;

CREATE POLICY "Authenticated can view all quotations"
ON public.quotations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can create quotations"
ON public.quotations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update quotations"
ON public.quotations
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete quotations"
ON public.quotations
FOR DELETE
TO authenticated
USING (true);

-- STOCK REGISTER
DROP POLICY IF EXISTS "Users can create their own stock" ON public.stock_register;
DROP POLICY IF EXISTS "Users can delete their own stock" ON public.stock_register;
DROP POLICY IF EXISTS "Users can update their own stock" ON public.stock_register;
DROP POLICY IF EXISTS "Users can view their own stock" ON public.stock_register;

CREATE POLICY "Authenticated can view all stock"
ON public.stock_register
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can create stock"
ON public.stock_register
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update stock"
ON public.stock_register
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete stock"
ON public.stock_register
FOR DELETE
TO authenticated
USING (true);

-- PAYMENTS (centralize as well for consistency)
DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

CREATE POLICY "Authenticated can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can create payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete payments"
ON public.payments
FOR DELETE
TO authenticated
USING (true);
