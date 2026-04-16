-- Transitional RLS policy for custom backend JWT auth (no Supabase Auth session)
-- Use this migration when provider web app authenticates via /auth/* routes.

begin;

-- Keep RLS enabled but allow app traffic from anon/authenticated roles.
-- Existing restrictive auth.uid() policies are dropped in favor of permissive ones.

drop policy if exists "providers_select_own" on public.providers;
drop policy if exists "providers_insert_own" on public.providers;
drop policy if exists "providers_update_own" on public.providers;
drop policy if exists "providers_open_all" on public.providers;

create policy "providers_open_all" on public.providers
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "foods_select_own" on public.foods;
drop policy if exists "foods_write_own" on public.foods;
drop policy if exists "foods_open_all" on public.foods;

create policy "foods_open_all" on public.foods
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "requests_select_own" on public.requests;
drop policy if exists "requests_update_own" on public.requests;
drop policy if exists "requests_open_all" on public.requests;

create policy "requests_open_all" on public.requests
  for all
  to anon, authenticated
  using (true)
  with check (true);

commit;
