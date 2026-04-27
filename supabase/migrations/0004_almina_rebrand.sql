-- ============================================================
-- 0004_almina_rebrand.sql
-- Rebrand: every visible reference to "Alcántara del Mar" /
-- "San Pedro de Alcántara" becomes "Almina Residence" / "Estepona".
-- The development_id enum and primary keys are NOT touched, so
-- existing profiles linked to id='alcantara' keep working — they
-- simply now display the Almina Residence name and Estepona
-- location, like every other resident.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- developments --------------------------------------------------
update developments
   set name = 'Almina Residence',
       location = 'Estepona'
 where id in ('almina', 'alcantara');

-- events --------------------------------------------------------
update events
   set venue = 'Pool Club · Almina Residence'
 where venue = 'Pool Club · Alcántara del Mar';

update events
   set venue = 'Meet at Almina Residence'
 where venue = 'Meet at Alcántara del Mar';

update events
   set venue = 'All venues · Almina Residence'
 where venue = 'All venues · Alcántara del Mar';

-- Catch-all for any seeded venue still mentioning the old name.
update events
   set venue = regexp_replace(venue, 'Alc[áa]ntara del Mar', 'Almina Residence', 'g')
 where venue ~ 'Alc[áa]ntara del Mar';

update events
   set venue = regexp_replace(venue, 'San Pedro de Alc[áa]ntara', 'Estepona', 'g')
 where venue ~ 'San Pedro de Alc[áa]ntara';
