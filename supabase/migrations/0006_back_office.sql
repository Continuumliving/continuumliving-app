-- ============================================================
-- 0006_back_office.sql
-- Permissions for the /admin back office. Until now admins could
-- READ everyone's data (0005) but only write classes and events.
-- This adds the write side:
--   * admins can edit any resident profile, including role and
--     development (the immutability trigger now lets admins through)
--   * admins can book a resident into a class and cancel any booking
--   * admins can add a resident to an event and remove any RSVP
--   * admins can read and tidy session history
-- Residents' own permissions are unchanged.
-- Depends on is_admin() from 0005. Idempotent: safe to re-run.
-- ============================================================

-- profiles -----------------------------------------------------
drop policy if exists "profiles_admin_update" on profiles;
create policy "profiles_admin_update" on profiles
  for update to authenticated
  using (is_admin())
  with check (is_admin());

-- Residents still cannot change their own role or development;
-- admins can change both for anyone.
create or replace function enforce_profiles_immutable()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed by the resident';
  end if;
  if new.development is distinct from old.development then
    raise exception 'development cannot be changed';
  end if;
  return new;
end;
$$;

-- Never leave the house without an admin: block demoting the last one.
create or replace function protect_last_admin()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin
  if old.role = 'admin' and new.role is distinct from 'admin' then
    if (select count(*) from profiles where role = 'admin' and id <> old.id) = 0 then
      raise exception 'at least one admin must remain';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_last_admin on profiles;
create trigger profiles_protect_last_admin
  before update on profiles
  for each row execute function protect_last_admin();

-- bookings -----------------------------------------------------
drop policy if exists "bookings_admin_insert" on bookings;
create policy "bookings_admin_insert" on bookings
  for insert to authenticated
  with check (is_admin());

drop policy if exists "bookings_admin_delete" on bookings;
create policy "bookings_admin_delete" on bookings
  for delete to authenticated
  using (is_admin());

-- event_rsvps --------------------------------------------------
drop policy if exists "event_rsvps_admin_insert" on event_rsvps;
create policy "event_rsvps_admin_insert" on event_rsvps
  for insert to authenticated
  with check (is_admin());

drop policy if exists "event_rsvps_admin_delete" on event_rsvps;
create policy "event_rsvps_admin_delete" on event_rsvps
  for delete to authenticated
  using (is_admin());

-- session_history ----------------------------------------------
drop policy if exists "session_history_admin_select" on session_history;
create policy "session_history_admin_select" on session_history
  for select to authenticated
  using (is_admin());

drop policy if exists "session_history_admin_delete" on session_history;
create policy "session_history_admin_delete" on session_history
  for delete to authenticated
  using (is_admin());
