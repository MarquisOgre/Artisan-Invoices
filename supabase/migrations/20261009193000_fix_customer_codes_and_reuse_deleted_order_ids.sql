-- Repair customer codes, preserve customer-code snapshots on orders, and
-- make deleted order-form IDs available for reuse.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.customer_code_seq START WITH 1 INCREMENT BY 1 CACHE 1;

WITH missing AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.customers
  WHERE customer_code IS NULL OR btrim(customer_code) = ''
),
current_max AS (
  SELECT COALESCE(MAX(substring(customer_code from '^CUS-([0-9]+)$')::bigint), 0) AS n
  FROM public.customers
  WHERE customer_code ~ '^CUS-[0-9]+$'
)
UPDATE public.customers c
SET customer_code = 'CUS-' || lpad((current_max.n + missing.rn)::text, 4, '0')
FROM missing, current_max
WHERE c.id = missing.id;

SELECT setval(
  'public.customer_code_seq',
  GREATEST(COALESCE((SELECT MAX(substring(customer_code from '^CUS-([0-9]+)$')::bigint)
    FROM public.customers WHERE customer_code ~ '^CUS-[0-9]+$'), 1), 1),
  COALESCE((SELECT MAX(substring(customer_code from '^CUS-([0-9]+)$')::bigint)
    FROM public.customers WHERE customer_code ~ '^CUS-[0-9]+$'), 0) > 0
);

CREATE OR REPLACE FUNCTION public.assign_customer_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.customer_code IS NULL OR btrim(NEW.customer_code) = '' THEN
    NEW.customer_code := 'CUS-' || lpad(nextval('public.customer_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_customer_code ON public.customers;
CREATE TRIGGER assign_customer_code BEFORE INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.assign_customer_code();
CREATE UNIQUE INDEX IF NOT EXISTS customers_customer_code_unique
ON public.customers(customer_code) WHERE customer_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.order_form_id_reuse (
  order_no text PRIMARY KEY,
  order_date date NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_form_id_reuse ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.release_deleted_order_form_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.order_form_id_reuse(order_no, order_date)
  VALUES (OLD.order_no, OLD.order_date)
  ON CONFLICT (order_no) DO UPDATE
  SET order_date = EXCLUDED.order_date, released_at = now();
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS release_deleted_order_form_id ON public.order_sheets;
CREATE TRIGGER release_deleted_order_form_id AFTER DELETE ON public.order_sheets
FOR EACH ROW EXECUTE FUNCTION public.release_deleted_order_form_id();

CREATE OR REPLACE FUNCTION public.next_order_form_id(p_order_date date)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reusable_id text;
  next_number bigint;
  effective_date date := COALESCE(p_order_date, CURRENT_DATE);
BEGIN
  SELECT r.order_no INTO reusable_id
  FROM public.order_form_id_reuse r
  WHERE r.order_date = effective_date
  ORDER BY r.released_at, r.order_no
  LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF reusable_id IS NOT NULL THEN
    DELETE FROM public.order_form_id_reuse WHERE order_no = reusable_id;
    RETURN reusable_id;
  END IF;

  SELECT COALESCE(MAX(substring(order_no from '-([0-9]+)$')::bigint), 0) + 1
  INTO next_number
  FROM public.order_sheets
  WHERE order_no LIKE 'ORD-' || to_char(effective_date, 'YYYYMMDD') || '-%';

  RETURN 'ORD-' || to_char(effective_date, 'YYYYMMDD') || '-' || lpad(next_number::text, 4, '0');
END;
$$;
REVOKE ALL ON FUNCTION public.next_order_form_id(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_order_form_id(date) TO authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS order_sheets_order_no_unique ON public.order_sheets(order_no);

CREATE OR REPLACE FUNCTION public.sync_order_sheet_customer_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  resolved_code text;
  resolved_name text;
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    SELECT c.customer_code, c.name INTO resolved_code, resolved_name
    FROM public.customers c WHERE c.id = NEW.customer_id;
    IF FOUND THEN
      IF NEW.customer_code IS NULL OR btrim(NEW.customer_code) = '' THEN
        NEW.customer_code := resolved_code;
      END IF;
      IF NEW.customer_name IS NULL OR btrim(NEW.customer_name) = '' THEN
        NEW.customer_name := resolved_name;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_order_sheet_customer_code ON public.order_sheets;
CREATE TRIGGER sync_order_sheet_customer_code
BEFORE INSERT OR UPDATE OF customer_id, customer_code, customer_name
ON public.order_sheets FOR EACH ROW
EXECUTE FUNCTION public.sync_order_sheet_customer_code();

UPDATE public.order_sheets o
SET customer_code = c.customer_code
FROM public.customers c
WHERE o.customer_id = c.id
  AND (o.customer_code IS NULL OR btrim(o.customer_code) = '')
  AND c.customer_code IS NOT NULL;

COMMIT;
