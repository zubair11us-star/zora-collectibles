import { CategoryKey } from "@/types/models";
import { getAllSettings } from "@/db/repositories/settingsRepo";
import { getSupabase, isCloudConfigured } from "./supabaseClient";

export interface PossibleMatch {
  summary: string;
  confidence: number; // 0-100
  fields: Record<string, string | number | null>;
}

export interface IdentifyResponse {
  ok: boolean;
  category: CategoryKey;
  confidence: number; // 0-100, top match confidence
  fields: Record<string, string | number | null>;
  possibleMatches: PossibleMatch[];
  rawText?: string;
  error?: string;
  /** "offline" marks a result built from on-device OCR + regex rather than
   * a real cloud AI call — absent/"cloud" means the normal Claude path. */
  source?: "cloud" | "offline";
}

export interface IdentifyImage {
  side: "front" | "back";
  base64Jpeg: string;
}

export interface IdentifyRequest {
  categoryHint?: CategoryKey;
  images: IdentifyImage[];
}

const LOW_CONFIDENCE_THRESHOLD = 70;

export function isLowConfidence(confidence: number): boolean {
  return confidence < LOW_CONFIDENCE_THRESHOLD;
}

/**
 * Sends photo(s) off for identification. Prefers the Supabase Edge Function
 * (works from anywhere, no dev machine required — used once you've deployed
 * it per docs/EDGE_FUNCTIONS_SETUP.md) and falls back to the local Express
 * dev proxy (server/) otherwise. Never throws for network/AI failures — the
 * scan flow always has a manual-entry fallback (spec: AI is an assistant,
 * never a hard requirement), so this returns an `ok: false` result instead.
 */
export async function identifyCollectible(request: IdentifyRequest): Promise<IdentifyResponse> {
  try {
    if (isCloudConfigured) {
      const { data, error } = await getSupabase().functions.invoke("identify", { body: request });
      if (error) throw new Error(error.message);
      return { ok: true, ...(data as Omit<IdentifyResponse, "ok">) };
    }

    const settings = await getAllSettings();
    const url = `${settings.aiServerUrl.replace(/\/$/, "")}/identify`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`AI server responded ${response.status}: ${text}`);
    }

    const data = (await response.json()) as Omit<IdentifyResponse, "ok">;
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      category: request.categoryHint ?? "other",
      confidence: 0,
      fields: {},
      possibleMatches: [],
      error: err instanceof Error ? err.message : "Unknown error contacting AI server",
    };
  }
}
