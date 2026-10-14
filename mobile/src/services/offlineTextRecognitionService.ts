import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition";

export interface OfflineTextResult {
  ok: boolean;
  text: string;
  lines: string[];
  error?: string;
}

/**
 * On-device OCR via Google ML Kit (no network, no API key, works fully
 * offline). This is the primary text-extraction step for both receipt
 * scanning and collectible identification — regex parsers downstream turn
 * the raw text into structured fields. Never throws; a failure just means
 * "no text found," and callers fall back to manual entry.
 */
export async function recognizeTextOffline(imageUri: string): Promise<OfflineTextResult> {
  try {
    const result = await recognizeText(imageUri);
    const text = result.text ?? "";
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return { ok: true, text, lines };
  } catch (err) {
    return {
      ok: false,
      text: "",
      lines: [],
      error: err instanceof Error ? err.message : "On-device text recognition failed",
    };
  }
}
