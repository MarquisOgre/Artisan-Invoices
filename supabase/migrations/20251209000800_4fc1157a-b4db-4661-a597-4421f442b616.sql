-- Drop existing SELECT policy for stock_register
DROP POLICY IF EXISTS "Users can view their own stock" ON public.stock_register;

-- Create new SELECT policy that allows all authenticated users to view stock
CREATE POLICY "Authenticated users can view all stock" 
ON public.stock_register 
FOR SELECT 
TO authenticated
USING (true);