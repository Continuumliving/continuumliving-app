-- ============================================================
-- 0005_admin_access.sql
--   * is_admin() helper (SECURITY DEFINER, search_path locked) so
--     admin policies can check the role without recursing into the
--     profiles table's own RLS.
--   * admin SELECT policies on profiles / bookings / event_rsvps
--     so the /admin dashboard can read every resident's data.
--     Non-admins remain restricted to their own rows.
--   * classes.capacity column with a sensible default so the
--     dashboard can show "X / capacity · Y spots left" per class.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- helper -------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to authenticated;

-- profiles -----------------------------------------------------
drop policy if exists "profiles_admin_select" on profiles;
create policy "profiles_admin_select" on profiles
  for select to authenticated
  using (is_admin());

-- bookings -----------------------------------------------------
drop policy if exists "bookings_admin_select" on bookings;
create policy "bookings_admin_select" on bookings
  for select to authenticated
  using (is_admin());

-- event_rsvps --------------------------------------------------
drop policy if exists "event_rsvps_admin_select" on event_rsvps;
create policy "event_rsvps_admin_select" on event_rsvps
  for select to authenticated
  using (is_admin());

-- classes.capacity --------------------------------------------
alter table classes
  add column if not exists capacity integer not null default 20
  check (capacity > 0);
