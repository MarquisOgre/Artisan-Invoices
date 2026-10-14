-- Notify admin and manager users when a quotation or invoice is deleted.
-- Keep deletion notifications independent of the deleted record so they remain visible.

alter table public.notifications
  drop constraint if exists notifications_event_type_check;

alter table public.notifications
  add constraint notifications_event_type_check
  check (event_type in (
    'order_form_created',
    'quotation_created',
    'invoice_created',
    'quotation_deleted',
    'invoice_deleted'
  ));

create or replace function public.notify_on_quotation_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, event_type, title, message, target_path, entity_id)
  select r.user_id,
         'quotation_deleted',
         'Quotation deleted',
         'Quotation ' || coalesce(nullif(trim(old.quotation_number), ''), old.id::text) || ' has been deleted.',
         '/quotations',
         old.id
  from public.user_roles r
  where r.role::text in ('admin', 'manager');
  return old;
end;
$$;

create or replace function public.notify_on_invoice_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, event_type, title, message, target_path, entity_id)
  select r.user_id,
         'invoice_deleted',
         'Invoice deleted',
         'Invoice ' || coalesce(nullif(trim(old.invoice_number), ''), old.id::text) || ' has been deleted.',
         '/invoices',
         old.id
  from public.user_roles r
  where r.role::text in ('admin', 'manager');
  return old;
end;
$$;

revoke all on function public.notify_on_quotation_deleted() from public, anon, authenticated;
revoke all on function public.notify_on_invoice_deleted() from public, anon, authenticated;

drop trigger if exists notifications_after_quotation_deleted on public.quotations;
create trigger notifications_after_quotation_deleted
  after delete on public.quotations
  for each row execute function public.notify_on_quotation_deleted();

drop trigger if exists notifications_after_invoice_deleted on public.invoices;
create trigger notifications_after_invoice_deleted
  after delete on public.invoices
  for each row execute function public.notify_on_invoice_deleted();
