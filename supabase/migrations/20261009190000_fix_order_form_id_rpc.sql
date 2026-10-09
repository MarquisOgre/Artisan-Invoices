-- Restore order-form ID generation for the Supabase project.
-- The frontend calls next_order_form_id(p_order_date), so provide that
-- signature while preserving the established ORD-YYYYMMDD-0001 format.
CREATE OR REPLACE FUNCTION public.next_order_form_id(p_order_date date)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'ORD-' || to_char(COALESCE(p_order_date, CURRENT_DATE), 'YYYYMMDD') || '-' ||
         lpad(nextval('public.order_form_id_seq')::text, 4, '0');
$$;

REVOKE ALL ON FUNCTION public.next_order_form_id(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_order_form_id(date) TO authenticated;
