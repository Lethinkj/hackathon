-- Prediction preorder table for consumer AI suggestions.
-- Apply with the rest of backend migrations.

create extension if not exists "uuid-ossp";

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
