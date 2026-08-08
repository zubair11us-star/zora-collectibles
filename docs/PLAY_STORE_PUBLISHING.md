# Publishing Zora to the Google Play Store

Everything here is a step you run/do yourself — account creation, payments,
and store submissions aren't things I can do on your behalf. This is the
full path from "working app" to "live on Play Store."

## 0. Prerequisites

- A [Google Play Console](https://play.google.com/console/) developer
  account. One-time **$25 registration fee**, paid by you with your own
  Google account.
- An [Expo account](https://expo.dev/signup) (free) for EAS Build.
- The app already builds and runs correctly via Expo Go (you've verified
  this). Production builds go through a different compiler path (Hermes
  bytecode, not Expo Go's JS interpreter) — test the **preview APK** in
  step 3 thoroughly before submitting to production, since that path
  hasn't been exercised yet in this project.

## 1. Install EAS CLI and link the project

```bash
npm install -g eas-cli
eas login
```

```bash
cd mobile
eas init
```

`eas init` links this project to your Expo account and writes an
`extra.eas.projectId` into `app.json` automatically — that's expected, don't
revert it.

## 2. Set the Anthropic key / Supabase secrets (if not already done)

AI identification and receipt OCR for real users go through your deployed
Supabase Edge Functions — see [EDGE_FUNCTIONS_SETUP.md](EDGE_FUNCTIONS_SETUP.md).
Make sure `supabase secrets set ANTHROPIC_API_KEY=...` is done and your
Anthropic account has available credits, or every Play Store user's AI scan
will fail (the app still works — it falls back to manual entry — but AI
identification won't function).

## 3. Build and test a preview APK first

```bash
eas build --platform android --profile preview
```

This produces a directly-installable `.apk` (not submitted anywhere). When
the build finishes, EAS gives you a download link/QR code — install it on
your phone and run through the full app: scanning, saving items, search,
sync if you use it, backup/restore. This is your one chance to catch
production-build-only issues before they reach the Play Store.

## 4. Build the production release

```bash
eas build --platform android --profile production
```

This produces a signed `.aab` (Android App Bundle), which is what Play
Store submissions require (not `.apk`). `eas.json` is already configured
with `autoIncrement: true`, so EAS bumps the Android `versionCode`
automatically on every production build — you don't need to hand-edit
version numbers per release. Bump the human-readable `"version"` in
`app.json` yourself for meaningful releases (e.g. `0.1.0` → `0.2.0`).

EAS manages your Android signing key for you the first time you build,
unless you already have one — follow its prompts.

## 5. Create the app in Play Console

In [Play Console](https://play.google.com/console/) → **Create app**:

- App name: `Zora` (or your preferred store name)
- Default language, App/Game: App, Free/Paid: your choice
- Declarations: accept the developer program policies and US export laws

## 6. Store listing assets

- **App icon:** `mobile/assets/play-store-icon-512.png` (512×512, generated
  already — regenerate anytime with `node scripts/generate-icon.js` from
  `mobile/`).
- **Feature graphic:** 1024×500 banner — not auto-generated here (it's a
  marketing image, typically needs designed text/branding). Play Console
  will tell you if it's required for your listing; if so, create one with
  any design tool.
- **Phone screenshots:** at least 2, ideally 4-8, showing Dashboard,
  Collection, Scan flow, Item Details. Take these from your own device or
  an emulator running the preview build.
- **Short description** (≤80 chars) and **full description** (≤4000
  chars): write these based on the app's actual feature set (collectibles
  inventory, AI-assisted scanning, offline-first, optional cloud sync).

## 7. Privacy policy

Play Console requires a **publicly hosted URL** for your privacy policy.
This is already live via GitHub Pages, serving straight from
[`docs/PRIVACY_POLICY.md`](PRIVACY_POLICY.md):

**https://zubair11us-star.github.io/zora-collectibles/PRIVACY_POLICY.html**

Paste that URL into Play Console → **App content → Privacy policy**. If you
ever edit `PRIVACY_POLICY.md`, just `git push` — Pages rebuilds
automatically in a minute or two and the same URL stays valid.

## 8. App content questionnaires

Under **Policy → App content** in Play Console, you'll fill out several
forms yourself. Based on what Zora actually does:

- **Data safety form** — data collected/shared, matching
  `PRIVACY_POLICY.md`:
  - *Photos*: collected (stored locally, optionally synced to your Supabase
    project if the user signs in), not shared with third parties for
    advertising. Sent transiently to Anthropic's Claude API only when the
    user triggers AI scan/OCR.
  - *Personal info (email)*: collected only if the user creates an
    account, used solely for authentication.
  - Declare data is encrypted in transit, and that users can request
    deletion (matches section 7 of the privacy policy).
  - No advertising ID, no analytics/tracking SDKs — answer "No" to ad/
    analytics data collection.
- **Content rating questionnaire**: no violence, no user-generated content
  shared publicly, no gambling — this should land Zora at "Everyone."
- **Target audience**: general audience, not primarily for children.
- **Ads**: No (the app has none).
- **Government app / COVID app / financial features**: No to all — Zora
  tracks personal purchase/value records, it doesn't provide financial
  services or advice.

## 9. Permissions justification

Play Console may ask why the app requests sensitive permissions:

- **Camera**: core feature — scanning and photographing collectibles.
- **Notifications**: optional local reminders the user explicitly enables
  in Settings (backup reminder, wishlist price-check reminder). No push
  notification service is used.
- **Photo library / media**: attaching existing photos to items, saving
  exports.

## 10. Upload the build

Under **Release → Testing → Internal testing** (recommended first, before
Production):

1. Create a release, upload the `.aab` from step 4 (download it from the
   EAS build page, or run `eas build:list` to find it).
2. Add yourself as an internal tester, install via the opt-in link Play
   Console gives you, and confirm it behaves the same as your preview APK.
3. Once satisfied, create a **Production** release with the same build (or
   promote the internal testing release) and submit for review.

Alternatively, `eas submit --platform android --profile production` can
upload builds directly from the command line, but it needs a Google Play
service account JSON key (its own Google Cloud setup) — for a first
submission, uploading manually through the Play Console UI above is
simpler and avoids that extra credential setup.

## 11. Review and rollout

Google's review typically takes anywhere from a few hours to a few days
for a new app. Once approved, you control the rollout percentage
(staged rollout) from Play Console. After that, every future update is
just: bump `"version"` in `app.json` if you want, run
`eas build --platform android --profile production` again, and upload the
new `.aab`.
