-- Permanent customer IDs and sequential order-form IDs.
-- Customer IDs are generated once per customer and reused for every order.

alter table public.customers
  add column if not exists customer_code text;

create sequence if not exists public.customer_code_seq
  start with 1
  increment by 1
  cache 1;

-- Backfill existing customers that do not have a code.
with numbered as (
  select id, row_number() over (order by created_at, id) as rn
  from public.customers
  where customer_code is null or btrim(customer_code) = ''
)
update public.customers c
set customer_code = 'CUS-' || lpad(numbered.rn::text, 6, '0')
from numbered
where c.id = numbered.id;

-- Move the sequence past the highest assigned customer number.
select setval(
  'public.customer_code_seq',
  coalesce(
    (select max(nullif(regexp_replace(customer_code, '^CUS-', ''), '')::bigint)
     from public.customers
     where customer_code ~ '^CUS-[0-9]+$'),
    0
  ),
  true
);

create or replace function public.assign_customer_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_code is null or btrim(new.customer_code) = '' then
    new.customer_code := 'CUS-' || lpad(nextval('public.customer_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists assign_customer_code on public.customers;
create trigger assign_customer_code
before insert on public.customers
for each row execute function public.assign_customer_code();

create unique index if not exists customers_customer_code_unique
  on public.customers(customer_code)
  where customer_code is not null;

-- Order Form IDs use the requested ORD-YYYYMMDD-0001 style.
create sequence if not exists public.order_form_id_seq
  start with 1
  increment by 1
  cache 1;

create or replace function public.next_order_form_id()
returns text
language sql
security definer
set search_path = public
as $$
  select 'ORD-' || to_char(current_date, 'YYYYMMDD') || '-' ||
         lpad(nextval('public.order_form_id_seq')::text, 4, '0');
$$;

revoke all on function public.next_order_form_id() from public;
grant execute on function public.next_order_form_id() to authenticated;

-- Link each order sheet to the permanent customer record.
alter table public.order_sheets
  add column if not exists customer_id uuid references public.customers(id) on delete restrict;

create index if not exists order_sheets_customer_idx
  on public.order_sheets(customer_id);

-- Keep the customer code/name stored on the order as a historical snapshot.
