# Supabase Setup (Phase 3 — Cloud Sync)

Cloud sync, accounts, and cloud photo backup are entirely optional — the app
works fully offline without any of this. Only do this if you want to sign in
and sync your collection across devices / back it up to the cloud.

Creating the Supabase project is an account-creation step, so it has to be
you — I can't do this part for you.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com/) and sign up (or log in).
2. **New project** → pick an organization → name it (e.g. "zora") → choose a
   database password (save it somewhere — you generally won't need it again
   day-to-day, Supabase manages the connection for you) → pick a region close
   to you → **Create new project**. Takes ~2 minutes to provision.

## 2. Run the schema

1. In your new project, open **SQL Editor** (left sidebar) → **New query**.
2. Open [docs/supabase/schema.sql](supabase/schema.sql) from this repo, copy
   its entire contents, paste into the SQL Editor, and click **Run**.
3. This creates every table (items, photos, valuations, transactions,
   wishlists, locations, storage boxes, etc.), turns on Row Level Security
   so each account only ever sees its own data, seeds the fixed category
   list, and creates a `photos` storage bucket for cloud photo backup.

## 3. Get your project's URL and anon key

1. **Project Settings** (gear icon) → **API**.
2. Copy the **Project URL** (looks like `https://xxxxxxxx.supabase.co`).
3. Copy the **anon / public** key (a long string starting with `eyJ...`).
   This key is *designed* to be embedded in client apps — Row Level Security
   is what actually protects your data, not keeping this key secret.

## 4. Configure the mobile app

Edit `mobile/.env` (create it from `.env.example` if you haven't already)
and add:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Restart `npx expo start` after editing `.env` (Expo only reads it at
startup).

## 5. Try it

1. Open the app → **More → Account** → **Sign Up** with an email + password.
   (Supabase's default settings may require confirming via a confirmation
   email — check your inbox, or disable "Confirm email" under
   **Authentication → Providers → Email** in the Supabase dashboard for
   faster local testing.)
2. Once signed in, **More → Account → Sync Now** pushes your local
   collection to the cloud and pulls anything already there.
3. Sign in with the same account on a second device (or after reinstalling)
   to see your collection restored.

## Notes

- Photos sync too: `Sync Now` uploads any local-only photos to the `photos`
  Storage bucket in the background. This can take a while for a large
  collection on a slow connection — it runs in the background and doesn't
  block the rest of the app.
- If you ever want to stop using cloud sync, **More → Account → Sign Out**
  — your local data stays exactly as it is; only the cloud copy stops
  updating.
- The free Supabase tier is generous for a personal collection (500MB
  database, 1GB file storage, 50,000 monthly active users) — a few thousand
  collectibles with photos should fit comfortably.
