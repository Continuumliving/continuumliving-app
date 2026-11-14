-- ============================================================
-- 0009_health_brief.sql
-- Personal Health Brief, written by the coach.
--   * health_profiles : one row per resident (consent, goal, intake,
--                       next review)
--   * health_metrics  : measurements over time (resting HR, HRV, ...)
--   * weekly_briefs   : the coach's weekly note + next week's focus
-- Health data is special-category data (GDPR art. 9): the coach can
-- only record metrics after the resident has given explicit consent
-- in the app, and the resident can withdraw it (which deletes them).
-- Residents read only their own data; admins (coach) read/write all.
-- Safe to run more than once.
-- ============================================================

create table if not exists health_profiles (
  resident_id     uuid primary key references profiles(id) on delete cascade,
  consent_at      timestamptz,
  goal            text check (char_length(goal) <= 300),
  intake_date     date,
  next_review     date,
  coach_notes     text check (char_length(coach_notes) <= 4000),
  updated_at      timestamptz not null default now()
);

create table if not exists health_metrics (
  id           uuid primary key default gen_random_uuid(),
  resident_id  uuid not null references profiles(id) on delete cascade,
  kind         text not null check (kind in ('resting_hr','hrv','weight','body_fat','vo2max','sleep','grip','blood_pressure_sys','blood_pressure_dia','waist')),
  value        numeric not null check (value > 0 and value < 1000),
  measured_on  date not null default current_date,
  note         text check (char_length(note) <= 300),
  created_at   timestamptz not null default now()
);
create index if not exists health_metrics_resident_idx on health_metrics (resident_id, kind, measured_on);

create table if not exists weekly_briefs (
  id           uuid primary key default gen_random_uuid(),
  resident_id  uuid not null references profiles(id) on delete cascade,
  week_start   date not null,
  note         text not null default '' check (char_length(note) <= 4000),
  focus        text not null default '' check (char_length(focus) <= 1000),
  published    boolean not null default false,
  published_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (resident_id, week_start)
);

alter table health_profiles enable row level security;
alter table health_metrics  enable row level security;
alter table weekly_briefs   enable row level security;

-- health_profiles: only the coach reads the table directly (it holds
-- private coach notes); residents use my_health_profile() below
drop policy if exists "hp_select" on health_profiles;
create policy "hp_select" on health_profiles for select to authenticated
  using (is_admin());
drop policy if exists "hp_admin_write" on health_profiles;
create policy "hp_admin_write" on health_profiles for all to authenticated
  using (is_admin()) with check (is_admin());

-- metrics: only with consent
drop policy if exists "hm_select" on health_metrics;
create policy "hm_select" on health_metrics for select to authenticated
  using (resident_id = auth.uid() or is_admin());
drop policy if exists "hm_admin_insert" on health_metrics;
create policy "hm_admin_insert" on health_metrics for insert to authenticated
  with check (
    is_admin()
    and exists (select 1 from health_profiles h where h.resident_id = health_metrics.resident_id and h.consent_at is not null)
  );
drop policy if exists "hm_admin_delete" on health_metrics;
create policy "hm_admin_delete" on health_metrics for delete to authenticated
  using (is_admin());

-- briefs: residents see only published ones
drop policy if exists "wb_select" on weekly_briefs;
create policy "wb_select" on weekly_briefs for select to authenticated
  using ((resident_id = auth.uid() and published) or is_admin());
drop policy if exists "wb_admin_write" on weekly_briefs;
create policy "wb_admin_write" on weekly_briefs for all to authenticated
  using (is_admin()) with check (is_admin());

-- consent (resident acts on own row only) -----------------------
create or replace function give_health_consent()
returns void language sql security definer set search_path = public as $$
  insert into health_profiles (resident_id, consent_at)
  values (auth.uid(), now())
  on conflict (resident_id) do update set consent_at = coalesce(health_profiles.consent_at, now()), updated_at = now();
$$;
revoke all on function give_health_consent() from public;
grant execute on function give_health_consent() to authenticated;

create or replace function withdraw_health_consent()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from health_metrics where resident_id = auth.uid();
  update health_profiles set consent_at = null, updated_at = now() where resident_id = auth.uid();
end;
$$;
revoke all on function withdraw_health_consent() from public;
grant execute on function withdraw_health_consent() to authenticated;

-- residents read their own profile without the coach's private notes
drop view if exists my_health_profile;
create or replace function my_health_profile()
returns table (consent_at timestamptz, goal text, intake_date date, next_review date)
language sql security definer set search_path = public stable as $$
  select consent_at, goal, intake_date, next_review
    from health_profiles where resident_id = auth.uid();
$$;
revoke all on function my_health_profile() from public;
grant execute on function my_health_profile() to authenticated;
