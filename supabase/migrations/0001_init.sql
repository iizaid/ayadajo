-- Ayadajo Milestone 2 base platform skeleton.
-- Scope: platform identity profile and plan catalog only.
-- Do not add tenant feature tables or full RLS policies in this migration.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  email citext unique not null,
  full_name text not null,
  phone text,
  is_platform_admin boolean not null default false,
  mfa_enabled boolean not null default false,
  platform_role text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint users_platform_role_check check (
    (is_platform_admin = true and platform_role in ('super_admin', 'support_admin'))
    or
    (is_platform_admin = false and platform_role is null)
  )
);

create index users_auth_user_id_idx on public.users (auth_user_id);
create index users_platform_role_idx on public.users (platform_role) where is_platform_admin = true;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

comment on table public.users is
  'Platform identity profile linked to Supabase Auth. Not a patient table.';
comment on column public.users.auth_user_id is
  'References auth.users.id; credentials live in Supabase Auth.';

alter table public.users enable row level security;

create policy users_select_own_profile
on public.users
for select
to authenticated
using (auth_user_id = auth.uid());

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  price numeric(12, 2) not null default 0,
  interval text not null check (interval in ('month', 'year', 'custom')),
  max_staff int,
  max_messages_month int,
  storage_mb int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plans_is_active_idx on public.plans (is_active);

create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

comment on table public.plans is
  'Platform plan catalog. Seed values are added in a later milestone.';

alter table public.plans enable row level security;

create policy plans_select_active
on public.plans
for select
to authenticated
using (is_active = true);
