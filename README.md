# Zura — Personal Collectibles Inventory

Scan → Identify → Confirm → Save → Search → Manage. A local-first mobile app
for cataloguing currency, coins, Hot Wheels, Pokémon/trading cards, stamps,
toys, die-cast, watches, medals, and more, with AI-assisted identification
via camera.

This app is built through **Phase 3** — all three phases of the original
plan are implemented. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for
the full system design, [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md) for the
database schema, [docs/API.md](docs/API.md) for the AI proxy's HTTP
contract, and [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for setting
up optional cloud sync.

### Verified so far

Both `mobile/` and `server/` have zero TypeScript errors (`npm run
typecheck`), `expo-doctor` passes 18/18 checks, and a full Metro bundle
compiles cleanly (1892 modules, no missing imports or resolution errors).
The app has been run live on a physical Android phone via Expo Go —
dashboard, demo data, and the AI scan → error-fallback → manual entry path
all confirmed working end-to-end. AI identification itself is blocked only
on the Anthropic account having API credits (a billing step, not a code
issue) — the request/response pipeline round-trips correctly. Phase 3's
cloud sync/auth/photo-upload path is built and typechecked but **not yet
live-tested against a real Supabase project** — that needs you to create
one first (docs/SUPABASE_SETUP.md), since account creation isn't something
I can do on your behalf.

## What's in Phase 1 (MVP)

- Full camera scan flow: front/back capture → AI identification (Claude
  vision) → confidence score + possible matches → editable confirm form →
  save
- Barcode/QR scanning with local-database lookup
- Manual entry and "identify from an existing photo" paths
- Collection browsing: grid/list/gallery views, search, multi-filter
- Item details with purchase price, current value, profit/loss, ROI, and a
  value-history chart
- Dashboard with collection stats and charts (value/count by category,
  purchase vs. current, growth over time)
- Locations & storage box management, multi-currency support (base currency
  defaults to AED)
- Everything above works fully offline — only the AI identification step
  needs network access, and even that fails gracefully to manual entry
- Demo data (clearly marked) across five categories so the app isn't empty
  on first launch

## What's in Phase 2

- **Duplicate detection**: scanning/entering an item that matches an
  existing one (by category + serial/card/catalog number, or by name+set+year
  when no strong identifier exists) prompts "Add 1 to Quantity" vs "Create
  Separate Item"
- **Transactions**: purchase/sale/trade/gift/found/lost/damaged records per
  item, with automatic total-cost/net-amount calculation, plus a global
  Transactions browser (More → Transactions)
- **Wishlist**: full CRUD, priority levels, target price, "Scan to Identify"
  (reuses the AI camera flow with a wishlist-specific save path), and "Move
  to Collection" when purchased
- **For Sale status**: not-for-sale/planned/listed/reserved/sold per item,
  selling price, minimum price, marketplace, listing date, buyer, and a
  Collection filter for for-sale items
- **External barcode lookup**: when a scanned barcode has no local match,
  Zura checks a free public UPC database as a best-effort suggestion —
  always labeled unverified, never auto-saved
- **Receipt OCR**: photograph a receipt, Claude vision extracts store/date/
  total/line-items, review and save as a purchase transaction (or start a
  new item from it)

## What's in Phase 3

- **Accounts (optional)**: email/password sign up/sign in via Supabase Auth
  (More → Account & Sync). The app is fully functional signed-out — this
  only unlocks cloud sync
- **Cloud sync**: push/pull sync across every table (items, photos,
  valuations, transactions, wishlists, locations, storage boxes) scoped
  per-account via Postgres Row Level Security, reconciled by last-write-wins
  on `updated_at`. Runs automatically on launch when signed in, or on demand
  via "Sync Now". Known limitation: hard-deleted rows (locations, storage
  boxes, wishlist entries) aren't tracked with tombstones yet, so they can
  reappear after syncing with a device that still has them — items use
  soft-delete so they're unaffected
- **Cloud photo backup**: photos upload to Supabase Storage in the
  background during sync; `SyncedImage` tries the on-device file first and
  falls back to the cloud URL, so photos pulled from another device (or
  restored after a reinstall) still render
- **Backup/restore**: full local JSON export/import independent of cloud
  sync (Settings → Backup Now / Restore Backup) — protects your collection
  even if you never sign in
- **CSV/JSON import/export**: spreadsheet-friendly collection export, plus
  import with a CSV column-mapping screen (More → Import/Export)
- **Local notifications**: optional backup and wishlist reminders (Settings
  → Notifications) — nothing sent to any server
- **Expanded analytics**: most valuable item, highest ROI item, country
  distribution chart, latest purchases/sales, alongside the Phase 1
  dashboard stats

**Deferred beyond Phase 3** (see the original spec but out of scope here):
a public marketplace/listing page (needs a separate web frontend), Apple
Sign-In (needs a paid Apple Developer account), Excel/PDF export, push
notifications (only local notifications are implemented), full tombstone-
based sync for hard deletes.

## Technology Stack

| Layer | Choice |
|---|---|
| Mobile framework | React Native + Expo (TypeScript) |
| Navigation | React Navigation (bottom tabs + native stack) |
| Local database | SQLite (`expo-sqlite`) via Drizzle ORM |
| State | Zustand (settings, in-flight scan session) |
| Camera / barcode | `expo-camera` (`CameraView`, covers both photo capture and EAN/UPC/Code128/QR scanning) |
| Charts | `react-native-gifted-charts` |
| AI identification | Claude (Anthropic) vision API, called from a thin Express proxy server |
| AI proxy backend | Node.js + Express + TypeScript |
| Image storage | Device filesystem (`expo-file-system`), compressed via `expo-image-manipulator` |
| Cloud sync / accounts / photo backup | Supabase (Postgres + Auth + Storage) — optional, app works fully offline without it |
| Local notifications | `expo-notifications` |

## Project Structure

```
ZORA APP/
  mobile/     Expo React Native app — the actual product
  server/     Thin Express server — proxies photo identification to Claude, holds the API key
  docs/       Architecture, ER diagram, API reference, Supabase setup guide
```

## Setup

### Prerequisites

- Node.js 20+ and npm
- An Anthropic API key (for AI identification) — get one at
  https://console.anthropic.com/. Without it, everything except AI photo
  identification still works (barcode scan and manual entry are unaffected).
- Expo Go app on your Android phone (easiest), or Android Studio for an
  emulator
- Your phone and your dev machine on the **same Wi-Fi network**

### 1. Start the AI proxy server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and set `ANTHROPIC_API_KEY=sk-ant-...`.

```bash
npm run dev
```

You should see `Zura AI proxy listening on http://0.0.0.0:4000`. Find your
machine's LAN IP (e.g. `192.168.1.42`) — Windows: `ipconfig`, look for
"IPv4 Address" under your active adapter.

### 2. Configure and start the mobile app

```bash
cd mobile
npm install
npx expo install --check   # aligns dependency versions to your installed Expo SDK; say yes to any fixes it offers
cp .env.example .env
```

Edit `mobile/.env`:

```
EXPO_PUBLIC_AI_SERVER_URL=http://<your-lan-ip>:4000
```

(`localhost` will **not** work from a physical phone — it means "the phone
itself," not your computer.)

```bash
npx expo start
```

Scan the QR code with the Expo Go app on Android, or press `a` to launch on
a connected emulator/device.

You can also change the AI server URL later from inside the app: **More →
Settings → AI Server URL**.

### 3. First run

The app seeds ~21 demo items (clearly marked) across Currency, Coins, Hot
Wheels, Pokémon, and Stamps on first launch, plus a demo location and two
storage boxes, so the dashboard and collection views aren't empty. Delete
them individually from Item Details → Remove whenever you're ready to start
your real collection.

## Everyday commands

```bash
# Mobile
cd mobile
npx expo start          # start Metro bundler
npm run typecheck       # tsc --noEmit
npm run android         # build/run on Android

# Server
cd server
npm run dev              # start with auto-reload (tsx watch)
npm run build && npm start   # production build
```

## Troubleshooting

- **"Network request failed" when scanning**: your phone can't reach the AI
  server. Confirm `EXPO_PUBLIC_AI_SERVER_URL` uses your computer's LAN IP
  (not `localhost`), both devices are on the same network, and
  `server/npm run dev` is still running. Windows Firewall may need to allow
  Node.js on private networks the first time.
- **AI identification always returns low confidence / errors**: check
  `server/.env` has a valid `ANTHROPIC_API_KEY` and the server logs (the
  terminal running `npm run dev`) for the actual error from the Claude API.
- **Metro fails to resolve `nanoid`**: `mobile/src/utils/id.ts` imports
  `nanoid/non-secure`, an ESM-only subpath export — confirmed working with
  Expo SDK 52's Metro (a full `expo export` bundled cleanly during
  development of this app). If you're on an older Expo SDK whose Metro
  predates `package.json` "exports" support, pin an older `nanoid@3.x`
  (CommonJS) instead and update that one file.
- **Camera permission denied**: Settings app → Zura → Permissions → Camera,
  or uninstall/reinstall Expo Go and accept the prompt.

## Roadmap

All three original phases are implemented. What's left is the handful of
items called out as deferred in "What's in Phase 3" above: a public
marketplace/listing page, Apple Sign-In, Excel/PDF export, remote push
notifications, and full tombstone-based sync for hard deletes.
