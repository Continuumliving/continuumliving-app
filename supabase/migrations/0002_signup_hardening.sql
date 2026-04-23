-- ============================================================
-- 0002_signup_hardening.sql
-- Run AFTER 0001_init.sql in a fresh project, or standalone to
-- patch an existing deploy where signup was failing silently.
-- ============================================================
--
-- Background: the original handle_new_auth_user trigger ran as
-- AFTER INSERT on auth.users. Any exception inside it (missing
-- metadata, enum cast failure, RLS/permission hiccup) rolls back
-- the whole transaction, which means NO auth.users row is ever
-- persisted — Supabase returns a 500 but the Authentication >
-- Users list stays empty. This patch:
--
-- 1. Wraps the profile insert in a BEGIN/EXCEPTION block so a
--    profile failure never aborts the auth user creation.
-- 2. Uses `nullif(…, '')` before casting to the development_id
--    enum, so an empty-string metadata value falls back cleanly.
-- 3. Logs any trigger error as a Postgres NOTICE for debugging.
--
-- Combined with the client-side ensureMyProfile() fallback, a
-- missing profile row self-heals on the user's next app load.
-- ============================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into profiles (id, first_name, last_name, email, development, unit_number)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', ''),
      coalesce(new.email, ''),
      (coalesce(nullif(new.raw_user_meta_data ->> 'development', ''), 'almina'))::development_id,
      coalesce(new.raw_user_meta_data ->> 'unit_number', '')
    )
    on conflict (id) do nothing;
  exception when others then
    -- Never abort the auth user creation. The client-side
    -- ensureMyProfile() will insert the profile on first app load.
    raise notice 'handle_new_auth_user: profile insert failed for %: % (%).',
      new.id, sqlerrm, sqlstate;
  end;
  return new;
end;
$$;

-- Make sure the trigger is still wired up.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
