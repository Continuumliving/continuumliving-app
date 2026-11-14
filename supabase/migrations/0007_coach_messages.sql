-- ============================================================
-- 0007_coach_messages.sql
-- Private 1:1 messaging between each resident and the coach.
--   * one thread per resident (resident_id); the coach is any admin
--   * residents read/write only their own thread
--   * admins read every thread and reply in any thread
--   * read_at marks a message as read by the other side
-- Safe to run more than once.
-- ============================================================

create table if not exists coach_messages (
  id           uuid primary key default gen_random_uuid(),
  resident_id  uuid not null references profiles(id) on delete cascade,
  sender_id    uuid not null references profiles(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 2000),
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);

create index if not exists coach_messages_thread_idx
  on coach_messages (resident_id, created_at);

alter table coach_messages enable row level security;

drop policy if exists "coach_messages_select" on coach_messages;
create policy "coach_messages_select" on coach_messages
  for select to authenticated
  using (resident_id = auth.uid() or is_admin());

drop policy if exists "coach_messages_insert" on coach_messages;
create policy "coach_messages_insert" on coach_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (resident_id = auth.uid() or is_admin())
  );

-- marking as read: only via the function below (no direct updates)
drop policy if exists "coach_messages_update" on coach_messages;

create or replace function mark_thread_read(p_resident uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update coach_messages
     set read_at = now()
   where resident_id = p_resident
     and read_at is null
     and sender_id <> auth.uid()
     and (p_resident = auth.uid() or is_admin());
$$;

revoke all on function mark_thread_read(uuid) from public;
grant execute on function mark_thread_read(uuid) to authenticated;
