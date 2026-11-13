-- ============================================================
-- 0006_owners_app.sql
-- Continuum Owners App (v2 design).
--   * classes.image / classes.category and events.image columns
--   * class_booking_counts() and event_rsvp_counts(): aggregate
--     counts residents may see ("4 of 6 places") without exposing
--     anyone else's bookings (SECURITY DEFINER, counts only)
--   * replaces the old pilot programme with the neutral Owners App
--     programme and upcoming events. NOTE: this removes existing
--     classes/events, and with them any test bookings and RSVPs.
-- Safe to run more than once.
-- ============================================================

alter table classes add column if not exists image text;
alter table classes add column if not exists category text not null default 'Push';
alter table events  add column if not exists image text;

-- counts ------------------------------------------------------
create or replace function class_booking_counts(p_from date, p_to date)
returns table (class_id uuid, session_date date, n integer)
language sql
security definer
set search_path = public
stable
as $$
  select b.class_id, b.session_date, count(*)::int
    from bookings b
   where b.session_date between p_from and p_to
   group by b.class_id, b.session_date;
$$;

revoke all on function class_booking_counts(date, date) from public;
grant execute on function class_booking_counts(date, date) to authenticated;

create or replace function event_rsvp_counts()
returns table (event_id uuid, n integer)
language sql
security definer
set search_path = public
stable
as $$
  select r.event_id, count(*)::int
    from event_rsvps r
   group by r.event_id;
$$;

revoke all on function event_rsvp_counts() from public;
grant execute on function event_rsvp_counts() to authenticated;

-- capacity guard for class bookings -------------------------
create or replace function enforce_class_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap int;
  taken int;
begin
  select capacity into cap from classes where id = new.class_id;
  select count(*) into taken from bookings
   where class_id = new.class_id and session_date = new.session_date;
  if cap is not null and taken >= cap then
    raise exception 'class at capacity';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_capacity_check on bookings;
create trigger bookings_capacity_check
  before insert on bookings
  for each row execute function enforce_class_capacity();

-- programme ---------------------------------------------------
-- day: 0 = Sunday … 6 = Saturday
delete from classes;

insert into classes (day, "time", title, venue, intensity, coach, duration_min, capacity, category, image, description) values
  (1, '07:00', 'HYROX Training',            'Fitness',         'high', 'Tomash', 60,  6, 'Push',    'gym',      'Stations, running and functional work. Builds engine and strength together.'),
  (1, '19:00', 'Mobility & Stretching',     'Movement studio', 'low',  'Tomash', 45,  8, 'Restore', 'mobility', 'Slow, guided mobility to open hips, back and shoulders.'),
  (2, '07:30', 'Yoga & Meditation',         'Yoga studio',     'low',  'Tomash', 60,  8, 'Restore', 'yoga',     'Breath-led flow and a short guided meditation.'),
  (2, '18:30', 'Functional Strength',       'Fitness',         'high', 'Tomash', 60,  6, 'Push',    'kb',       'Kettlebells, lifts and carries, scaled to your level.'),
  (3, '07:00', 'Outdoor Hike + Intervals',  'Coastal trail',   'high', 'Tomash', 75, 10, 'Explore', 'hike',     'A guided hike with short uphill intervals. Heart-rate guided.'),
  (3, '19:00', 'Pool Recovery',             'Pool',            'low',  'Tomash', 45,  8, 'Restore', 'pool',     'Easy movement in the water to unload joints and recover.'),
  (4, '07:30', 'Reformer Pilates',          'Pilates studio',  'low',  'Tomash', 50,  4, 'Restore', 'pilates',  'Core control and posture on the reformer, low impact.'),
  (4, '18:30', 'Sprint & Agility',          'Fitness',         'high', 'Tomash', 45,  8, 'Push',    'tread',    'Curved-treadmill sprints and agility work for speed and power.'),
  (5, '07:00', 'Boxing & Conditioning',     'Fitness',         'high', 'Tomash', 55,  6, 'Push',    'boxing',   'Bag work and conditioning rounds. No experience needed.'),
  (5, '19:00', 'Breathwork, Sauna & Steam', 'Spa',             'low',  'Tomash', 45,  6, 'Restore', 'sauna',    'Guided breathing, sauna and steam for deep recovery.');

delete from events;

insert into events (date, "time", title, venue, host, capacity, kind, image, description) values
  ('2026-12-11', '19:30', 'Resident Dinner',           'Private dining', 'Hosted by Continuum', 16, 'dining',    'dinner',
   'An evening with your neighbours: a seasonal longevity menu at the chef''s table, fine wines and a short talk on sleep and recovery.'),
  ('2027-01-21', '19:00', 'Recovery Evening',          'Spa',            'Hosted by Tomash',    12, 'workshop',  'tub',
   'A talk on sleep and recovery, then a guided heat and cold ritual in the spa.'),
  ('2027-03-13', '09:00', 'Retreat Weekend',           'Two days',       'Led by Tomash',       12, 'excursion', 'hike',
   'Two days of outdoor training, hikes and spa recovery, with a long lunch together.'),
  ('2027-04-10', '08:00', 'Pool & Breathwork Morning', 'Pool',           'Hosted by Continuum', 10, 'social',    'pool',
   'Breathwork, a slow swim and breakfast together. The calmest start to a weekend.');

-- neutral development naming ------------------------------------
update developments set name = 'Private Residences', location = '' where id in ('almina', 'alcantara');
