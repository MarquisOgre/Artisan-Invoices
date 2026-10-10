-- Artisan Invoices: internal team chat
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_group_title_length check (title is null or char_length(title) between 1 and 120)
);

create table if not exists public.chat_conversation_members (
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint chat_message_not_blank check (length(trim(body)) > 0)
);

create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_id, created_at);
create index if not exists chat_conversation_members_user_idx
  on public.chat_conversation_members (user_id, conversation_id);
create index if not exists chat_conversations_updated_idx
  on public.chat_conversations (updated_at desc);

alter table public.chat_conversations enable row level security;
alter table public.chat_conversation_members enable row level security;
alter table public.chat_messages enable row level security;

-- Explicit grants: keep chat data private and limit updates to fields the UI needs.
grant select, insert on public.chat_conversations to authenticated;
grant update (updated_at) on public.chat_conversations to authenticated;
grant select, insert on public.chat_conversation_members to authenticated;
grant update (last_read_at) on public.chat_conversation_members to authenticated;
grant select, insert on public.chat_messages to authenticated;

-- SECURITY DEFINER helpers avoid recursive RLS checks on the membership table.
create or replace function public.is_chat_member(p_conversation_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as 'select exists (select 1 from public.chat_conversation_members m where m.conversation_id = p_conversation_id and m.user_id = auth.uid())';

create or replace function public.is_chat_creator(p_conversation_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as 'select exists (select 1 from public.chat_conversations c where c.id = p_conversation_id and c.created_by = auth.uid())';

revoke all on function public.is_chat_member(uuid) from public;
revoke all on function public.is_chat_creator(uuid) from public;
grant execute on function public.is_chat_member(uuid) to authenticated;
grant execute on function public.is_chat_creator(uuid) to authenticated;

drop policy if exists "Members can view their conversations" on public.chat_conversations;
create policy "Members can view their conversations" on public.chat_conversations
  for select to authenticated using (
    (created_by = auth.uid() or public.is_chat_member(id))
  );

drop policy if exists "Authenticated users can create conversations" on public.chat_conversations;
create policy "Authenticated users can create conversations" on public.chat_conversations
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "Members can update their conversations" on public.chat_conversations;
create policy "Members can update their conversations" on public.chat_conversations
  for update to authenticated using (
    public.is_chat_member(id)
  ) with check (
    public.is_chat_member(id)
  );

drop policy if exists "Users can view their chat memberships" on public.chat_conversation_members;
create policy "Users can view their chat memberships" on public.chat_conversation_members
  for select to authenticated using (
    user_id = auth.uid() or public.is_chat_member(conversation_id)
  );

drop policy if exists "Conversation creators can add members" on public.chat_conversation_members;
create policy "Conversation creators can add members" on public.chat_conversation_members
  for insert to authenticated with check (public.is_chat_creator(conversation_id));

drop policy if exists "Users can update their own read marker" on public.chat_conversation_members;
create policy "Users can update their own read marker" on public.chat_conversation_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Members can read conversation messages" on public.chat_messages;
create policy "Members can read conversation messages" on public.chat_messages
  for select to authenticated using (
    public.is_chat_member(chat_messages.conversation_id)
  );

drop policy if exists "Members can send conversation messages" on public.chat_messages;
create policy "Members can send conversation messages" on public.chat_messages
  for insert to authenticated with check (
    sender_id = auth.uid() and public.is_chat_member(chat_messages.conversation_id)
  );

-- Realtime is used by the client to receive new messages without polling.
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
