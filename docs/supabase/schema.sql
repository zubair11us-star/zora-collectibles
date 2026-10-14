-- Zura Phase 3 — Supabase (Postgres) schema.
--
-- Mirrors mobile/src/db/schema.ts + migrations.ts. Row ids are the same
-- client-generated nanoids used locally (not gen_random_uuid()), so a
-- device's local SQLite row and its cloud row always share one id — sync is
-- a straightforward upsert-by-id in both directions, no id-mapping table
-- needed.
--
-- Every user-owned table has a `user_id` column tied to Supabase Auth and
-- Row Level Security restricting all access to `auth.uid() = user_id`, so
-- one Postgres database safely serves every signed-in user. `categories` is
-- the one global, read-only-to-clients table (the fixed list of collectible
-- categories), shared across all users.
--
-- Run this whole file once in the Supabase SQL Editor (Dashboard -> SQL
-- Editor -> New query) after creating your project. See
-- docs/SUPABASE_SETUP.md for the full walkthrough.

-- ── Global reference data ────────────────────────────────────────────────

create table if not exists categories (
  id text primary key,
  key text not null unique,
  name text not null,
  icon text not null,
  sort_order integer not null default 0
);

alter table categories enable row level security;

create policy "categories are readable by any authenticated user"
  on categories for select
  to authenticated
  using (true);

insert into categories (id, key, name, icon, sort_order) values
  ('currency', 'currency', 'Currency', '💵', 0),
  ('coins', 'coins', 'Coins', '🪙', 1),
  ('pokemon', 'pokemon', 'Pokémon', '⚡', 2),
  ('hotwheels', 'hotwheels', 'Hot Wheels', '🏎️', 3),
  ('tradingcards', 'tradingcards', 'Trading Cards', '🃏', 4),
  ('stamps', 'stamps', 'Stamps', '📮', 5),
  ('toys', 'toys', 'Toys', '🧸', 6),
  ('diecast', 'diecast', 'Die-Cast', '🚗', 7),
  ('watches', 'watches', 'Watches', '⌚', 8),
  ('medals', 'medals', 'Medals', '🎖️', 9),
  ('souvenirs', 'souvenirs', 'Souvenirs', '🗿', 10),
  ('other', 'other', 'Other', '📦', 11)
on conflict (id) do nothing;

-- ── Per-user tables ──────────────────────────────────────────────────────

create table if not exists locations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_location_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists storage_boxes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  location_id text references locations(id) on delete set null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null references categories(id),
  subcategory text,
  name text not null,
  description text,
  brand text,
  country text,
  manufacturer text,
  year integer,
  series text,
  set_name text,
  model text,
  catalog_number text,
  card_number text,
  denomination text,
  currency text,
  serial_number text,
  condition text not null default 'unspecified',
  grade text,
  quantity integer not null default 1,
  purchase_date text,
  purchase_price double precision,
  purchase_currency text,
  current_value double precision,
  current_value_currency text,
  selling_price double precision,
  location_id text references locations(id) on delete set null,
  storage_box_id text references storage_boxes(id) on delete set null,
  storage_position text,
  barcode text,
  qr_code text,
  identification_source text not null default 'manual',
  ai_confidence double precision,
  sale_status text not null default 'not_for_sale',
  notes text,
  is_demo boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists item_attributes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references items(id) on delete cascade,
  key text not null,
  value text not null
);

create table if not exists photos (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references items(id) on delete cascade,
  type text not null default 'other',
  file_path text not null,
  thumbnail_path text,
  cloud_url text,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists valuations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references items(id) on delete cascade,
  date text not null,
  value double precision not null,
  currency text not null,
  source text not null default 'manual',
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references items(id) on delete cascade,
  type text not null,
  date text not null,
  counterparty text,
  price double precision,
  currency text,
  quantity integer not null default 1,
  fees double precision,
  shipping double precision,
  total_cost double precision,
  net_amount double precision,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists wishlists (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_id text references categories(id),
  desired_condition text not null default 'unspecified',
  target_price double precision,
  target_currency text,
  priority text not null default 'medium',
  notes text,
  linked_item_id text references items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_identifications (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text references items(id) on delete cascade,
  category_guess text,
  raw_response_json text not null,
  confidence double precision not null,
  possible_matches_json text not null,
  created_at timestamptz not null default now()
);

create table if not exists exchange_rates (
  user_id uuid not null references auth.users(id) on delete cascade,
  currency_code text not null,
  rate_to_base double precision not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, currency_code)
);

create table if not exists app_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value text not null,
  primary key (user_id, key)
);

-- ── Row Level Security: every per-user table only exposes its owner's rows ─

alter table locations enable row level security;
alter table storage_boxes enable row level security;
alter table items enable row level security;
alter table item_attributes enable row level security;
alter table photos enable row level security;
alter table valuations enable row level security;
alter table transactions enable row level security;
alter table wishlists enable row level security;
alter table ai_identifications enable row level security;
alter table exchange_rates enable row level security;
alter table app_settings enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'locations', 'storage_boxes', 'items', 'item_attributes', 'photos',
    'valuations', 'transactions', 'wishlists', 'ai_identifications',
    'exchange_rates', 'app_settings'
  ]
  loop
    execute format(
      'create policy "owner full access" on %I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- ── Storage bucket for collectible photos ───────────────────────────────
-- Run separately if the bucket doesn't already exist (Dashboard -> Storage
-- -> New bucket -> name "photos" also works and is equivalent to this).

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "users manage their own folder in the photos bucket"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
