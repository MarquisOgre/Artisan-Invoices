create table if not exists public.fabrics (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  brand text not null,
  article text not null,
  design text not null,
  finish text,
  count_spec text,
  composition text,
  swatch_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fabrics enable row level security;

create policy "Admins can view fabrics"
  on public.fabrics for select to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can insert fabrics"
  on public.fabrics for insert to authenticated
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can update fabrics"
  on public.fabrics for update to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can delete fabrics"
  on public.fabrics for delete to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

alter table public.order_sheets
  add column if not exists shirt_fabric_id uuid references public.fabrics(id) on delete set null,
  add column if not exists pant_fabric_id uuid references public.fabrics(id) on delete set null;

create index if not exists idx_fabrics_code on public.fabrics(code);
create index if not exists idx_fabrics_brand_article on public.fabrics(brand, article);
create index if not exists idx_order_sheets_shirt_fabric_id on public.order_sheets(shirt_fabric_id);
create index if not exists idx_order_sheets_pant_fabric_id on public.order_sheets(pant_fabric_id);
