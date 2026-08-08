import { callClaudeVision, extractJson } from "./anthropicClient";

export interface ReceiptLineItem {
  name: string;
  quantity: number | null;
  price: number | null;
}

export interface ReceiptOcrResult {
  store: string | null;
  date: string | null;
  currency: string | null;
  total: number | null;
  items: ReceiptLineItem[];
  rawText: string;
}

const RECEIPT_PROMPT = `You are a receipt OCR assistant embedded in a personal collectibles inventory app called Zora. You will be shown a photo of a purchase receipt. Extract the following as strict JSON, with no markdown fences and no commentary:

{
  "store": "<store/seller name, or null>",
  "date": "<purchase date in YYYY-MM-DD format, or null if unreadable>",
  "currency": "<3-letter currency code if identifiable (e.g. USD, AED, PKR), or null>",
  "total": <total amount paid as a number, or null>,
  "items": [
    { "name": "<line item description>", "quantity": <number or null>, "price": <number or null> }
  ]
}

Rules:
- If the receipt is blurry or a field is not legible, use null rather than guessing.
- "items" should list every distinct line item you can read, in the order printed. Use an empty array if none are legible.
- Numbers must be plain numbers (no currency symbols or commas).
- This is an assistive extraction only — the user will review and correct every field, so prefer null over a confident-looking wrong guess.`;

export async function ocrReceipt(base64Jpeg: string): Promise<ReceiptOcrResult> {
  const rawText = await callClaudeVision(RECEIPT_PROMPT, [{ base64Jpeg }]);

  let parsed: any;
  try {
    parsed = extractJson(rawText);
  } catch (err) {
    throw new Error(`Couldn't parse receipt OCR response as JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  const items: ReceiptLineItem[] = Array.isArray(parsed.items)
    ? parsed.items.map((i: any) => ({
        name: String(i.name ?? "Item"),
        quantity: i.quantity != null ? Number(i.quantity) : null,
        price: i.price != null ? Number(i.price) : null,
      }))
    : [];

  return {
    store: parsed.store ?? null,
    date: parsed.date ?? null,
    currency: parsed.currency ?? null,
    total: parsed.total != null ? Number(parsed.total) : null,
    items,
    rawText,
  };
}
