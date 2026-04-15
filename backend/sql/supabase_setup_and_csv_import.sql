-- SupplyLink: Supabase setup + CSV import bridge
--
-- Why this file:
-- The CSV has supplier_id values like "sup-001" (text), while food_logs.supplier_id is UUID.
-- So import CSV into staging first, then transform into real tables.

-- 1) Make sure base schema and AI migration were already executed:
--    - backend/schema.sql
--    - backend/migrations/20260415_ai_surplus_prediction.sql

-- 2) Create staging table for CSV import (matches CSV structure, text supplier_id).
create table if not exists public.food_logs_import_staging (
  supplier_id text,
  food_name text,
  food_category text,
  prepared_qty int,
  sold_qty int,
  surplus_qty int,
  price numeric(12,2),
  waste_qty int,
  created_date date,
  weekday_name text,
  is_weekend boolean,
  festival_name text,
  is_festival boolean,
  weather text,
  temperature numeric(5,2),
  demand_score numeric(5,2)
);

-- Optional: clear staging if re-importing the same CSV.
-- truncate table public.food_logs_import_staging;

-- 3) Import CSV file into public.food_logs_import_staging using Supabase Table Editor:
--    Table Editor -> food_logs_import_staging -> Import data from CSV
--    File: backend/data/food_logs_sample_365.csv
--
-- IMPORTANT:
-- Supabase SQL Editor cannot read local workspace paths directly.
-- You must upload the CSV in Table Editor for food_logs_import_staging.

-- 3.1) Quick check before transform.
-- select count(*) as staging_rows from public.food_logs_import_staging;

-- 3.2) Fail fast if CSV was not uploaded.
do $$
begin
  if (select count(*) from public.food_logs_import_staging) = 0 then
    raise exception 'food_logs_import_staging is empty. Upload backend/data/food_logs_sample_365.csv in Supabase Table Editor first.';
  end if;
end
$$;

-- 4) Upsert suppliers from CSV supplier codes.
-- We generate deterministic UUIDs from text code (sup-001, sup-002...) so mapping is stable.
insert into public.suppliers (supplier_id, supplier_name, location, category)
select
  uuid_generate_v5(uuid_ns_url(), s.supplier_id) as supplier_id,
  initcap(replace(s.supplier_id, '-', ' ')) as supplier_name,
  'Unknown' as location,
  'General' as category
from (
  select distinct supplier_id
  from public.food_logs_import_staging
  where supplier_id is not null and supplier_id <> ''
) s
on conflict (supplier_id) do nothing;

-- 5) Insert normalized rows into food_logs.
insert into public.food_logs (
  supplier_id,
  food_name,
  food_category,
  prepared_qty,
  sold_qty,
  surplus_qty,
  price,
  waste_qty,
  created_date,
  weekday_name,
  is_weekend,
  festival_name,
  is_festival,
  weather,
  temperature,
  demand_score
)
select
  uuid_generate_v5(uuid_ns_url(), s.supplier_id) as supplier_id,
  s.food_name,
  s.food_category,
  coalesce(s.prepared_qty, 0),
  coalesce(s.sold_qty, 0),
  coalesce(s.surplus_qty, 0),
  coalesce(s.price, 0),
  coalesce(s.waste_qty, 0),
  s.created_date,
  s.weekday_name,
  coalesce(s.is_weekend, false),
  nullif(s.festival_name, ''),
  coalesce(s.is_festival, false),
  s.weather,
  s.temperature,
  coalesce(s.demand_score, 0)
from public.food_logs_import_staging s
where s.created_date is not null
  and s.food_name is not null;

-- 6) Verification queries.
select count(*) as imported_rows from public.food_logs;
select count(*) as supplier_count from public.suppliers;
select min(created_date) as min_date, max(created_date) as max_date from public.food_logs;

-- 7) Optional cleanup after successful import.
-- drop table public.food_logs_import_staging;
