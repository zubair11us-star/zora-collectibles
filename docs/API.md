# Zura — API Reference

## Phase 1: `server/` (AI proxy only)

Phase 1 has no data backend — the mobile app talks directly to its local
SQLite database. `server/` exposes exactly two HTTP endpoints.

### `GET /health`

Liveness check. No auth, no body.

```json
{ "ok": true, "service": "zora-ai-proxy" }
```

### `POST /identify`

Identifies a collectible from one or more photos.

**Request**

```json
{
  "categoryHint": "pokemon",          // optional — one of the CategoryKey values, omit to let the AI guess
  "images": [
    { "side": "front", "base64Jpeg": "<base64-encoded JPEG, no data: prefix>" },
    { "side": "back",  "base64Jpeg": "<...>" }
  ]
}
```

`images` requires 1–4 entries. `categoryHint`, when present, must be one of:
`currency, coins, pokemon, hotwheels, tradingcards, stamps, toys, diecast,
watches, medals, souvenirs, other`.

**Response — 200**

```json
{
  "category": "pokemon",
  "confidence": 92,
  "fields": {
    "name": "Pikachu",
    "setName": "Base Set",
    "cardNumber": "58/102",
    "year": 1999,
    "rarity": "Common",
    "condition": "near_mint"
  },
  "possibleMatches": [
    { "summary": "Pikachu — Base Set 58/102", "confidence": 92, "fields": { "...": "..." } },
    { "summary": "Pikachu — Jungle Set", "confidence": 6, "fields": { "...": "..." } }
  ],
  "rawText": "<the raw model output, for debugging>"
}
```

**Response — 400** (validation failure) or **502** (Claude call / parsing
failure): `{ "error": "..." }`. The mobile client never treats this as fatal
— it falls back to manual entry (see `mobile/src/services/aiIdentification.ts`).

The field keys returned in `fields`/`possibleMatches[].fields` match
`CATEGORY_FIELD_KEYS` + common fields in `server/src/prompts/categories.ts`,
which mirrors `mobile/src/types/categoryFields.ts`.

---

## Phase 3 (planned): full backend REST API

Once cloud sync/accounts ship (Phase 3), `server/` grows from a stateless AI
proxy into the full backend implied by the original spec, backed by
Postgres instead of on-device SQLite:

```
POST   /items
GET    /items
GET    /items/:id
PUT    /items/:id
DELETE /items/:id
POST   /photos
POST   /transactions
GET    /analytics
POST   /sync
POST   /backup
```

All of these will require authenticated requests (Phase 3 adds email/Google/
Apple sign-in) and per-user data isolation. `/identify` stays as-is.
