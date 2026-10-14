// Thin wrapper around Google's Programmable Search Engine (Custom Search
// JSON API). Returns raw search results (title/snippet/link) — we never
// synthesize or guess a price server-side; the app shows these as
// reference links for the user to review themselves, same "assistive,
// human reviews everything" philosophy as AI identification.
//
// Needs two env vars, both set up by the user at
// https://console.cloud.google.com/ (API key, Custom Search API enabled)
// and https://programmablesearchengine.google.com/ (search engine ID / cx):
//   GOOGLE_API_KEY
//   GOOGLE_SEARCH_ENGINE_ID

export interface GoogleSearchResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
  thumbnailUrl?: string;
}

export interface GoogleSearchResponse {
  results: GoogleSearchResult[];
  searchQuery: string;
}

function getCredentials(): { apiKey: string; cx: string } {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !cx) {
    throw new Error(
      "Google Search is not configured. Set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in server/.env (see docs/GOOGLE_SEARCH_SETUP.md)."
    );
  }
  return { apiKey, cx };
}

export async function searchGoogle(query: string, count = 8): Promise<GoogleSearchResponse> {
  const { apiKey, cx } = getCredentials();

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(Math.min(Math.max(count, 1), 10)));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(url.toString(), { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google Search API responded ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    items?: Array<{
      title?: string;
      snippet?: string;
      link?: string;
      displayLink?: string;
      pagemap?: { cse_thumbnail?: Array<{ src?: string }> };
    }>;
  };

  const results: GoogleSearchResult[] = (data.items ?? []).map((item) => ({
    title: item.title ?? "Untitled",
    snippet: item.snippet ?? "",
    link: item.link ?? "",
    displayLink: item.displayLink ?? "",
    thumbnailUrl: item.pagemap?.cse_thumbnail?.[0]?.src,
  }));

  return { results, searchQuery: query };
}
