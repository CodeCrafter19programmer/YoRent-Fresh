-- YoRent Supabase schema
-- Run this in the Supabase SQL editor or via `supabase db push`.

set check_function_bodies = off;

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

set search_path = public;

-- -----------------------------------------------------------------------------
--  Profiles (wrapper around auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'tenant' check (role in ('admin', 'tenant')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_profile()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger update_profile_timestamp
  before update on public.profiles
  for each row execute procedure public.touch_profile();

-- -----------------------------------------------------------------------------
--  Domain tables
-- -----------------------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  type text not null,
  monthly_rent numeric(12,2) not null,
  status text not null default 'vacant' check (status in ('vacant', 'occupied')),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_properties_timestamp
  before update on public.properties
  for each row execute procedure public.touch_profile();

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  property_id uuid references public.properties(id) on delete set null,
  lease_start date,
  lease_end date,
  status text not null default 'active',
  deposit numeric(12,2),
  monthly_rent numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_tenants_timestamp
  before update on public.tenants
  for each row execute procedure public.touch_profile();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  amount numeric(12,2) not null,
  month text not null,
  due_date date not null,
  paid_date date,
  status text not null default 'unpaid' check (status in ('unpaid', 'pending', 'paid', 'overdue')),
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_payments_timestamp
  before update on public.payments
  for each row execute procedure public.touch_profile();

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  category text not null,
  description text,
  amount numeric(12,2) not null,
  expense_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_expenses_timestamp
  before update on public.expenses
  for each row execute procedure public.touch_profile();

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_policies_timestamp
  before update on public.policies
  for each row execute procedure public.touch_profile();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tax_records (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  year integer not null,
  total_revenue numeric(14,2) not null,
  total_utilities numeric(14,2) not null,
  electricity numeric(14,2) not null default 0,
  water numeric(14,2) not null default 0,
  gas numeric(14,2) not null default 0,
  maintenance numeric(14,2) not null default 0,
  other_expenses numeric(14,2) not null default 0,
  net_income numeric(14,2) not null,
  tax_rate numeric(5,2) not null,
  tax_amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_tax_records_timestamp
  before update on public.tax_records
  for each row execute procedure public.touch_profile();

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_tenant()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'tenant'
  );
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security Policies
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.tenants enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.policies enable row level security;
alter table public.notifications enable row level security;
alter table public.tax_records enable row level security;

-- Profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Properties
drop policy if exists "Admins manage properties" on public.properties;
create policy "Admins manage properties" on public.properties
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Tenants read properties" on public.properties;
create policy "Tenants read properties" on public.properties
  for select using (public.is_tenant());

-- Tenants
drop policy if exists "Admins manage tenants" on public.tenants;
create policy "Admins manage tenants" on public.tenants
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Tenant can view self" on public.tenants;
create policy "Tenant can view self" on public.tenants
  for select using (auth.uid() = user_id);

-- Payments
drop policy if exists "Admins manage payments" on public.payments;
create policy "Admins manage payments" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Tenant can view their payments" on public.payments;
create policy "Tenant can view their payments" on public.payments
  for select using (
    exists (
      select 1
      from public.tenants t
      where t.id = payments.tenant_id
        and t.user_id = auth.uid()
    )
  );

-- Expenses
drop policy if exists "Admins manage expenses" on public.expenses;
create policy "Admins manage expenses" on public.expenses
  for all using (public.is_admin()) with check (public.is_admin());

-- Policies
drop policy if exists "Policies readable" on public.policies;
create policy "Policies readable" on public.policies
  for select using (true);

drop policy if exists "Admins manage policies" on public.policies;
create policy "Admins manage policies" on public.policies
  for all using (public.is_admin()) with check (public.is_admin());

-- Notifications
drop policy if exists "Admins manage notifications" on public.notifications;
create policy "Admins manage notifications" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select using (notifications.user_id = auth.uid());

-- Tax Records
drop policy if exists "Admins manage taxes" on public.tax_records;
create policy "Admins manage taxes" on public.tax_records
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Tenants view summaries" on public.tax_records;
create policy "Tenants view summaries" on public.tax_records
  for select using (public.is_tenant());

-- -----------------------------------------------------------------------------
-- Seed admin helper (run once with service role)
-- -----------------------------------------------------------------------------
-- Example: elevate a specific user to admin. Replace the UUID with the auth user id.
-- update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000000';

