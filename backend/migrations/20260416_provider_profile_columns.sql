-- Ensure providers table has profile columns expected by provider web app

begin;

alter table if exists public.providers add column if not exists name text;
alter table if exists public.providers add column if not exists type text;

-- Backfill defaults for columns used directly by provider web auth/dashboard.
update public.providers
set
  name = coalesce(name, 'Provider'),
  type = coalesce(type, 'restaurant');

-- Keep defaults for future inserts from compatibility paths.
alter table if exists public.providers alter column name set default 'Provider';
alter table if exists public.providers alter column type set default 'restaurant';

-- Important: do not coerce providers.location here.
-- Some deployments use PostGIS geometry/geography for location,
-- and assigning text values causes geometry parse errors.

commit;
