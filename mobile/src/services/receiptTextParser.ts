import { ReceiptLineItem, ReceiptOcrResponse } from "./receiptOcrService";

// Hardcoded regex patterns for pulling structured fields out of raw OCR
// text from a receipt. Deliberately simple/heuristic — this trades some
// accuracy for being instant, free, and fully offline. The caller always
// shows these as editable fields for the user to correct, same as the
// cloud OCR path.

const CURRENCY_SYMBOL_MAP: { pattern: RegExp; code: string }[] = [
  { pattern: /AED|Dhs\.?|د\.إ/i, code: "AED" },
  { pattern: /Rs\.?|₨|PKR/i, code: "PKR" },
  { pattern: /Rp\.?|IDR/i, code: "IDR" },
  { pattern: /£|GBP/i, code: "GBP" },
  { pattern: /€|EUR/i, code: "EUR" },
  { pattern: /¥|CNY|RMB/i, code: "CNY" },
  { pattern: /JPY/i, code: "JPY" },
  { pattern: /\$|USD/i, code: "USD" },
];

// A money amount: optional currency symbol/code, digits with optional
// thousands separators, optional decimal part.
const MONEY_RE = /(?:[$£€¥]|AED|Rs\.?|Rp\.?|USD|PKR|IDR|GBP|EUR|JPY|CNY)?\s*(\d{1,3}(?:[,.]\d{3})*(?:\.\d{1,2})?)\b/;

const TOTAL_LABEL_RE = /\b(grand\s*total|total\s*due|amount\s*due|total)\b(?!.*\bsub)/i;
const SUBTOTAL_LABEL_RE = /\bsub[\s-]?total\b/i;
const TAX_LABEL_RE = /\b(tax|vat|gst)\b/i;

// Dates: YYYY-MM-DD, DD/MM/YYYY or MM/DD/YYYY, and "5 Jan 2024" / "Jan 5, 2024".
const DATE_ISO_RE = /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/;
const DATE_SLASH_RE = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/;
const MONTH_NAMES = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
const DATE_TEXT_RE = new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_NAMES})[a-z]*\\s+(\\d{2,4})\\b`, "i");
const DATE_TEXT_RE2 = new RegExp(`\\b(${MONTH_NAMES})[a-z]*\\s+(\\d{1,2}),?\\s+(\\d{2,4})\\b`, "i");

function parseMoney(raw: string): number | null {
  const match = raw.match(MONEY_RE);
  if (!match) return null;
  const n = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function detectCurrency(text: string): string | null {
  for (const { pattern, code } of CURRENCY_SYMBOL_MAP) {
    if (pattern.test(text)) return code;
  }
  return null;
}

function monthToNumber(abbrev: string): string {
  const idx = MONTH_NAMES.split("|").indexOf(abbrev.slice(0, 3).toLowerCase());
  return String(idx + 1).padStart(2, "0");
}

function detectDate(text: string): string | null {
  const iso = text.match(DATE_ISO_RE);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;

  const textDate = text.match(DATE_TEXT_RE);
  if (textDate) {
    const year = textDate[3].length === 2 ? `20${textDate[3]}` : textDate[3];
    return `${year}-${monthToNumber(textDate[2])}-${textDate[1].padStart(2, "0")}`;
  }
  const textDate2 = text.match(DATE_TEXT_RE2);
  if (textDate2) {
    const year = textDate2[3].length === 2 ? `20${textDate2[3]}` : textDate2[3];
    return `${year}-${monthToNumber(textDate2[1])}-${textDate2[2].padStart(2, "0")}`;
  }

  const slash = text.match(DATE_SLASH_RE);
  if (slash) {
    // Ambiguous DD/MM vs MM/DD — assume DD/MM (most of the world) unless
    // the first number is >12, in which case it must be the day either way.
    const [, a, b, y] = slash;
    const year = y.length === 2 ? `20${y}` : y;
    const first = Number(a);
    const second = Number(b);
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : second;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

function detectStore(lines: string[]): string | null {
  // Heuristic: the first line that's mostly letters, reasonably short (not
  // a paragraph), and isn't obviously a phone number / address / date.
  for (const line of lines.slice(0, 5)) {
    if (line.length < 2 || line.length > 40) continue;
    if (/\d{3,}/.test(line)) continue; // phone numbers, addresses, receipt IDs
    if (DATE_ISO_RE.test(line) || DATE_SLASH_RE.test(line)) continue;
    const letters = (line.match(/[a-zA-Z]/g) ?? []).length;
    if (letters < line.length * 0.5) continue;
    return line;
  }
  return null;
}

function detectTotal(lines: string[]): number | null {
  // Prefer an explicit "Total"/"Grand Total"/"Amount Due" line over
  // "Subtotal" — scan from the bottom up since totals are usually last.
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (SUBTOTAL_LABEL_RE.test(line) || TAX_LABEL_RE.test(line)) continue;
    if (TOTAL_LABEL_RE.test(line)) {
      const amount = parseMoney(line);
      if (amount != null) return amount;
      // Amount might be on the next line instead of the same one.
      if (i + 1 < lines.length) {
        const next = parseMoney(lines[i + 1]);
        if (next != null) return next;
      }
    }
  }
  // Fallback: the largest money-looking number anywhere in the receipt,
  // which is very often the total on a simple receipt layout.
  let best: number | null = null;
  for (const line of lines) {
    const amount = parseMoney(line);
    if (amount != null && (best == null || amount > best)) best = amount;
  }
  return best;
}

function detectLineItems(lines: string[]): ReceiptLineItem[] {
  const items: ReceiptLineItem[] = [];
  for (const line of lines) {
    if (TOTAL_LABEL_RE.test(line) || SUBTOTAL_LABEL_RE.test(line) || TAX_LABEL_RE.test(line)) continue;
    // A date line (e.g. "Date: 2026-03-15") isn't a line item — without this,
    // the trailing "15" or similar reads as a price via MONEY_RE.
    if (DATE_ISO_RE.test(line) || DATE_SLASH_RE.test(line) || DATE_TEXT_RE.test(line) || DATE_TEXT_RE2.test(line)) continue;
    const priceMatch = line.match(MONEY_RE);
    if (!priceMatch) continue;
    // A plausible line item: has a price AND some letters before it
    // (distinguishes "Milk 4.50" from a bare phone number or date line).
    const namePart = line.slice(0, priceMatch.index).trim();
    if (namePart.length < 2 || !/[a-zA-Z]/.test(namePart)) continue;
    const price = parseMoney(line);
    items.push({ name: namePart.replace(/[.\s]+$/, ""), quantity: null, price });
  }
  return items;
}

/** Turns raw OCR text into the same shape the cloud receipt-OCR endpoint
 * returns, using hardcoded regex heuristics instead of an LLM. Always
 * succeeds (ok: true) — fields that couldn't be confidently found are
 * left null for the user to fill in themselves. */
export function parseReceiptText(text: string, lines: string[]): ReceiptOcrResponse {
  return {
    ok: true,
    store: detectStore(lines),
    date: detectDate(text),
    currency: detectCurrency(text),
    total: detectTotal(lines),
    items: detectLineItems(lines),
  };
}
