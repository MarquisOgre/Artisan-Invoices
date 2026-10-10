-- Admin-only global notification management.
-- Keep normal users restricted to reading/updating their own notifications.
create or replace function public.admin_list_notifications()
returns table (
  id uuid,
  user_id uuid,
  event_type text,
  title text,
  message text,
  target_path text,
  created_at timestamptz,
  read_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role::text = 'admin'
  ) then
    raise exception 'Only admins can manage notifications' using errcode = '42501';
  end if;

  return query
  select n.id, n.user_id, n.event_type, n.title, n.message, n.target_path, n.created_at, n.read_at
  from public.notifications n
  order by n.created_at desc
  limit 1000;
end;
$$;

create or replace function public.admin_delete_notifications(
  p_ids uuid[] default null,
  p_all boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if not exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role::text = 'admin'
  ) then
    raise exception 'Only admins can manage notifications' using errcode = '42501';
  end if;

  if p_all then
    delete from public.notifications;
  elsif coalesce(array_length(p_ids, 1), 0) > 0 then
    delete from public.notifications where id = any(p_ids);
  else
    raise exception 'Choose notifications to delete or explicitly request delete all';
  end if;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.admin_list_notifications() from public, anon;
revoke all on function public.admin_delete_notifications(uuid[], boolean) from public, anon;
grant execute on function public.admin_list_notifications() to authenticated;
grant execute on function public.admin_delete_notifications(uuid[], boolean) to authenticated;
