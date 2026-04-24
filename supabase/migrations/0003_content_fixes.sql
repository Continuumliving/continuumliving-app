-- ============================================================
-- 0003_content_fixes.sql
-- Idempotent content repair. Run this in the Supabase SQL editor
-- if your developments/events rows were inserted through a tool
-- that mangled UTF-8 (e.g. "Alc¬Σntara" / "ALC√°NTARA" / "Alc??ntara").
-- Safe to run multiple times — each UPDATE is a no-op if the row
-- already holds the correct string.
-- ============================================================

-- developments --------------------------------------------------
update developments
   set name = 'Alcántara del Mar'
 where id = 'alcantara';

update developments
   set location = 'San Pedro de Alcántara'
 where id = 'alcantara';

-- events --------------------------------------------------------
update events
   set venue = 'Pool Club · Alcántara del Mar'
 where title = 'Pool club social evening';

update events
   set venue = 'Meet at Alcántara del Mar'
 where title = 'Hiking excursion · Sierra Blanca';

update events
   set venue = 'All venues · Alcántara del Mar'
 where title = 'Signature summer opening';

-- Catch-all: replace any lingering mojibake patterns with the
-- correct character in any event / development row. These REGEXP
-- matches are defensive — they do nothing on clean data.
update events
   set venue = regexp_replace(venue, '(Alc)[^a-zA-Z]+(ntara)', '\1á\2', 'g')
 where venue ~ '(Alc)[^a-zA-Z]+(ntara)';

update developments
   set name = regexp_replace(name, '(Alc)[^a-zA-Z]+(ntara)', '\1á\2', 'g')
 where name ~ '(Alc)[^a-zA-Z]+(ntara)';

update developments
   set location = regexp_replace(location, '(Alc)[^a-zA-Z]+(ntara)', '\1á\2', 'g')
 where location ~ '(Alc)[^a-zA-Z]+(ntara)';
