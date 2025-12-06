-- Create settings table to support app configuration per user
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  setting_type text not null,
  setting_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_user_type_unique unique (user_id, setting_type)
);

-- Enable RLS and add permissive policy similar to existing tables
alter table public.settings enable row level security;
create policy "Allow all operations on settings"
  on public.settings
  for all
  using (true)
  with check (true);

-- Trigger to maintain updated_at
create trigger update_settings_updated_at
before update on public.settings
for each row execute function public.update_updated_at_column();

-- Create quotations table used throughout the app
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  quotation_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric not null default 0,
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  tax_type text,
  status text not null default 'save',
  date date not null default current_date,
  valid_until date,
  items jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotations_user_number_unique unique (user_id, quotation_number)
);

-- Enable RLS and add permissive policy
alter table public.quotations enable row level security;
create policy "Allow all operations on quotations"
  on public.quotations
  for all
  using (true)
  with check (true);

-- Trigger to maintain updated_at
create trigger update_quotations_updated_at
before update on public.quotations
for each row execute function public.update_updated_at_column();

-- Add missing columns used by the app to existing tables
-- Customers: user_id and updated_at trigger
alter table public.customers add column if not exists user_id uuid;
create trigger update_customers_updated_at
before update on public.customers
for each row execute function public.update_updated_at_column();

-- Invoices: user_id, quotation_id, tax_type, paid_date and updated_at trigger
alter table public.invoices add column if not exists user_id uuid;
alter table public.invoices add column if not exists quotation_id uuid references public.quotations(id) on delete set null;
alter table public.invoices add column if not exists tax_type text;
alter table public.invoices add column if not exists paid_date date;
create trigger update_invoices_updated_at
before update on public.invoices
for each row execute function public.update_updated_at_column();

-- Payments: user_id (optional, but aligns with app patterns)
alter table public.payments add column if not exists user_id uuid;