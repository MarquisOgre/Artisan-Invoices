-- In-app notifications for order forms, quotations, and invoices.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('order_form_created', 'quotation_created', 'invoice_created')),
  title text not null,
  message text not null,
  target_path text not null,
  entity_id uuid,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_user_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can mark their own notifications read" on public.notifications;
create policy "Users can mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Notifications are created only by database triggers, not directly by clients.
revoke insert, delete on public.notifications from anon, authenticated;

create or replace function public.notify_on_order_form_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_label text;
begin
  v_order_label := coalesce(nullif(trim(new.order_no), ''), 'a new order form');
  insert into public.notifications (user_id, event_type, title, message, target_path, entity_id)
  select r.user_id, 'order_form_created', 'New order form created',
         'Order form ' || v_order_label || ' has been created.',
         '/order-forms', new.id
  from public.user_roles r;
  return new;
end;
$$;

create or replace function public.notify_on_quotation_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, event_type, title, message, target_path, entity_id)
  select r.user_id, 'quotation_created', 'New quotation created',
         'Quotation ' || coalesce(nullif(trim(new.quotation_number), ''), 'created') || ' has been created.',
         '/quotations', new.id
  from public.user_roles r
  where r.role::text in ('admin', 'manager');
  return new;
end;
$$;

create or replace function public.notify_on_invoice_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, event_type, title, message, target_path, entity_id)
  select r.user_id, 'invoice_created', 'New invoice created',
         'Invoice ' || coalesce(nullif(trim(new.invoice_number), ''), 'created') || ' has been created.',
         '/invoices', new.id
  from public.user_roles r
  where r.role::text in ('admin', 'manager');
  return new;
end;
$$;

revoke all on function public.notify_on_order_form_created() from public, anon, authenticated;
revoke all on function public.notify_on_quotation_created() from public, anon, authenticated;
revoke all on function public.notify_on_invoice_created() from public, anon, authenticated;

drop trigger if exists notifications_after_order_form_created on public.order_sheets;
create trigger notifications_after_order_form_created
  after insert on public.order_sheets
  for each row execute function public.notify_on_order_form_created();

drop trigger if exists notifications_after_quotation_created on public.quotations;
create trigger notifications_after_quotation_created
  after insert on public.quotations
  for each row execute function public.notify_on_quotation_created();

drop trigger if exists notifications_after_invoice_created on public.invoices;
create trigger notifications_after_invoice_created
  after insert on public.invoices
  for each row execute function public.notify_on_invoice_created();

-- Enable realtime delivery for each user's own notification rows.
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
