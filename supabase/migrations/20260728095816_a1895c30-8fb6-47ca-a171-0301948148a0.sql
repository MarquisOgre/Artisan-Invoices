DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;
CREATE POLICY "Users can view their own customers"
ON public.customers FOR SELECT
TO authenticated
USING (auth.uid() = user_id);