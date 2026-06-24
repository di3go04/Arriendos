-- Tabla y políticas para los mapas de propiedades de RentNow.
-- Compatible con el esquema existente, donde public.profiles.id refleja auth.users.id.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  description text,
  price numeric,
  monthly_rent numeric,
  type text check (type in ('casa', 'apartamento', 'local', 'oficina', 'terreno')),
  lat double precision,
  lng double precision,
  address text,
  city text,
  status text default 'disponible',
  image_url text,
  image_urls text[] default '{}'::text[],
  created_at timestamptz default now()
);

alter table public.properties
  add column if not exists description text,
  add column if not exists price numeric,
  add column if not exists monthly_rent numeric,
  add column if not exists type text,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists status text default 'disponible',
  add column if not exists image_url text,
  add column if not exists image_urls text[] default '{}'::text[],
  add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_owner_id_profiles_fkey'
  ) then
    alter table public.properties
      add constraint properties_owner_id_profiles_fkey
      foreign key (owner_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_owner_id_auth_users_fkey'
  ) then
    alter table public.properties
      add constraint properties_owner_id_auth_users_fkey
      foreign key (owner_id) references auth.users(id) on delete cascade;
  end if;
end $$;

create index if not exists properties_owner_id_idx on public.properties(owner_id);
create index if not exists properties_location_idx on public.properties(lat, lng);

grant select on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.properties to service_role;

alter table public.properties enable row level security;

drop policy if exists "Permitir lectura de propiedades a autenticados" on public.properties;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'properties'
      and policyname = 'Public can view available properties'
  ) then
    create policy "Public can view available properties"
      on public.properties
      for select
      to anon
      using (status = 'disponible');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'properties'
      and policyname = 'Owners can view their own properties'
  ) then
    create policy "Owners can view their own properties"
      on public.properties
      for select
      to authenticated
      using ((select auth.uid()) = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'properties'
      and policyname = 'Owners can insert their own properties'
  ) then
    create policy "Owners can insert their own properties"
      on public.properties
      for insert
      to authenticated
      with check ((select auth.uid()) = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'properties'
      and policyname = 'Owners can update their own properties'
  ) then
    create policy "Owners can update their own properties"
      on public.properties
      for update
      to authenticated
      using ((select auth.uid()) = owner_id)
      with check ((select auth.uid()) = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'properties'
      and policyname = 'Owners can delete their own properties'
  ) then
    create policy "Owners can delete their own properties"
      on public.properties
      for delete
      to authenticated
      using ((select auth.uid()) = owner_id);
  end if;
end $$;
