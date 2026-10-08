create table if not exists public.user_login_names (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists user_login_names_username_lower_idx
  on public.user_login_names (lower(username));

alter table public.user_login_names enable row level security;

drop policy if exists "No direct access to login names" on public.user_login_names;
create policy "No direct access to login names"
  on public.user_login_names
  for all
  using (false)
  with check (false);
