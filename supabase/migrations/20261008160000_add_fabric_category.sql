alter table public.fabrics
  add column if not exists category text;

update public.fabrics
set category = 'Shirting'
where category is null;

alter table public.fabrics
  alter column category set default 'Shirting';

alter table public.fabrics
  alter column category set not null;

alter table public.fabrics
  drop constraint if exists fabrics_category_check;

alter table public.fabrics
  add constraint fabrics_category_check
  check (category in ('Suiting', 'Shirting'));

create index if not exists idx_fabrics_category on public.fabrics(category);
