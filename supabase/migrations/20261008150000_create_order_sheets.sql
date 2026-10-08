-- Digital Artisan Apparel Shirt & Pant Order Sheets
create table if not exists public.order_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_no text not null,
  order_date date not null default current_date,
  customer_code text,
  customer_name text not null,
  contact_no text,
  shirt_fabric_code text,
  shirt_patterns jsonb not null default '[]'::jsonb,
  shirt_standard_size text,
  shirt_measurements jsonb not null default '{}'::jsonb,
  shirt_style jsonb not null default '{}'::jsonb,
  shirt_notes text,
  pant_fabric_code text,
  pant_patterns jsonb not null default '[]'::jsonb,
  pant_standard_size text,
  pant_measurements jsonb not null default '{}'::jsonb,
  pant_style jsonb not null default '{}'::jsonb,
  pant_notes text,
  delivery_address text,
  delivery_date date,
  customer_signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_sheets_order_no_user_unique unique (user_id, order_no)
);

alter table public.order_sheets enable row level security;

drop policy if exists "Users can view their own order sheets" on public.order_sheets;
create policy "Users can view their own order sheets"
  on public.order_sheets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own order sheets" on public.order_sheets;
create policy "Users can create their own order sheets"
  on public.order_sheets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own order sheets" on public.order_sheets;
create policy "Users can update their own order sheets"
  on public.order_sheets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own order sheets" on public.order_sheets;
create policy "Users can delete their own order sheets"
  on public.order_sheets for delete
  using (auth.uid() = user_id);

create index if not exists order_sheets_user_created_idx
  on public.order_sheets (user_id, created_at desc);

create or replace function public.set_order_sheets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_order_sheets_updated_at on public.order_sheets;
create trigger set_order_sheets_updated_at
before update on public.order_sheets
for each row execute function public.set_order_sheets_updated_at();
