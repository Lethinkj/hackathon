-- PostGIS nearby matching for static locations (Supabase)
-- Run this migration in Supabase SQL editor.

begin;

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- 1) Providers table (static profile location)
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  business_name text not null,
  provider_type text not null check (provider_type in ('Catering Services', 'Hotel', 'Hostel', 'Canteen', 'Cafe')),
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  location geography(Point, 4326),
  created_at timestamptz not null default now(),
  constraint providers_lat_range check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint providers_lng_range check (longitude is null or (longitude >= -180 and longitude <= 180))
);

-- 2) Consumers table
-- NOTE: this project already has public.consumers in schema.sql for AI. We extend it safely.
alter table public.consumers add column if not exists id uuid;
alter table public.consumers add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.consumers add column if not exists full_name text;
alter table public.consumers add column if not exists address text;
alter table public.consumers add column if not exists latitude numeric(9,6);
alter table public.consumers add column if not exists longitude numeric(9,6);
alter table public.consumers add column if not exists created_at timestamptz not null default now();

-- consumers.location may already exist as text in legacy schema.
-- If so, keep old values in location_legacy and create proper geography location.
do $$
declare
  v_udt_name text;
begin
  select c.udt_name
  into v_udt_name
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'consumers'
    and c.column_name = 'location';

  if v_udt_name is null then
    alter table public.consumers add column location geography(Point, 4326);
  elsif v_udt_name <> 'geography' then
    if not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'consumers'
        and c.column_name = 'location_legacy'
    ) then
      alter table public.consumers rename column location to location_legacy;
    end if;

    alter table public.consumers add column if not exists location geography(Point, 4326);
  end if;
end
$$;

-- Backfill consumers.id from existing consumer_id PK when present.
update public.consumers
set id = consumer_id
where id is null and consumer_id is not null;

-- Fill remaining ids if any row still has null id.
update public.consumers
set id = gen_random_uuid()
where id is null;

-- Keep id unique for app usage even though existing consumer_id is current PK in this repo.
create unique index if not exists idx_consumers_id_unique on public.consumers(id);

-- Range checks on consumers
alter table public.consumers drop constraint if exists consumers_lat_range;
alter table public.consumers drop constraint if exists consumers_lng_range;
alter table public.consumers
  add constraint consumers_lat_range check (latitude is null or (latitude >= -90 and latitude <= 90));
alter table public.consumers
  add constraint consumers_lng_range check (longitude is null or (longitude >= -180 and longitude <= 180));

-- 3) Food events table (catering can use event location different from provider base)
create table if not exists public.food_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  title text not null,
  quantity integer not null check (quantity >= 0),
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  location geography(Point, 4326),
  status text not null default 'active' check (status in ('active', 'inactive', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint food_events_lat_range check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint food_events_lng_range check (longitude is null or (longitude >= -180 and longitude <= 180))
);

-- 4) Trigger functions to auto-build geography Point from latitude/longitude
create or replace function public.set_provider_location()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := st_setsrid(st_makepoint(new.longitude::double precision, new.latitude::double precision), 4326)::geography;
  else
    new.location := null;
  end if;
  return new;
end;
$$;

create or replace function public.set_consumer_location()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := st_setsrid(st_makepoint(new.longitude::double precision, new.latitude::double precision), 4326)::geography;
  else
    new.location := null;
  end if;
  return new;
end;
$$;

create or replace function public.set_food_event_location()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := st_setsrid(st_makepoint(new.longitude::double precision, new.latitude::double precision), 4326)::geography;
  else
    new.location := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_provider_location on public.providers;
create trigger trg_set_provider_location
before insert or update of latitude, longitude
on public.providers
for each row execute function public.set_provider_location();

drop trigger if exists trg_set_consumer_location on public.consumers;
create trigger trg_set_consumer_location
before insert or update of latitude, longitude
on public.consumers
for each row execute function public.set_consumer_location();

drop trigger if exists trg_set_food_event_location on public.food_events;
create trigger trg_set_food_event_location
before insert or update of latitude, longitude
on public.food_events
for each row execute function public.set_food_event_location();

-- Backfill geographies for existing rows.
update public.providers
set location = st_setsrid(st_makepoint(longitude::double precision, latitude::double precision), 4326)::geography
where latitude is not null and longitude is not null and location is null;

update public.consumers
set location = st_setsrid(st_makepoint(longitude::double precision, latitude::double precision), 4326)::geography
where latitude is not null and longitude is not null and location is null;

update public.food_events
set location = st_setsrid(st_makepoint(longitude::double precision, latitude::double precision), 4326)::geography
where latitude is not null and longitude is not null and location is null;

-- 5) Performance indexes (GIST on geography)
create index if not exists idx_providers_location_gist on public.providers using gist(location);
create index if not exists idx_consumers_location_gist on public.consumers using gist(location);
create index if not exists idx_food_events_location_gist on public.food_events using gist(location);
create index if not exists idx_food_events_status_created on public.food_events(status, created_at desc);

-- 6) Nearby provider RPC
create or replace function public.get_nearby_providers(
  consumer_lat numeric,
  consumer_lng numeric,
  radius_km numeric default 30
)
returns table (
  provider_id uuid,
  business_name text,
  provider_type text,
  address text,
  distance_km numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with consumer_point as (
    select st_setsrid(st_makepoint(consumer_lng::double precision, consumer_lat::double precision), 4326)::geography as geo
  )
  select
    p.id as provider_id,
    p.business_name,
    p.provider_type,
    p.address,
    round((st_distance(p.location, cp.geo) / 1000.0)::numeric, 2) as distance_km
  from public.providers p
  cross join consumer_point cp
  where p.location is not null
    and st_dwithin(p.location, cp.geo, greatest(radius_km, 0) * 1000.0)
  order by st_distance(p.location, cp.geo) asc;
$$;

-- 7) Nearby catering/food event RPC
create or replace function public.get_nearby_food_events(
  consumer_lat numeric,
  consumer_lng numeric,
  radius_km numeric default 30
)
returns table (
  event_id uuid,
  provider_id uuid,
  provider_name text,
  title text,
  quantity integer,
  address text,
  distance_km numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with consumer_point as (
    select st_setsrid(st_makepoint(consumer_lng::double precision, consumer_lat::double precision), 4326)::geography as geo
  )
  select
    e.id as event_id,
    e.provider_id,
    p.business_name as provider_name,
    e.title,
    e.quantity,
    e.address,
    round((st_distance(e.location, cp.geo) / 1000.0)::numeric, 2) as distance_km,
    e.created_at
  from public.food_events e
  join public.providers p on p.id = e.provider_id
  cross join consumer_point cp
  where e.location is not null
    and e.status = 'active'
    and (e.expires_at is null or e.expires_at > now())
    and st_dwithin(e.location, cp.geo, greatest(radius_km, 0) * 1000.0)
  order by st_distance(e.location, cp.geo) asc;
$$;

-- 8) RLS
alter table public.providers enable row level security;
alter table public.consumers enable row level security;
alter table public.food_events enable row level security;

-- Providers: owner CRUD
-- drop/recreate keeps migration idempotent across reruns.
drop policy if exists providers_owner_select on public.providers;
create policy providers_owner_select
on public.providers
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists providers_owner_insert on public.providers;
create policy providers_owner_insert
on public.providers
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists providers_owner_update on public.providers;
create policy providers_owner_update
on public.providers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists providers_owner_delete on public.providers;
create policy providers_owner_delete
on public.providers
for delete
to authenticated
using (auth.uid() = user_id);

-- Consumers: owner CRUD
drop policy if exists consumers_owner_select on public.consumers;
create policy consumers_owner_select
on public.consumers
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists consumers_owner_insert on public.consumers;
create policy consumers_owner_insert
on public.consumers
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists consumers_owner_update on public.consumers;
create policy consumers_owner_update
on public.consumers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists consumers_owner_delete on public.consumers;
create policy consumers_owner_delete
on public.consumers
for delete
to authenticated
using (auth.uid() = user_id);

-- Food events: provider-owner CRUD via providers.user_id linkage
drop policy if exists food_events_owner_select on public.food_events;
create policy food_events_owner_select
on public.food_events
for select
to authenticated
using (
  exists (
    select 1
    from public.providers p
    where p.id = food_events.provider_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists food_events_owner_insert on public.food_events;
create policy food_events_owner_insert
on public.food_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.providers p
    where p.id = food_events.provider_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists food_events_owner_update on public.food_events;
create policy food_events_owner_update
on public.food_events
for update
to authenticated
using (
  exists (
    select 1
    from public.providers p
    where p.id = food_events.provider_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.providers p
    where p.id = food_events.provider_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists food_events_owner_delete on public.food_events;
create policy food_events_owner_delete
on public.food_events
for delete
to authenticated
using (
  exists (
    select 1
    from public.providers p
    where p.id = food_events.provider_id
      and p.user_id = auth.uid()
  )
);

-- Public can call nearby RPCs.
revoke all on function public.get_nearby_providers(numeric, numeric, numeric) from public;
revoke all on function public.get_nearby_food_events(numeric, numeric, numeric) from public;
grant execute on function public.get_nearby_providers(numeric, numeric, numeric) to anon, authenticated;
grant execute on function public.get_nearby_food_events(numeric, numeric, numeric) to anon, authenticated;

-- 9) Sample data (Chennai coordinates)
insert into public.providers (id, user_id, business_name, provider_type, address, latitude, longitude)
values
  ('11111111-1111-1111-1111-111111111111', null, 'Anna Caterers', 'Catering Services', 'Kodambakkam, Chennai', 13.052500, 80.225600),
  ('22222222-2222-2222-2222-222222222222', null, 'T Nagar Grand Hotel', 'Hotel', 'T Nagar, Chennai', 13.041800, 80.233700),
  ('33333333-3333-3333-3333-333333333333', null, 'Tambaram Student Hostel', 'Hostel', 'Tambaram, Chennai', 12.924900, 80.100000),
  ('44444444-4444-4444-4444-444444444444', null, 'Velachery Tech Canteen', 'Canteen', 'Velachery, Chennai', 12.981500, 80.218000),
  ('55555555-5555-5555-5555-555555555555', null, 'Ennore Bay Cafe', 'Cafe', 'Ennore, Chennai', 13.214300, 80.320300)
on conflict (id) do update set
  business_name = excluded.business_name,
  provider_type = excluded.provider_type,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into public.consumers (id, consumer_name, user_id, full_name, address, latitude, longitude)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Priya Raman', null, 'Priya Raman', 'T Nagar, Chennai', 13.041800, 80.233700),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Arun Kumar', null, 'Arun Kumar', 'Tambaram, Chennai', 12.924900, 80.100000)
on conflict (id) do update set
  consumer_name = excluded.consumer_name,
  full_name = excluded.full_name,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into public.food_events (id, provider_id, title, quantity, address, latitude, longitude, status, expires_at)
values
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Wedding Lunch Surplus', 120, 'Adyar, Chennai', 13.001200, 80.256500, 'active', now() + interval '8 hours'),
  ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Corporate Dinner Trays', 85, 'Guindy, Chennai', 13.010400, 80.220600, 'active', now() + interval '5 hours'),
  ('e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Community Function Food', 60, 'Tambaram, Chennai', 12.924900, 80.100000, 'active', now() + interval '10 hours')
on conflict (id) do update set
  provider_id = excluded.provider_id,
  title = excluded.title,
  quantity = excluded.quantity,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  status = excluded.status,
  expires_at = excluded.expires_at;

commit;

-- 10) SQL test cases (run manually in Supabase SQL editor)
-- Test 1: T Nagar consumer, providers within 30km.
-- select * from public.get_nearby_providers(13.041800, 80.233700, 30);

-- Test 2: Tambaram consumer should bias toward south-Chennai providers.
-- select * from public.get_nearby_providers(12.924900, 80.100000, 30);

-- Test 3: Verify nearest-first ordering.
-- select * from public.get_nearby_providers(13.041800, 80.233700, 30);

-- Test 4: Provider outside 30km excluded (Ennore expected to drop for Tambaram at 30km).
-- select * from public.get_nearby_providers(12.924900, 80.100000, 30);

-- Test 5: Nearby catering events are returned separately.
-- select * from public.get_nearby_food_events(13.041800, 80.233700, 30);
