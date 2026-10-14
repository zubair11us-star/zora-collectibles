import { getAllSettings } from "@/db/repositories/settingsRepo";

export interface PriceLookupResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
  thumbnailUrl?: string;
}

export interface PriceLookupResponse {
  ok: boolean;
  results: PriceLookupResult[];
  searchQuery: string;
  error?: string;
}

export interface PriceLookupRequest {
  name: string;
  categoryName?: string;
  year?: number;
  setName?: string;
  country?: string;
  grade?: string;
}

/**
 * Searches Google for reference pricing/listings for an item — purely
 * informational, same "assistive, never auto-applied" pattern as AI
 * identification. Returns raw search results (title/snippet/link) for the
 * user to review and open themselves; nothing here writes to the item or
 * guesses a number. Routes through the local server/ proxy only (no
 * Supabase Edge Function path yet, since this app isn't using Supabase
 * right now) — the key stays server-side, same as the AI identification
 * and receipt OCR proxies.
 */
export async function lookupReferencePrice(request: PriceLookupRequest): Promise<PriceLookupResponse> {
  try {
    const settings = await getAllSettings();
    const url = `${settings.aiServerUrl.replace(/\/$/, "")}/lookup-price`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Server responded ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { results: PriceLookupResult[]; searchQuery: string };
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      results: [],
      searchQuery: "",
      error: err instanceof Error ? err.message : "Unknown error contacting server",
    };
  }
}
