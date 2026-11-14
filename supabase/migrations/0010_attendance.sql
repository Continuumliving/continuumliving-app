-- ============================================================
-- 0010_attendance.sql
-- The coach marks who actually attended a booked session.
--   attended = true   -> attended
--   attended = false  -> no-show
--   attended = null   -> not marked yet
-- Only admins can set it (residents keep insert/delete on own rows).
-- Safe to run more than once.
-- ============================================================
alter table bookings add column if not exists attended boolean;
alter table bookings add column if not exists attended_at timestamptz;

drop policy if exists "bookings_admin_update" on bookings;
create policy "bookings_admin_update" on bookings
  for update to authenticated
  using (is_admin()) with check (is_admin());
