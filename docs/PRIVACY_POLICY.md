# Zora Privacy Policy

**Last updated:** 2026-08-08

This policy explains what data Zora ("the app") collects, how it's used,
and what choices you have. Zora is built to be local-first: by default your
collectibles data never leaves your device.

## 1. Data stored on your device

Everything you enter in Zora — items, categories, photos, purchase and
valuation history, locations, storage boxes, transactions, wishlist entries,
and settings — is stored locally in an on-device SQLite database and, for
photos, the device's app-private file storage. This data is not collected
by us and is not accessible to us. Uninstalling the app or clearing app
data deletes it, unless you've made a backup (section 4) or enabled cloud
sync (section 2).

## 2. Optional account and cloud sync (Supabase)

Creating an account is optional. If you sign up, Zora uses
[Supabase](https://supabase.com) for authentication and to sync your
inventory data and photos across your own devices. When cloud sync is on:

- Your item, location, valuation, transaction, and wishlist data is stored
  in a Supabase Postgres database, scoped to your account via row-level
  security — no other user can read or write your rows.
- Photos you've added are uploaded to Supabase Storage, in a folder scoped
  to your user ID.
- Your email address is stored by Supabase Auth to manage your login.

This data is hosted on the Supabase project the app's developer operates.
It is used solely to provide the sync feature — it is not sold, shared with
advertisers, or used for any purpose beyond making your data available
across your own devices. You can delete your synced data by deleting items
in-app (which removes them on next sync) or by requesting account deletion
(contact below).

If you never create an account, none of this section applies — the app
works fully offline using only on-device storage.

## 3. AI photo identification and receipt scanning

When you use AI-assisted scanning or receipt OCR, the photo(s) you capture
for that action are sent to Anthropic's Claude API (via a server-side proxy
that adds no logging or storage of its own) solely to identify the item or
extract receipt details. The response is returned to your device and nothing
is retained by the proxy after the request completes. This only happens
when you actively trigger a scan or receipt-OCR action — photos are never
uploaded automatically or in the background. See
[Anthropic's privacy policy](https://www.anthropic.com/legal/privacy) for
how they handle data sent to their API.

Barcode scanning first checks a small local reference database on your
device. If nothing matches, the app queries the public UPCitemdb lookup
API (`api.upcitemdb.com`) with just the scanned barcode number — no photos
or personal data are sent for this lookup.

## 4. Backups and exports

Zora lets you export your data (CSV, JSON, or a full backup file) to your
device's storage or to share via your device's normal share sheet (e.g.
email, cloud drive, messaging apps you choose). These exports are created
and sent entirely under your control — we have no visibility into where
you save or share them.

## 5. Permissions the app requests

- **Camera** — to scan and photograph collectibles and receipts. Used only
  when you're actively in a scan/photo screen.
- **Photo library** — to attach existing photos to items, and to save
  exported files, if you choose to.
- **Notifications** — for optional local reminders you configure (e.g.
  price-check reminders). These are scheduled on-device; no push
  notification service or third party is involved.

None of these permissions are used to collect data in the background.

## 6. What we don't do

- We don't run analytics or crash-tracking SDKs that profile you.
- We don't show ads or use advertising identifiers.
- We don't sell or share your data with data brokers or advertisers.
- We don't access your contacts, location, or any device data unrelated to
  the features above.

## 7. Data deletion

- **Local data:** delete items in-app, or uninstall the app to remove
  everything stored on-device.
- **Synced/account data:** delete items in-app (removes them from the
  cloud on next sync), or contact us (below) to request full account and
  data deletion from Supabase.

## 8. Children's privacy

Zora is not directed at children under 13, and we do not knowingly collect
data from them.

## 9. Changes to this policy

If this policy changes, the "Last updated" date above will change and, for
material changes, we'll note it in the app's release notes.

## 10. Contact

Questions about this policy or data-deletion requests: **zubair.11us@gmail.com**
