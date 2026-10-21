create extension if not exists pgcrypto;

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null check (char_length(title) between 1 and 120),
  prompt text not null check (char_length(prompt) between 1 and 1200),
  identity_mode text not null default 'anonymous' check (identity_mode in ('anonymous','named')),
  results_visibility text not null default 'link' check (results_visibility in ('link')),
  analysis jsonb,
  response_count integer not null default 0,
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  display_name text,
  content text not null check (char_length(content) between 3 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists responses_topic_created_idx on public.responses(topic_id, created_at);
create index if not exists topics_slug_idx on public.topics(slug);

-- All database access is server-side using SUPABASE_SERVICE_ROLE_KEY.
-- Never expose the service role key in browser code. The API routes intentionally
-- mediate reads/writes so the browser does not need direct database permissions.
alter table public.topics enable row level security;
alter table public.responses enable row level security;
-- No anon/authenticated policies are created. Server API uses the service role.
