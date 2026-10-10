-- Allow every authenticated user to delete only their own notifications.
grant delete on public.notifications to authenticated;

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete to authenticated
  using (user_id = auth.uid());
