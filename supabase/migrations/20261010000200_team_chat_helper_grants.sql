revoke execute on function public.is_chat_member(uuid) from anon;
revoke execute on function public.is_chat_creator(uuid) from anon;
grant execute on function public.is_chat_member(uuid) to authenticated;
grant execute on function public.is_chat_creator(uuid) to authenticated;