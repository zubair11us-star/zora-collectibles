import { buildIdentificationPrompt } from "../prompts/buildPrompt";
import { CategoryKey } from "../prompts/categories";
import { callClaudeVision, extractJson } from "./anthropicClient";

export interface IdentifyImageInput {
  side: "front" | "back";
  base64Jpeg: string;
}

export interface PossibleMatch {
  summary: string;
  confidence: number;
  fields: Record<string, string | number | null>;
}

export interface IdentificationResult {
  category: CategoryKey;
  confidence: number;
  fields: Record<string, string | number | null>;
  possibleMatches: PossibleMatch[];
  rawText: string;
}

function clampConfidence(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function identifyWithClaude(
  categoryHint: CategoryKey | undefined,
  images: IdentifyImageInput[]
): Promise<IdentificationResult> {
  const prompt = buildIdentificationPrompt(categoryHint, images.length);
  const rawText = await callClaudeVision(prompt, images);

  let parsed: any;
  try {
    parsed = extractJson(rawText);
  } catch (err) {
    throw new Error(
      `Couldn't parse AI response as JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const category: CategoryKey = parsed.category ?? categoryHint ?? "other";
  const fields: Record<string, string | number | null> = parsed.fields ?? {};
  const possibleMatches: PossibleMatch[] = Array.isArray(parsed.possibleMatches)
    ? parsed.possibleMatches.map((m: any) => ({
        summary: String(m.summary ?? "Possible match"),
        confidence: clampConfidence(m.confidence),
        fields: m.fields ?? {},
      }))
    : [];

  return {
    category,
    confidence: clampConfidence(parsed.confidence),
    fields,
    possibleMatches,
    rawText,
  };
}
