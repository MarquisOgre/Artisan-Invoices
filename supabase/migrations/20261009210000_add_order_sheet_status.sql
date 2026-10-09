ALTER TABLE public.order_sheets
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pending';

ALTER TABLE public.order_sheets
  DROP CONSTRAINT IF EXISTS order_sheets_status_check;

ALTER TABLE public.order_sheets
  ADD CONSTRAINT order_sheets_status_check
  CHECK (status IN ('Pending', 'In Progress', 'Ready', 'Delivered', 'Cancelled'));
