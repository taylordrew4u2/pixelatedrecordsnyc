-- Run only in a dedicated, owner-approved Supabase project.
-- This migration creates private application tables and a private image bucket.
-- It does not grant browser/anonymous access to drafts, sessions, or media.

begin;

create table if not exists public.pixelated_content (
  id text primary key check (id = 'main'),
  revision bigint not null check (revision >= 0),
  document jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.pixelated_sessions (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  password_version text not null
);
create index if not exists pixelated_sessions_expiry on public.pixelated_sessions (expires_at);
create table if not exists public.pixelated_login_attempts (
  key text primary key,
  attempts integer not null default 0,
  reset_at timestamptz not null
);
create index if not exists pixelated_attempts_expiry on public.pixelated_login_attempts (reset_at);

alter table public.pixelated_content enable row level security;
alter table public.pixelated_sessions enable row level security;
alter table public.pixelated_login_attempts enable row level security;
revoke all on table public.pixelated_content, public.pixelated_sessions, public.pixelated_login_attempts from public, anon, authenticated;
grant select, insert, update, delete on table public.pixelated_content, public.pixelated_sessions, public.pixelated_login_attempts to service_role;

create or replace function public.pixelated_commit_content(
  p_expected_revision bigint,
  p_document jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  if p_expected_revision is null or p_expected_revision < 0 or
    (p_document->>'schemaVersion')::integer is distinct from 1 or
    (p_document->>'revision')::bigint is distinct from p_expected_revision + 1 or
    jsonb_typeof(p_document->'draft') is distinct from 'object' or
    jsonb_typeof(p_document->'published') is distinct from 'object' or
    pg_column_size(p_document) > 8000000 then
    raise sqlstate 'PT400' using message = 'Invalid content document';
  end if;

  if p_expected_revision = 0 then
    insert into public.pixelated_content (id, revision, document)
      values ('main', 1, p_document)
      on conflict (id) do nothing;
    get diagnostics changed = row_count;
    if changed = 1 then return p_document; end if;
  end if;

  update public.pixelated_content
    set revision = p_expected_revision + 1, document = p_document, updated_at = now()
    where id = 'main' and revision = p_expected_revision;
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise sqlstate 'PT409' using message = 'Revision conflict';
  end if;
  return p_document;
end;
$$;

create or replace function public.pixelated_take_login_attempt(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_attempt public.pixelated_login_attempts%rowtype;
begin
  if p_key is null or p_key !~ '^[A-Za-z0-9-]{1,128}$' or p_limit is null or p_limit not between 1 and 1000 or p_window_seconds is null or p_window_seconds not between 60 and 3600 then
    raise sqlstate 'PT400' using message = 'Invalid attempt parameters';
  end if;
  delete from public.pixelated_login_attempts where reset_at <= now();
  delete from public.pixelated_sessions where expires_at <= now();
  insert into public.pixelated_login_attempts as existing (key, attempts, reset_at)
    values (p_key, 1, now() + make_interval(secs => p_window_seconds))
    on conflict (key) do update
    set attempts = case when existing.reset_at <= now() then 1 else existing.attempts + 1 end,
        reset_at = case when existing.reset_at <= now() then now() + make_interval(secs => p_window_seconds) else existing.reset_at end
    returning * into current_attempt;
  return jsonb_build_object(
    'allowed', current_attempt.attempts <= p_limit,
    'retryAfter', greatest(1, ceil(extract(epoch from (current_attempt.reset_at - now())))::integer)
  );
end;
$$;

revoke all on function public.pixelated_commit_content(bigint, jsonb) from public, anon, authenticated;
revoke all on function public.pixelated_take_login_attempt(text, integer, integer) from public, anon, authenticated;
grant execute on function public.pixelated_commit_content(bigint, jsonb) to service_role;
grant execute on function public.pixelated_take_login_attempt(text, integer, integer) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('pixelated-private', 'pixelated-private', false, 4500000, array['image/webp'])
  on conflict (id) do nothing;
-- A bucket with this name must remain private. Do not add public object policies.
-- The application proxies authorized media via /api/media/{id}.

commit;
