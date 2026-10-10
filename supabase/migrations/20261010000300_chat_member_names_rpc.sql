-- Expose only team login names to authenticated chat clients without opening
-- direct reads on the protected user_login_names table.
create or replace function public.get_chat_member_names()
returns table (user_id uuid, username text)
language sql
stable
security definer
set search_path = public
as $$
  select l.user_id, l.username
  from public.user_login_names l
  where auth.uid() is not null
  order by l.username;
$$;

revoke all on function public.get_chat_member_names() from public;
revoke all on function public.get_chat_member_names() from anon;
grant execute on function public.get_chat_member_names() to authenticated;
