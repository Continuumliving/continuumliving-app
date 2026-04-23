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

## Deploying to Vercel (env-var checklist)

`NEXT_PUBLIC_*` variables in Next.js are **inlined at build time**. Setting them in Vercel *after* a deploy has no effect until you redeploy. If the signup form says _"Missing env at build time"_, this is the cause.

1. Vercel → your project → **Settings → Environment Variables**.
2. Add two entries:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key from Supabase → Project Settings → API (it starts with `ey…` and is a JWT).
3. Tick **Production** (and Preview, if you want PR deploys to work).
4. Go to **Deployments** → latest → ⋯ → **Redeploy** (not "Rollback", not "Open"). The variables are only baked into builds after you redeploy.
5. Open `https://<your-app>/env-check` to verify. Both Server and Client sections should show the mask (e.g. `https:…e.co`) and "looks like Supabase URL ✓" / "looks like JWT ✓". If a value reads `(missing)` the redeploy didn't pick it up — check scope (Production vs Preview) and try again.

## Troubleshooting auth

If **signup or signin hangs** and **no user appears in Authentication > Users**, it is almost always one of these three:

1. **A trigger on `auth.users` is throwing and rolling back the transaction.** This is what happened on the first deploy. `0001_init.sql` has since been hardened and `0002_signup_hardening.sql` patches existing projects. Run it once in the SQL editor:
   ```sql
   \i supabase/migrations/0002_signup_hardening.sql
   ```
   The patched `handle_new_auth_user` wraps the profile insert in `BEGIN/EXCEPTION` so it can never abort `auth.users` creation again. Any failure is logged as a Postgres `NOTICE` and the client-side `ensureMyProfile()` picks up the slack on the next page load.
2. **`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing or still placeholders** on Vercel. The signup and signin forms now throw and surface this inline instead of hanging.
3. **"Confirm email" is enabled** in Supabase Authentication → Providers → Email. With that on, `signUp` returns a user but no session; the app now shows a "Check your inbox" screen instead of looping through the middleware redirect.

Every auth error is printed to the browser console (`signUp error:` / `signInWithPassword error:`) and shown as an inline `notice` on the form — no more silent hangs.

## Database

Create a new Supabase project, open the SQL editor and run `supabase/migrations/0001_init.sql`. If you already deployed before the auth hardening, also run `supabase/migrations/0002_signup_hardening.sql`. The migration sets up:

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
