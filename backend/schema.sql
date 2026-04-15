-- SupplyLink Supabase schema
-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text unique,
  phone text unique,
  password text not null,
  role text check (role in ('provider', 'consumer', 'ngo')),
  lat double precision,
  lng double precision,
  capacity int,
  rating float default 5,
  created_at timestamp default now()
);

-- For existing projects migrated from Supabase Auth-only flow.
alter table if exists users add column if not exists password text;
alter table if exists users add column if not exists phone text;
alter table if exists users add column if not exists created_at timestamp default now();
create unique index if not exists idx_users_phone_unique on users(phone) where phone is not null;

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
