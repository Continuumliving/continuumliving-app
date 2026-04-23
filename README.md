# Continuum Living

A mobile-first PWA for residents of **Almina Residences** (Estepona) and **Alcántara del Mar** (San Pedro de Alcántara). Sign in, book a class from the weekly programme, RSVP to curated gatherings, and track your season.

Designed in an editorial register — Cormorant Garamond serif, Inter sans, 0.5px hairlines, no shadows, no gradients. Built with Next.js, Tailwind and Supabase.

## Stack

- Next.js 14 (App Router, React 18)
- TypeScript (strict)
- Tailwind CSS v3
- Supabase (Auth + Postgres with Row Level Security)
- `@supabase/ssr` for cookie-based session sync
- `date-fns-tz` for Europe/Madrid date maths
- PWA via Next `app/manifest.ts` + dynamic `icon`/`apple-icon`

## Getting started

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local and paste your Supabase URL and anon key
npm run dev
```

Open http://localhost:3000 on your phone (same Wi-Fi) or in desktop DevTools mobile mode. Safari on iOS can "Add to Home Screen" for the full standalone PWA.

## Environment

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Database

Create a new Supabase project, open the SQL editor and run `supabase/migrations/0001_init.sql`. The migration sets up:

| Table             | Purpose                                                       |
| ----------------- | ------------------------------------------------------------- |
| `developments`    | Almina + Alcántara metadata                                   |
| `profiles`        | One row per auth user, carries first/last name, unit, role    |
| `classes`         | The weekly programme (10 seeded)                              |
| `bookings`        | Per-resident class reservations                               |
| `events`          | Seasonal gatherings (6 seeded)                                |
| `event_rsvps`     | Per-resident event reservations                               |
| `session_history` | Appended on each booking insert (for the activity breakdown)  |

Row Level Security is enforced everywhere:

- Residents see only **their own** profile, bookings, RSVPs and history.
- Any authenticated user can **read** classes, events and developments.
- Only users with `role = 'admin'` can **write** classes or events (enforced in policies with `exists(select 1 from profiles ...)`).
- Residents cannot elevate their own `role` or change their `development` (enforced by a before-update trigger).

### Granting admin

Sign up a user via the app, then in the SQL editor:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

The admin panel then becomes available at `/admin` from the Account screen.

## Routes

| Path                         | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `/signin`, `/signup`         | Auth (email + password)                     |
| `/today`                     | Greeting, quote, stats, today/tomorrow, RSVPs |
| `/classes`                   | Weekly programme with day filter chips      |
| `/classes/[slug]`            | Class detail, book / cancel                 |
| `/events`                    | Seasonal calendar, signature events in ink  |
| `/events/[id]`               | Event detail, RSVP / cancel                 |
| `/account`                   | Resident hero, activity, bookings, sign out |
| `/admin`                     | Admin index (admins only)                   |
| `/admin/classes`             | Manage classes                              |
| `/admin/classes/new`         | Add a new class                             |
| `/admin/classes/[id]`        | Edit / retire a class                       |
| `/admin/events`              | Manage events                               |
| `/admin/events/new`          | Add a new event                             |
| `/admin/events/[id]`         | Edit / remove an event                      |
| `/offline`                   | Elegant offline fallback                    |

## Verifying end-to-end

1. `npm run dev`, open on mobile.
2. Sign up as an Almina resident. A profile row is created via trigger.
3. Hit `/today` — greeting renders, quote block, stat cards at zero.
4. Open Monday HYROX, reserve — booking appears under "Today's sessions" with "You are booked" badge. Stats increment via `session_history`.
5. Cancel — badge disappears, counts decrement.
6. Open Resident dinner under Events, add your name — appears on "On your calendar" on Today.
7. In the SQL editor, set your role to `admin` and refresh Account — the "Open admin panel" ghost button appears. Add a new class and confirm it appears on the residents' Classes screen.
8. Safari on iOS → Share → Add to Home Screen. Launches standalone with the "C" icon.

## Design tokens

Defined as CSS variables in `app/globals.css`:

```
--ink          #1a1817
--ink-soft     #3a3632
--stone-deep   #6b5d4d
--stone        #a89683
--sand         #d4c8b8
--warm         #ebe4d7
--bone         #f5f1ea
--cream        #faf6ee
--terracotta   #c97b5a (high intensity)
--olive        #5c7a6b (low intensity)
```

Typography is Cormorant Garamond (300/400 + italic) for editorial display and Inter (300/400/500) for UI. All labels, eyebrows and meta tags are uppercase Inter at 9–11px with 0.22–0.3em letter-spacing.
