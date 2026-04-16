-- Provider credentials + source fields for normal table-based auth

begin;

alter table if exists public.users add column if not exists username text;
alter table if exists public.users add column if not exists phone text;
alter table if exists public.users add column if not exists password text;
alter table if exists public.users add column if not exists role text;
alter table if exists public.users add column if not exists source_of_food_provider text;
alter table if exists public.users add column if not exists lat double precision;
alter table if exists public.users add column if not exists lng double precision;
alter table if exists public.users add column if not exists capacity int;
alter table if exists public.users add column if not exists rating float;
alter table if exists public.users add column if not exists created_at timestamp default now();

-- Keep role values compatible with backend auth.
do $$
begin
  begin
    alter table public.users
      add constraint users_role_check
      check (role in ('provider', 'consumer', 'ngo'));
  exception
    when duplicate_object then
      null;
  end;
end $$;

create unique index if not exists idx_users_username_unique
  on public.users(username)
  where username is not null;

create unique index if not exists idx_users_phone_unique
  on public.users(phone)
  where phone is not null;

-- providers.user_id should map to public.users(id), not auth.users(id).
do $$
declare
  fk_name text;
begin
  select tc.constraint_name
    into fk_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_name = tc.constraint_name
   and ccu.table_schema = tc.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'providers'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'user_id'
  limit 1;

  if fk_name is not null then
    execute format('alter table public.providers drop constraint %I', fk_name);
  end if;

  begin
    alter table public.providers
      add constraint providers_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  exception
    when duplicate_object then
      null;
  end;
end $$;

commit;
