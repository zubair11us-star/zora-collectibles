import TextRecognition from "@react-native-ml-kit/text-recognition";

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
 *
 * Uses @react-native-ml-kit/text-recognition (plain RN autolinking, no
 * Expo Modules API) rather than an Expo-native-module wrapper — an
 * earlier attempt with an Expo-module-based package bundled its own
 * nested expo-image built for a newer Expo SDK than this project targets,
 * causing a NoClassDefFoundError (AnyTypeCache) crash at app startup.
 */
export async function recognizeTextOffline(imageUri: string): Promise<OfflineTextResult> {
  try {
    const result = await TextRecognition.recognize(imageUri);
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
