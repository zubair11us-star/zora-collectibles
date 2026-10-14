# Zura — Architecture (Phase 1)

## Overview

Zura is a personal collectibles inventory app. Phase 1 is **local-first**:
everything except AI photo identification works fully offline, on-device.

```
┌─────────────────────────────┐        ┌──────────────────────────┐        ┌───────────────────┐
│   mobile/  (Expo + RN, TS)   │  HTTP  │  server/ (Express, TS)   │  HTTPS │   Claude Vision    │
│                              │ ─────► │  thin, stateless proxy   │ ─────► │   (Anthropic API)  │
│  screens / navigation        │        │  holds ANTHROPIC_API_KEY │        │                    │
│  db (SQLite via Drizzle)     │        │  never touches user data │        └───────────────────┘
│  services (image, AI client) │        └──────────────────────────┘
└─────────────────────────────┘
```

- **mobile/** owns all persistent state: SQLite database (items, photos,
  valuations, locations, etc.) and photo files on the device filesystem.
  Nothing about the user's collection is ever sent anywhere except the raw
  photo bytes sent to `/identify` for AI identification — and even those are
  not stored server-side.
- **server/** is a single-purpose AI proxy. Its only job is: accept photo(s)
  + optional category hint, ask Claude to identify the item, return
  structured JSON. This exists solely because an Anthropic API key must never
  ship inside a mobile app bundle. If the server is unreachable, the app
  still works — AI is an assistant, never a hard dependency (barcode scan and
  manual entry always work).

## Mobile app layers

```
screens/        UI screens, one per spec screen (see docs/API.md's sibling doc, the plan's Screen Map)
components/     Reusable presentational pieces (ItemCard, charts, form fields, buttons)
navigation/     React Navigation setup: BottomTabs nested inside a root Stack
state/          Zustand stores: settings (persisted to DB), in-flight scan session (ephemeral)
services/       Business logic that isn't pure data access: AI client, image compression,
                barcode lookup, currency conversion, demo data seeding
db/
  schema.ts         Drizzle table definitions (source of truth for column names/types)
  bootstrapSql.ts    Hand-written CREATE TABLE IF NOT EXISTS statements, kept in sync with schema.ts
  client.ts          Opens the SQLite DB, runs bootstrap, seeds categories/settings
  repositories/       One file per aggregate (items, photos, valuations, locations,
                       settings, categories, stats, ai identifications) — screens never
                       touch the `db` object directly, they call a repository function
types/          Domain types (models.ts) and the category→field-schema mapping
                (categoryFields.ts) that drives both the dynamic form UI and the AI prompt
```

### Why bootstrap SQL instead of generated migrations?

Drizzle normally generates versioned SQL migration files via `drizzle-kit
generate`, which requires running that CLI command as a build step. Phase 1
ships `db/bootstrapSql.ts` — idempotent `CREATE TABLE IF NOT EXISTS`
statements kept in exact sync with `schema.ts` — so the app has zero
build-time dependency and works the moment `npm install && npx expo start`
finishes. `drizzle.config.ts` is already in place for Phase 2+, when schema
changes need real migrations instead of "recreate the whole table."

### Flexible category fields (no per-category table sprawl)

Every collectible category (currency, coins, Pokémon, Hot Wheels, stamps,
…) shares one `items` table with the common columns (name, year, country,
condition, value, …). Category-specific attributes (e.g. a Pokémon card's
`hp`/`illustrator`/`holoType`, or a coin's `mintMark`/`metal`) live in the
`item_attributes` EAV table as free-form key/value pairs.

`mobile/src/types/categoryFields.ts` is the single source of truth for which
keys exist per category. It drives:
1. The dynamic confirm/edit form (renders the right inputs for the chosen category)
2. The AI prompt sent to the server (asks Claude to extract exactly those keys)

`server/src/prompts/categories.ts` mirrors this file. They're kept as plain
duplicates (not a shared package) so the server stays an independently
deployable, standalone service — see "Why two copies of category fields?"
below if you're extending this in Phase 2.

## AI identification flow

```
CameraScanScreen / PhotoUploadScreen
  → capture/pick photo(s), downscale + base64-encode (imageService.ts)
  → POST /identify { categoryHint?, images: [{side, base64Jpeg}] }
       server: buildIdentificationPrompt() → Claude vision API → parse strict JSON
  → IdentificationResultScreen: shows confidence badge, low-confidence warning,
    possible-matches list (user can pick an alternate candidate)
  → ItemEditScreen: fully editable form, pre-filled from AI fields —
    nothing is written to the database until the user taps "Confirm & Save"
```

Every AI call is also recorded in the `ai_identifications` table (raw
response + confidence + possible matches) for audit/debugging, linked to the
item once it's saved via `aiRepo.recordIdentification`.

`items.identification_source` is always one of `ai | barcode | external |
manual`, so the UI can always show the user where a piece of data came from
and they can always override it (spec: AI assistant, not AI authority).

## Data flow for a saved item

1. User confirms in `ItemEditScreen` → `itemsRepo.createItem()` inserts the
   `items` row, the `item_attributes` rows, and (if a current value was set)
   an initial `valuations` row.
2. Any photos captured/picked during the scan session are persisted to the
   app's document directory (`imageService.persistCollectibleImage`,
   compressed + thumbnailed) and linked via `photosRepo.addPhoto`.
3. If the item came from an AI scan, `aiRepo.recordIdentification` links the
   audit row to the new item id.
4. The scan session (Zustand `useScanSessionStore`) is reset.

## Multi-currency

`exchange_rates` stores a manually-editable rate-to-base-currency per
currency code (seeded with approximate demo rates in AED). All dashboard
aggregates convert through `utils/currency.ts#convertAmount` into the user's
base currency (Settings → Base Currency, default AED) without ever mutating
the original transaction currency/amount stored on the item.

## What's deferred to Phase 2 / Phase 3

Schema exists (cheap to add upfront) but no UI yet: `transactions`,
`wishlists`. Not yet started: duplicate detection, receipt OCR, external
barcode database lookup, for-sale/marketplace status, import/export, cloud
sync, accounts/auth, notifications, live FX rates, cloud backup. See the
root README's "Roadmap" section.
