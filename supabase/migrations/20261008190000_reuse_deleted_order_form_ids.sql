-- Reuse deleted order-form IDs and generate the first available sequence number per order date.
-- Example: if 20261008-002 is deleted, the next order on 2026-10-08 reuses 20261008-002.

drop function if exists public.next_order_form_id(date);

create or replace function public.next_order_form_id(p_order_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_no integer := 1;
  candidate text;
begin
  perform pg_advisory_xact_lock(hashtext('order-form-id:' || p_order_date::text));

  loop
    candidate := to_char(p_order_date, 'YYYYMMDD') || '-' || lpad(candidate_no::text, 3, '0');

    if not exists (
      select 1
      from public.order_sheets
      where order_no = candidate
    ) then
      return candidate;
    end if;

    candidate_no := candidate_no + 1;
  end loop;
end;
$$;

revoke all on function public.next_order_form_id(date) from public;
grant execute on function public.next_order_form_id(date) to authenticated;
