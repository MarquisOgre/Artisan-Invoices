DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','invoices','quotations','order_sheets','order_sheet_fabrics','payments','fabrics']
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.has_role(auth.uid(), ''manager''::public.app_role)) WITH CHECK (public.has_role(auth.uid(), ''manager''::public.app_role))',
      'Managers can manage all ' || t, t
    );
  END LOOP;
END $$;
