-- Normalize Customer IDs and Order Form IDs.
-- Customer IDs: CUS-0001 ... CUS-9999, then CUS-10000, etc.
-- Order Form IDs: YYYYMMDD-001 ... YYYYMMDD-999, then YYYYMMDD-1000, etc.

create sequence if not exists public.customer_code_seq
  start with 1
  increment by 1
  cache 1;

-- Normalize existing customer IDs to the new minimum-4-digit numeric format.
update public.customers
set customer_code = 'CUS-' || case
  when customer_code ~ '^CUS-[0-9]+$'
    then ltrim(regexp_replace(customer_code, '^CUS-', ''), '0')
  else ''
end
where customer_code is not null;

update public.customers
set customer_code = 'CUS-' || lpad(
  nullif(regexp_replace(customer_code, '^CUS-', ''), '')::bigint::text,
  4,
  '0'
)
where customer_code ~ '^CUS-[0-9]+$';

select setval(
  'public.customer_code_seq',
  coalesce(
    (select max(nullif(regexp_replace(customer_code, '^CUS-', ''), '')::bigint)
     from public.customers
     where customer_code ~ '^CUS-[0-9]+$'),
    0
  ) + 1,
  false
);

create or replace function public.assign_customer_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_code is null or btrim(new.customer_code) = '' then
    new.customer_code := 'CUS-' || lpad(nextval('public.customer_code_seq')::text, 4, '0');
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

-- One counter per order date gives YYYYMMDD-001, YYYYMMDD-002, etc.
create table if not exists public.order_form_counters (
  order_date date primary key,
  last_number bigint not null default 0
);

insert into public.order_form_counters (order_date, last_number)
select order_date,
       max(
         case
           when order_no ~ '^[0-9]{8}-[0-9]+$'
             then split_part(order_no, '-', 2)::bigint
           when order_no ~ '^ORD-[0-9]{8}-[0-9]+$'
             then split_part(order_no, '-', 3)::bigint
           else 0
         end
       )
from public.order_sheets
group by order_date
on conflict (order_date)
do update set last_number = greatest(public.order_form_counters.last_number, excluded.last_number);

create or replace function public.next_order_form_id(p_order_date date default current_date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number bigint;
begin
  insert into public.order_form_counters(order_date, last_number)
  values (p_order_date, 1)
  on conflict (order_date)
  do update set last_number = public.order_form_counters.last_number + 1
  returning last_number into next_number;

  return to_char(p_order_date, 'YYYYMMDD') || '-' || lpad(next_number::text, 3, '0');
end;
$$;

revoke all on function public.next_order_form_id(date) from public;
grant execute on function public.next_order_form_id(date) to authenticated;

-- Convert existing saved order IDs to the new format using their existing date and
-- preserve their numeric suffix where possible.
update public.order_sheets
set order_no = to_char(order_date, 'YYYYMMDD') || '-' ||
  lpad(
    case
      when order_no ~ '^ORD-[0-9]{8}-[0-9]+$' then split_part(order_no, '-', 3)::bigint
      when order_no ~ '^[0-9]{8}-[0-9]+$' then split_part(order_no, '-', 2)::bigint
      else row_number() over (order by created_at, id)::bigint
    end::text,
    3,
    '0'
  );

-- Keep the per-date counters ahead of all converted order IDs.
insert into public.order_form_counters(order_date, last_number)
select order_date,
       max(split_part(order_no, '-', 2)::bigint)
from public.order_sheets
where order_no ~ '^[0-9]{8}-[0-9]+$'
group by order_date
on conflict (order_date)
do update set last_number = greatest(public.order_form_counters.last_number, excluded.last_number);

create unique index if not exists order_sheets_order_no_user_unique
  on public.order_sheets(user_id, order_no);
