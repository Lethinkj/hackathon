-- Adds phone-based auth support for app users.
-- Run this in Supabase SQL Editor before enabling phone OTP login in the app.

alter table if exists public.users
  add column if not exists phone text;

create unique index if not exists idx_users_phone_unique
  on public.users(phone)
  where phone is not null;
