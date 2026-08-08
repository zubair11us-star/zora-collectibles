// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "../_shared/cors.ts";
import { buildIdentificationPrompt } from "../_shared/buildPrompt.ts";
import { callClaudeVision, extractJson } from "../_shared/anthropicClient.ts";
import { CATEGORY_KEYS, CategoryKey } from "../_shared/categories.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clampConfidence(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const categoryHint: CategoryKey | undefined =
    typeof payload.categoryHint === "string" && (CATEGORY_KEYS as string[]).includes(payload.categoryHint)
      ? payload.categoryHint
      : undefined;
  const images = Array.isArray(payload.images) ? payload.images : [];

  if (images.length === 0 || images.length > 4) {
    return jsonResponse({ error: "images must contain 1-4 entries" }, 400);
  }
  for (const img of images) {
    if (typeof img.base64Jpeg !== "string" || img.base64Jpeg.length < 100) {
      return jsonResponse({ error: "Each image needs a base64Jpeg string" }, 400);
    }
  }

  try {
    const prompt = buildIdentificationPrompt(categoryHint, images.length);
    const rawText = await callClaudeVision(
      prompt,
      images.map((img: any) => ({ base64Jpeg: img.base64Jpeg }))
    );

    let parsed: any;
    try {
      parsed = extractJson(rawText);
    } catch (err) {
      throw new Error(`Couldn't parse AI response as JSON: ${err instanceof Error ? err.message : String(err)}`);
    }

    const category: CategoryKey = parsed.category ?? categoryHint ?? "other";
    const fields: Record<string, string | number | null> = parsed.fields ?? {};
    const possibleMatches = Array.isArray(parsed.possibleMatches)
      ? parsed.possibleMatches.map((m: any) => ({
          summary: String(m.summary ?? "Possible match"),
          confidence: clampConfidence(m.confidence),
          fields: m.fields ?? {},
        }))
      : [];

    return jsonResponse({
      category,
      confidence: clampConfidence(parsed.confidence),
      fields,
      possibleMatches,
      rawText,
    });
  } catch (err) {
    console.error("[identify] failed:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "AI identification failed" }, 502);
  }
});
