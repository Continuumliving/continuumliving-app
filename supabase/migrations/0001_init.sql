-- ============================================================
-- Continuum Living — initial schema
-- Run this in the Supabase SQL editor of a fresh project.
-- ============================================================

-- ENUMS ------------------------------------------------------
create type development_id as enum ('almina', 'alcantara');
create type intensity as enum ('high', 'low');
create type event_kind as enum ('dining', 'social', 'workshop', 'excursion', 'signature');
create type app_role as enum ('user', 'admin');

-- DEVELOPMENTS -----------------------------------------------
create table developments (
  id development_id primary key,
  name text not null,
  location text not null,
  series text not null default 'Series One',
  accent text not null default 'terracotta'
);

insert into developments (id, name, location, accent) values
  ('almina', 'Almina Residences', 'Estepona', 'terracotta'),
  ('alcantara', 'Alcántara del Mar', 'San Pedro de Alcántara', 'olive');

alter table developments enable row level security;
create policy "developments_read" on developments for select to authenticated using (true);

-- PROFILES ---------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  email text not null,
  development development_id not null,
  unit_number text not null,
  joined_at timestamptz not null default now(),
  role app_role not null default 'user'
);

create index profiles_development_idx on profiles (development);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_update_own" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'user');

create policy "profiles_insert_own" on profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'user');

-- Prevent self-elevation and residence change
create or replace function enforce_profiles_immutable()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed by the resident';
  end if;
  if new.development is distinct from old.development then
    raise exception 'development cannot be changed';
  end if;
  return new;
end;
$$;

create trigger profiles_immutable_fields
  before update on profiles
  for each row execute function enforce_profiles_immutable();

-- Auto-create profile on auth signup using user_metadata
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, first_name, last_name, email, development, unit_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    (coalesce(new.raw_user_meta_data ->> 'development', 'almina'))::development_id,
    coalesce(new.raw_user_meta_data ->> 'unit_number', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- CLASSES ----------------------------------------------------
create table classes (
  id uuid primary key default gen_random_uuid(),
  day smallint not null check (day between 0 and 6),
  "time" text not null,
  title text not null,
  venue text not null,
  intensity intensity not null,
  coach text not null,
  duration_min integer not null check (duration_min > 0),
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index classes_day_time_idx on classes (day, "time");

alter table classes enable row level security;

create policy "classes_read" on classes
  for select to authenticated using (true);

create policy "classes_admin_insert" on classes
  for insert to authenticated
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "classes_admin_update" on classes
  for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "classes_admin_delete" on classes
  for delete to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- BOOKINGS ---------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  session_date date not null,
  created_at timestamptz not null default now(),
  unique (profile_id, class_id, session_date)
);

create index bookings_profile_date_idx on bookings (profile_id, session_date);

alter table bookings enable row level security;

create policy "bookings_select_own" on bookings
  for select to authenticated using (profile_id = auth.uid());

create policy "bookings_insert_own" on bookings
  for insert to authenticated with check (profile_id = auth.uid());

create policy "bookings_delete_own" on bookings
  for delete to authenticated using (profile_id = auth.uid());

-- SESSION HISTORY --------------------------------------------
create table session_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  title text not null,
  venue text not null,
  intensity intensity not null,
  session_date date not null,
  completed_at timestamptz not null default now()
);

create index session_history_profile_idx on session_history (profile_id, completed_at desc);

alter table session_history enable row level security;

create policy "session_history_select_own" on session_history
  for select to authenticated using (profile_id = auth.uid());

create policy "session_history_insert_own" on session_history
  for insert to authenticated with check (profile_id = auth.uid());

create policy "session_history_delete_own" on session_history
  for delete to authenticated using (profile_id = auth.uid());

-- On booking insert, also log to session_history
create or replace function log_booking_to_history()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c record;
begin
  select title, venue, intensity into c from classes where id = new.class_id;
  if found then
    insert into session_history (profile_id, class_id, title, venue, intensity, session_date)
    values (new.profile_id, new.class_id, c.title, c.venue, c.intensity, new.session_date);
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_to_history on bookings;
create trigger bookings_to_history
  after insert on bookings
  for each row execute function log_booking_to_history();

-- EVENTS -----------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  "time" text not null,
  title text not null,
  venue text not null,
  host text not null,
  capacity integer not null check (capacity > 0),
  kind event_kind not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index events_date_idx on events (date);

alter table events enable row level security;

create policy "events_read" on events
  for select to authenticated using (true);

create policy "events_admin_insert" on events
  for insert to authenticated
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "events_admin_update" on events
  for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "events_admin_delete" on events
  for delete to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- EVENT RSVPS ------------------------------------------------
create table event_rsvps (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, event_id)
);

create index event_rsvps_event_idx on event_rsvps (event_id);

alter table event_rsvps enable row level security;

create policy "event_rsvps_select_own" on event_rsvps
  for select to authenticated using (profile_id = auth.uid());

create policy "event_rsvps_insert_own" on event_rsvps
  for insert to authenticated with check (profile_id = auth.uid());

create policy "event_rsvps_delete_own" on event_rsvps
  for delete to authenticated using (profile_id = auth.uid());

-- Capacity trigger
create or replace function enforce_event_capacity()
returns trigger language plpgsql as $$
declare
  current_count int;
  max_cap int;
begin
  select capacity into max_cap from events where id = new.event_id;
  select count(*) into current_count from event_rsvps where event_id = new.event_id;
  if current_count >= max_cap then
    raise exception 'event at capacity';
  end if;
  return new;
end;
$$;

drop trigger if exists event_rsvps_capacity_check on event_rsvps;
create trigger event_rsvps_capacity_check
  before insert on event_rsvps
  for each row execute function enforce_event_capacity();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Weekly programme (10 fixed classes)
insert into classes (day, "time", title, venue, intensity, coach, duration_min, description) values
  (1, '07:00', 'HYROX training', 'Sports Centre', 'high', 'Tomash', 60,
   'Race-specific conditioning across eight movement stations. Strength endurance meets structured intervals. Intended for residents comfortable under load.'),
  (1, '19:00', 'Mobility & stretching', 'Spa', 'low', 'Elena', 45,
   'Slow, considered work through the hips, thoracic spine and posterior chain. Ideal after travel or a long day of meetings.'),
  (2, '07:30', 'Yoga & meditation', 'Wellness Studio', 'low', 'Elena', 60,
   'A Vinyasa flow grounded in breath, followed by a ten-minute guided meditation. All levels held in the same room.'),
  (2, '18:30', 'Functional strength', 'Gym', 'high', 'Tomash', 60,
   'Full-body strength circuit with kettlebells, dumbbells and bodyweight. Progressive, programmed, built for longevity.'),
  (3, '06:30', 'Social run + intervals', 'Coastal Route', 'high', 'Marc', 60,
   'Easy 5km along the paseo marítimo with structured intervals in the final kilometre. Espresso at the clubhouse afterwards.'),
  (3, '19:00', 'Sound bath & restore', 'Wellness Studio', 'low', 'Visiting', 60,
   'A supine session with singing bowls and gong. The lights go low, the day goes quiet, the nervous system follows.'),
  (4, '07:30', 'Pilates core flow', 'Wellness Studio', 'low', 'Elena', 50,
   'Mat-based Pilates emphasising breath, alignment and deep core. Small adjustments make the difference.'),
  (4, '18:30', 'Sprint & agility', 'Indoor Football Pitch', 'high', 'Marc', 45,
   'Short accelerations, lateral work, and reactive drills. A sharpening session, not a grind.'),
  (5, '07:00', 'Boxing & conditioning', 'Sports Centre', 'high', 'Tomash', 60,
   'Pad work, combinations and conditioning rounds. No sparring. Technical precision over intensity.'),
  (5, '19:00', 'Breathwork & recovery', 'Wellness Studio', 'low', 'Elena', 45,
   'Box breathing, extended exhale, and a guided body scan. The quietest hour of the week.');

-- Six seed events
insert into events (date, "time", title, venue, host, capacity, kind, description) values
  ('2026-04-25', '19:30', 'Resident dinner', 'Private dining · Almina', 'Hosted by the house', 24, 'dining',
   'A considered five-course tasting prepared by our visiting chef. Natural wine pairing available. Seating is communal, at a single long table.'),
  ('2026-04-28', '18:00', 'Pool club social evening', 'Pool Club · Alcántara del Mar', 'Hosted by Continuum', 40, 'social',
   'Aperitivo hour at sunset. Cold plates, signature negronis, a live vinyl set from a guest selector. Dress: smart, coastal.'),
  ('2026-05-02', '10:00', 'Wellness workshop · Sleep', 'Wellness Studio · Almina', 'With Dr. Corán', 20, 'workshop',
   'A two-hour seminar on the science of sleep and its effect on performance. Includes a take-home protocol and breath practice.'),
  ('2026-05-08', '07:00', 'Hiking excursion · Sierra Blanca', 'Meet at Alcántara del Mar', 'Led by Marc', 16, 'excursion',
   'A moderate four-hour route into the mountains above Marbella. Breakfast at altitude, return to the residence before noon.'),
  ('2026-05-11', '11:00', 'Holistic brunch', 'Rooftop · Almina', 'Hosted by Continuum', 30, 'dining',
   'A considered late morning — cold-pressed juices, slow grains, and a brief conversation on seasonal eating.'),
  ('2026-05-17', '17:00', 'Signature summer opening', 'All venues · Alcántara del Mar', 'The Continuum season', 80, 'signature',
   'Our seasonal programme launch. Drinks, a short address from the founder, and an introduction to the summer calendar.');

-- ============================================================
-- HOW TO GRANT ADMIN
-- ============================================================
-- After creating a user via the Continuum signup, run:
--   update profiles set role = 'admin' where email = 'you@example.com';
-- This bypasses the self-elevation guard because it runs as the
-- service role from the SQL editor.
