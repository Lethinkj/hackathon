-- Secure RLS for providers table.
-- Use with custom backend JWT auth where protected table writes go through backend service role.

begin;

alter table if exists public.providers enable row level security;

-- Remove permissive transitional policy if it was applied previously.
drop policy if exists "providers_open_all" on public.providers;

-- Recreate strict per-user policies for Supabase-authenticated contexts.
drop policy if exists "providers_select_own" on public.providers;
create policy "providers_select_own" on public.providers
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "providers_insert_own" on public.providers;
create policy "providers_insert_own" on public.providers
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "providers_update_own" on public.providers;
create policy "providers_update_own" on public.providers
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Ensure one provider profile per app user.
create unique index if not exists idx_providers_user_id_unique
  on public.providers(user_id);

commit;
