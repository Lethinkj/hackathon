-- SupplyLink Supabase schema
-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text unique,
  role text check (role in ('provider', 'consumer', 'ngo')),
  lat double precision,
  lng double precision,
  capacity int,
  rating float default 5
);

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
