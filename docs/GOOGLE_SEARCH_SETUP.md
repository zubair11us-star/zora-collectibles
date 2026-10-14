# Setting Up Reference Price Lookup (Google Search)

This powers the **"Look Up Reference Price"** button on the item edit
screen — it searches Google for listings/articles about an item and shows
them as plain links for you to review yourself. It never writes a number
into the item automatically; you're always the one reading the result and
deciding what to enter.

Like the Anthropic API key, this is a credential — you set it up and enter
it yourself; I don't handle it.

## 1. Create a Google Cloud API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and
   create a project (or use an existing one).
2. Enable the **Custom Search API**: APIs & Services → Library → search
   "Custom Search API" → Enable.
3. Create credentials: APIs & Services → Credentials → Create Credentials
   → API key. Copy it.

## 2. Create a Programmable Search Engine

1. Go to [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)
   → Add a search engine.
2. Set it to search the **entire web** (not specific sites).
3. Once created, go to its settings and copy the **Search engine ID**
   (this is the `cx` value).

## 3. Add both to `server/.env`

```bash
GOOGLE_API_KEY=your-key-here
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id-here
```

Restart the server (`npm run dev` in `server/`) after saving.

## 4. Pricing / limits

Google's free tier is **100 search queries per day**, shared across
whatever else uses this API key. Beyond that it's pay-per-query (check
Google's current pricing — it changes). For personal use (looking up a
handful of items as you catalog them) the free tier is normally enough.
If you hit the limit, "Look Up Reference Price" will show an error until
it resets the next day.

## 5. Test it

```bash
curl -s -X POST http://localhost:4000/lookup-price \
  -H "Content-Type: application/json" \
  -d '{"name":"1952 Topps Mickey Mantle","categoryName":"Trading Cards"}'
```

A response with a `results` array of `{title, snippet, link}` objects
means it's working. In the app, the AI Server URL in Settings must point
to this server (your PC's LAN IP, not `localhost`, when testing on a
physical phone) for the button to reach it.
