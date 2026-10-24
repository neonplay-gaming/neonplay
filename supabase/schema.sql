-- NEONPLAY Private Video Box — initial secure storage schema
-- Run in Supabase SQL Editor. Keep the Storage bucket private.
-- IMPORTANT: this schema alone does not deploy alerts/session enforcement.

create extension if not exists pgcrypto;

create table if not exists public.private_video_metadata (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  object_path text not null unique,
  display_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.private_video_metadata enable row level security;

create policy "Owners can read their video metadata"
on public.private_video_metadata for select
to authenticated
using (auth.uid() = owner_id);

create policy "Owners can insert their video metadata"
on public.private_video_metadata for insert
to authenticated
with check (
  auth.uid() = owner_id
  and split_part(object_path, '/', 1) = auth.uid()::text
);

create policy "Owners can delete their video metadata"
on public.private_video_metadata for delete
to authenticated
using (auth.uid() = owner_id);

-- Audit events are written by a trusted server/Edge Function only.
create table if not exists public.private_access_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in
    ('login','video_upload','video_view','video_delete','session_revoked','suspicious_login','key_rotated')),
  device_label text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

alter table public.private_access_events enable row level security;

create policy "Users can view their own access events"
on public.private_access_events for select
to authenticated
using (auth.uid() = owner_id);

-- Session records are only manageable by trusted backend functions.
create table if not exists public.private_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  session_token_hash text not null unique,
  device_label text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.private_sessions enable row level security;

create policy "Users can view their own sessions"
on public.private_sessions for select
to authenticated
using (auth.uid() = owner_id);

-- No client insert/update/delete policies for audit or session tables by design.
-- Create a PRIVATE Storage bucket named "private-videos" in the Supabase dashboard.
-- Storage object path must begin with auth.uid()::text, e.g. <user-uuid>/<random-file-id>.
-- Never expose service_role keys in browser code or GitHub.
