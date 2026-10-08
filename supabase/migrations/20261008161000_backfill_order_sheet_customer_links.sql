-- Backfill customer master records for order sheets created before customer_id existed.
insert into public.customers (user_id, name, phone, address)
select distinct on (
  os.user_id,
  lower(btrim(os.customer_name)),
  coalesce(btrim(os.contact_no), '')
)
  os.user_id,
  btrim(os.customer_name),
  nullif(btrim(os.contact_no), ''),
  nullif(btrim(os.delivery_address), '')
from public.order_sheets os
where os.customer_id is null
  and btrim(os.customer_name) <> ''
  and not exists (
    select 1
    from public.customers c
    where c.user_id = os.user_id
      and lower(btrim(c.name)) = lower(btrim(os.customer_name))
      and coalesce(btrim(c.phone), '') = coalesce(btrim(os.contact_no), '')
  )
order by
  os.user_id,
  lower(btrim(os.customer_name)),
  coalesce(btrim(os.contact_no), ''),
  os.created_at,
  os.id;

update public.order_sheets os
set
  customer_id = c.id,
  customer_code = c.customer_code
from public.customers c
where os.customer_id is null
  and c.user_id = os.user_id
  and lower(btrim(c.name)) = lower(btrim(os.customer_name))
  and coalesce(btrim(c.phone), '') = coalesce(btrim(os.contact_no), '');

update public.order_sheets os
set customer_code = c.customer_code
from public.customers c
where os.customer_id = c.id
  and (os.customer_code is distinct from c.customer_code);
