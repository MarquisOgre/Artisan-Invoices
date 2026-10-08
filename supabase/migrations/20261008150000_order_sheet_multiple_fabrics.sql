-- Allow each order sheet garment to have multiple existing Fabric Master options.
create table if not exists public.order_sheet_fabrics (
  id uuid primary key default gen_random_uuid(),
  order_sheet_id uuid not null references public.order_sheets(id) on delete cascade,
  garment_type text not null check (garment_type in ('shirt', 'pant')),
  fabric_id uuid not null references public.fabrics(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (order_sheet_id, garment_type, fabric_id)
);

create index if not exists idx_order_sheet_fabrics_order_sheet
  on public.order_sheet_fabrics(order_sheet_id, garment_type, sort_order);

alter table public.order_sheet_fabrics enable row level security;

drop policy if exists "Users can view their own order sheet fabrics" on public.order_sheet_fabrics;
drop policy if exists "Users can create their own order sheet fabrics" on public.order_sheet_fabrics;
drop policy if exists "Users can update their own order sheet fabrics" on public.order_sheet_fabrics;
drop policy if exists "Users can delete their own order sheet fabrics" on public.order_sheet_fabrics;

create policy "Users can view their own order sheet fabrics"
on public.order_sheet_fabrics for select
using (
  exists (
    select 1 from public.order_sheets os
    where os.id = order_sheet_fabrics.order_sheet_id
      and os.user_id = auth.uid()
  )
);

create policy "Users can create their own order sheet fabrics"
on public.order_sheet_fabrics for insert
with check (
  exists (
    select 1 from public.order_sheets os
    where os.id = order_sheet_fabrics.order_sheet_id
      and os.user_id = auth.uid()
  )
);

create policy "Users can update their own order sheet fabrics"
on public.order_sheet_fabrics for update
using (
  exists (
    select 1 from public.order_sheets os
    where os.id = order_sheet_fabrics.order_sheet_id
      and os.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.order_sheets os
    where os.id = order_sheet_fabrics.order_sheet_id
      and os.user_id = auth.uid()
  )
);

create policy "Users can delete their own order sheet fabrics"
on public.order_sheet_fabrics for delete
using (
  exists (
    select 1 from public.order_sheets os
    where os.id = order_sheet_fabrics.order_sheet_id
      and os.user_id = auth.uid()
  )
);

-- Preserve existing primary fabric selections as the first option.
insert into public.order_sheet_fabrics (order_sheet_id, garment_type, fabric_id, sort_order)
select id, 'shirt', shirt_fabric_id, 0
from public.order_sheets
where shirt_fabric_id is not null
on conflict (order_sheet_id, garment_type, fabric_id) do nothing;

insert into public.order_sheet_fabrics (order_sheet_id, garment_type, fabric_id, sort_order)
select id, 'pant', pant_fabric_id, 0
from public.order_sheets
where pant_fabric_id is not null
on conflict (order_sheet_id, garment_type, fabric_id) do nothing;
