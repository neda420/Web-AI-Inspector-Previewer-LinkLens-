-- Standalone tables that match the application's TypeScript types.
-- No Supabase auth dependency — reviews are identified by user_name (text).

create table if not exists public.url_records (
  id uuid primary key default gen_random_uuid(),
  normalized_url text not null unique,
  title text not null default '',
  description text not null default '',
  summary text not null default '',
  safety_flags jsonb not null default '{"risk":"safe","reasons":[]}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.url_reviews (
  id uuid primary key default gen_random_uuid(),
  url_id uuid not null references public.url_records(id) on delete cascade,
  user_name text not null,
  rating int not null check (rating between 1 and 5),
  review_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (url_id, user_name)
);

-- Automatically refresh updated_at on every update to url_reviews.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger url_reviews_set_updated_at
  before update on public.url_reviews
  for each row execute function public.set_updated_at();
