-- SupplyLink Supabase schema
-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text unique,
  username text unique,
  phone text unique,
  password text not null,
  role text check (role in ('provider', 'consumer', 'ngo')),
  source_of_food_provider text,
  lat double precision,
  lng double precision,
  capacity int,
  rating float default 5,
  created_at timestamp default now()
);

-- For existing projects migrated from Supabase Auth-only flow.
alter table if exists users add column if not exists password text;
alter table if exists users add column if not exists phone text;
alter table if exists users add column if not exists username text;
alter table if exists users add column if not exists source_of_food_provider text;
alter table if exists users add column if not exists created_at timestamp default now();
create unique index if not exists idx_users_phone_unique on users(phone) where phone is not null;
create unique index if not exists idx_users_username_unique on users(username) where username is not null;

create table if not exists food (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid references users(id),
  food_name text,
  quantity int,
  type text,
  price float,
  original_price float,
  expiry_time timestamp,
  status text default 'available',
  created_at timestamp default now()
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  food_id uuid references food(id),
  user_id uuid references users(id),
  status text,
  pickup_time timestamp
);

create table if not exists donations (
  id uuid primary key default uuid_generate_v4(),
  food_id uuid references food(id),
  ngo_id uuid references users(id),
  volunteer_assigned boolean default false
);

-- AI-powered surplus prediction schema
create table if not exists suppliers (
  supplier_id uuid primary key default uuid_generate_v4(),
  supplier_name text not null,
  location text,
  category text,
  created_at timestamp with time zone default now()
);

create table if not exists consumers (
  consumer_id uuid primary key default uuid_generate_v4(),
  consumer_name text not null,
  location text,
  type text check (type in ('NGO', 'buyer', 'hostel', 'user')),
  created_at timestamp with time zone default now()
);

create table if not exists food_logs (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid references suppliers(supplier_id) on delete cascade,
  food_name text not null,
  food_category text,
  prepared_qty int not null default 0,
  sold_qty int not null default 0,
  surplus_qty int not null default 0,
  price numeric(12,2) not null default 0,
  waste_qty int not null default 0,
  created_date date not null,
  weekday_name text,
  is_weekend boolean default false,
  festival_name text,
  is_festival boolean default false,
  weather text,
  temperature numeric(5,2),
  demand_score numeric(5,2) default 0,
  created_at timestamp with time zone default now()
);

create table if not exists predictions (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid references suppliers(supplier_id) on delete cascade,
  prediction_date date not null,
  predicted_surplus numeric(12,2) not null default 0,
  confidence_score numeric(5,2) not null default 0,
  suggested_action text not null,
  created_at timestamp with time zone default now(),
  unique (supplier_id, prediction_date)
);

create index if not exists idx_food_logs_supplier_date on food_logs (supplier_id, created_date desc);
create index if not exists idx_food_logs_weekday on food_logs (weekday_name);
create index if not exists idx_food_logs_festival on food_logs (festival_name, is_festival);
create index if not exists idx_food_logs_created_date on food_logs (created_date desc);
create index if not exists idx_predictions_supplier_date on predictions (supplier_id, prediction_date desc);
create index if not exists idx_predictions_created_at on predictions (created_at desc);

create table if not exists prediction_preorders (
  id uuid primary key default uuid_generate_v4(),
  prediction_id uuid not null references predictions(id) on delete cascade,
  supplier_id uuid references suppliers(supplier_id) on delete set null,
  listing_id uuid references foods(id) on delete set null,
  user_id uuid not null references users(id) on delete cascade,
  pickup_time timestamp with time zone,
  status text not null default 'pending',
  created_at timestamp with time zone default now()
);

create index if not exists idx_prediction_preorders_prediction_id on prediction_preorders (prediction_id);
create index if not exists idx_prediction_preorders_user_id on prediction_preorders (user_id);
create index if not exists idx_prediction_preorders_status on prediction_preorders (status);
create index if not exists idx_prediction_preorders_created_at on prediction_preorders (created_at desc);

-- Provider dashboard tables for Supabase-authenticated web app.
create table if not exists providers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references users(id) on delete cascade,
  name text not null,
  location text not null,
  type text not null check (type in ('restaurant', 'hotel', 'catering')),
  created_at timestamp with time zone default now()
);

create table if not exists foods (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid not null references providers(id) on delete cascade,
  name text not null,
  food_type text default 'Veg',
  quantity int not null default 0,
  base_price numeric(12,2) not null default 0,
  current_price numeric(12,2) not null default 0,
  created_at timestamp with time zone default now(),
  expiry_time timestamp with time zone not null,
  discount_time int not null default 60,
  ngo_time int not null default 30,
  status text not null default 'SELL' check (status in ('SELL', 'DISCOUNT', 'DONATE', 'EXPIRED')),
  listing_mode text default 'discount'
);

create table if not exists requests (
  id uuid primary key default uuid_generate_v4(),
  food_id uuid not null references foods(id) on delete cascade,
  requester_type text not null check (requester_type in ('consumer', 'ngo')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  pickup_type text not null default 'self',
  created_at timestamp with time zone default now()
);

create index if not exists idx_providers_user_id on providers (user_id);
create index if not exists idx_foods_provider_created on foods (provider_id, created_at desc);
create index if not exists idx_foods_status on foods (status);
create index if not exists idx_requests_food_id on requests (food_id);
create index if not exists idx_requests_status on requests (status);

alter table providers enable row level security;
alter table foods enable row level security;
alter table requests enable row level security;

drop policy if exists "providers_select_own" on providers;
create policy "providers_select_own" on providers
  for select using (auth.uid() = user_id);

drop policy if exists "providers_insert_own" on providers;
create policy "providers_insert_own" on providers
  for insert with check (auth.uid() = user_id);

drop policy if exists "providers_update_own" on providers;
create policy "providers_update_own" on providers
  for update using (auth.uid() = user_id);

drop policy if exists "foods_select_own" on foods;
create policy "foods_select_own" on foods
  for select using (
    exists (
      select 1 from providers p
      where p.id = foods.provider_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "foods_write_own" on foods;
create policy "foods_write_own" on foods
  for all using (
    exists (
      select 1 from providers p
      where p.id = foods.provider_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from providers p
      where p.id = foods.provider_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "requests_select_own" on requests;
create policy "requests_select_own" on requests
  for select using (
    exists (
      select 1 from foods f
      join providers p on p.id = f.provider_id
      where f.id = requests.food_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "requests_update_own" on requests;
create policy "requests_update_own" on requests
  for update using (
    exists (
      select 1 from foods f
      join providers p on p.id = f.provider_id
      where f.id = requests.food_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from foods f
      join providers p on p.id = f.provider_id
      where f.id = requests.food_id and p.user_id = auth.uid()
    )
  );
