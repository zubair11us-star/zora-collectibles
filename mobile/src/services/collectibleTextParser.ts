import { CategoryKey } from "@/types/models";
import { IdentifyResponse } from "./aiIdentification";

// Hardcoded regex extraction of the common fields that are genuinely
// readable as printed text on a collectible (year, card/catalog numbers,
// denominations, serial/barcode numbers). Deliberately scoped to ONLY
// these — things like "illustrator," "mint mark," or "rarity" require
// recognizing what the item actually IS, which needs real visual/semantic
// reasoning (what the cloud AI identification does), not pattern matching
// on extracted text. This is a text-reading tool, not an identification
// tool — the UI should make that distinction clear to the user.

export interface CollectibleTextFields {
  year: number | null;
  cardNumber: string | null;
  denomination: string | null;
  serialNumber: string | null;
}

const CURRENT_YEAR = new Date().getFullYear();

// A 4-digit year, plausible for a collectible (allow a bit into the future
// for pre-release/next-year items).
const YEAR_RE = /\b(1[7-9]\d{2}|20\d{2})\b/;

// Trading-card style numbering: "4/102", "025/198", or set-prefixed like
// "SV01-025" / "SWSH045".
const CARD_NUMBER_SLASH_RE = /\b(\d{1,4}\/\d{1,4})\b/;
const CARD_NUMBER_CODE_RE = /\b([A-Z]{2,5}\d{0,3}[-\s]?\d{2,4})\b/;

// A denomination: currency symbol/word directly touching a number, e.g.
// "$5", "AED 100", "50¢", "5 DOLLARS".
const DENOMINATION_RE = /\b(\$|£|€|¥|AED|USD|PKR|IDR|GBP|EUR|JPY|CNY)\s?(\d+(?:\.\d{1,2})?)\b/i;
const DENOMINATION_WORDS_RE = /\b(\d+)\s?(DOLLARS?|CENTS?|RUPEES?|DIRHAMS?|POUNDS?|EURO?S?)\b/i;

// Barcodes (UPC/EAN, 8-14 digits) or long serial numbers — require word
// boundaries so we don't grab part of a longer run of digits.
const SERIAL_RE = /\b(\d{8,14})\b/;

function firstMatch(re: RegExp, text: string): string | null {
  const m = text.match(re);
  return m ? m[1] : null;
}

/** Extracts whatever common fields can be confidently read from OCR'd
 * text off a collectible. Returns nulls for anything not found — the
 * confirm form shows these as a starting point, same as every other
 * identification source in the app. */
export function parseCollectibleText(text: string): CollectibleTextFields {
  const yearMatch = text.match(YEAR_RE);
  const year = yearMatch ? Number(yearMatch[1]) : null;

  const cardNumber = firstMatch(CARD_NUMBER_SLASH_RE, text) ?? firstMatch(CARD_NUMBER_CODE_RE, text);

  let denomination: string | null = null;
  const symbolMatch = text.match(DENOMINATION_RE);
  if (symbolMatch) {
    denomination = `${symbolMatch[1]}${symbolMatch[2]}`;
  } else {
    const wordMatch = text.match(DENOMINATION_WORDS_RE);
    if (wordMatch) denomination = `${wordMatch[1]} ${wordMatch[2]}`;
  }

  const serialNumber = firstMatch(SERIAL_RE, text);

  return {
    year: year != null && year <= CURRENT_YEAR + 1 ? year : null,
    cardNumber,
    denomination,
    serialNumber,
  };
}

/** Wraps the regex-extracted fields in the same IdentifyResponse shape the
 * cloud AI path returns, so the rest of the scan flow (confirm form,
 * low-confidence banner, etc.) doesn't need to know the difference.
 * Confidence is deliberately 0 — regex pattern matches aren't a real
 * identification, just raw text found on the item, so the existing
 * low-confidence warning banner is the honest thing to show here. */
export function buildOfflineIdentification(categoryHint: CategoryKey | undefined, rawText: string): IdentifyResponse {
  const parsed = parseCollectibleText(rawText);
  const fields: Record<string, string | number | null> = {};
  if (parsed.year != null) fields.year = parsed.year;
  if (parsed.cardNumber != null) fields.cardNumber = parsed.cardNumber;
  if (parsed.denomination != null) fields.denomination = parsed.denomination;
  if (parsed.serialNumber != null) fields.serialNumber = parsed.serialNumber;

  return {
    ok: true,
    category: categoryHint ?? "other",
    confidence: 0,
    fields,
    possibleMatches: [],
    rawText,
    source: "offline",
  };
}
