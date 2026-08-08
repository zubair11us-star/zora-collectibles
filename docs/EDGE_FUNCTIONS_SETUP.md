# Deploying the AI Proxy as Supabase Edge Functions

This replaces the local `server/` Express proxy for real users — anyone
running the app gets AI identification through your Supabase project
instead of needing your PC turned on. The mobile app already prefers this
path automatically once `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
are set in `mobile/.env` (see `src/services/aiIdentification.ts` /
`receiptOcrService.ts`) — it only falls back to the local `server/` if
Supabase isn't configured. Nothing to change on the mobile side.

The Edge Function source lives in `supabase/functions/` at the repo root:
`identify/`, `ocr-receipt/`, and shared prompt logic in `_shared/`.

## 1. Install the Supabase CLI

This is a one-time install on your machine. Pick one:

```bash
npm install -g supabase
```

(or `scoop install supabase` / `brew install supabase/tap/supabase` if you
have Scoop or Homebrew).

## 2. Log in and link your project

```bash
supabase login
```

This opens a browser to authorize the CLI against your Supabase account —
you do this yourself, same as any other account action.

```bash
cd "ZORA APP"
supabase link --project-ref dlhiljloehvxjsvugeig
```

(Replace the project ref with yours — it's the subdomain in your project
URL, e.g. `https://dlhiljloehvxjsvugeig.supabase.co` → ref is
`dlhiljloehvxjsvugeig`.)

## 3. Set the Anthropic API key as a secret

Edge Functions read `ANTHROPIC_API_KEY` from Supabase secrets, not a `.env`
file (secrets are encrypted and never appear in deployed function code):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Do this yourself — same policy as everywhere else in this project, I don't
handle API keys directly.

## 4. Deploy

```bash
supabase functions deploy identify
supabase functions deploy ocr-receipt
```

Each command prints the function's URL
(`https://<project-ref>.supabase.co/functions/v1/identify`), though the
mobile app doesn't need that directly — it calls through the Supabase SDK
(`supabase.functions.invoke(...)`), which resolves the URL automatically
from `EXPO_PUBLIC_SUPABASE_URL`.

## 5. Test it

```bash
curl -i --location --request POST \
  'https://<project-ref>.supabase.co/functions/v1/identify' \
  --header 'Authorization: Bearer <your-anon-key>' \
  --header 'Content-Type: application/json' \
  --data '{"categoryHint":"other","images":[{"side":"front","base64Jpeg":"<a real base64 jpeg>"}]}'
```

A 200 response with `category`/`confidence`/`fields` means it's working.
From here, restart the mobile app (`npx expo start --clear`) — with
`EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` set, scans now route through the
deployed function instead of your local `server/`.

## Updating the functions later

Whenever you change `supabase/functions/identify/index.ts`,
`ocr-receipt/index.ts`, or anything in `_shared/`, redeploy with the same
`supabase functions deploy <name>` command — there's no build step.

## Local testing without deploying (optional)

`supabase functions serve` runs the functions locally against your linked
project (still calls the real Claude API using your local `.env`'s
`ANTHROPIC_API_KEY` if you create a `supabase/.env` file with that value) —
useful for iterating on the function code before deploying.
