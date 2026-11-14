-- ============================================================
-- 0008_push_notifications.sql
-- Web push subscriptions (one row per device) and a helper that
-- returns who should be notified about a message in a thread:
--   * resident writes  -> every admin (coach) device
--   * coach writes     -> that resident's devices
-- Safe to run more than once.
-- ============================================================

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

drop policy if exists "push_own_select" on push_subscriptions;
create policy "push_own_select" on push_subscriptions
  for select to authenticated using (profile_id = auth.uid());

drop policy if exists "push_own_insert" on push_subscriptions;
create policy "push_own_insert" on push_subscriptions
  for insert to authenticated with check (profile_id = auth.uid());

drop policy if exists "push_own_update" on push_subscriptions;
create policy "push_own_update" on push_subscriptions
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "push_own_delete" on push_subscriptions;
create policy "push_own_delete" on push_subscriptions
  for delete to authenticated using (profile_id = auth.uid());

create or replace function push_targets_for_thread(p_resident uuid)
returns table (endpoint text, p256dh text, auth text)
language sql
security definer
set search_path = public
stable
as $$
  select s.endpoint, s.p256dh, s.auth
    from push_subscriptions s
    join profiles p on p.id = s.profile_id
   where (
           -- resident wrote: notify coaches
           auth.uid() = p_resident and p.role = 'admin' and s.profile_id <> auth.uid()
         )
      or (
           -- coach wrote: notify the resident
           is_admin() and auth.uid() <> p_resident and s.profile_id = p_resident
         );
$$;

revoke all on function push_targets_for_thread(uuid) from public;
grant execute on function push_targets_for_thread(uuid) to authenticated;

-- lets the server drop a dead device endpoint it was told about
create or replace function drop_push_endpoint(p_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from push_subscriptions where endpoint = p_endpoint;
$$;

revoke all on function drop_push_endpoint(text) from public;
grant execute on function drop_push_endpoint(text) to authenticated;

-- unread counter for the tab bar badge
create or replace function my_unread_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select case
    when is_admin() then (
      select count(*)::int from coach_messages
       where read_at is null and sender_id = resident_id
    )
    else (
      select count(*)::int from coach_messages
       where resident_id = auth.uid() and read_at is null and sender_id <> auth.uid()
    )
  end;
$$;

revoke all on function my_unread_count() from public;
grant execute on function my_unread_count() to authenticated;
