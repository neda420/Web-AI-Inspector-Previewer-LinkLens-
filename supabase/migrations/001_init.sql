-- users come from supabase auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.urls (
  id uuid primary key default gen_random_uuid(),
  normalized_url text not null unique,
  submitted_by uuid references auth.users(id),
  title text,
  description text,
  favicon_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  url_id uuid not null references public.urls(id) on delete cascade,
  model text not null,
  summary text not null,
  safety_flags jsonb not null default '{}'::jsonb,
  confidence numeric(3, 2) check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (url_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  url_id uuid not null references public.urls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (url_id, user_id)
);

create or replace view public.url_scores as
select
  u.id as url_id,
  coalesce(avg(r.rating), 0)::numeric(3, 2) as avg_rating,
  count(r.id) as rating_count,
  coalesce((
    0.7 * avg(r.rating) +
    0.3 * (
      case
        when (a.safety_flags ->> 'risk') = 'high' then 1
        when (a.safety_flags ->> 'risk') = 'medium' then 2.5
        else 5
      end
    )
  ), 0)::numeric(3, 2) as trust_score
from public.urls u
left join public.reviews r on r.url_id = u.id
left join public.ai_summaries a on a.url_id = u.id
group by u.id, a.safety_flags;
