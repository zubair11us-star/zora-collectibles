import { db } from "@/db/client";
import { items } from "@/db/schema";
import { or, eq, and } from "drizzle-orm";
import { ItemListRow, listItems } from "@/db/repositories/itemsRepo";

export type BarcodeFormat = "ean13" | "ean8" | "upc_a" | "upc_e" | "code128" | "qr";

export interface BarcodeLookupResult {
  matches: ItemListRow[];
}

/** Local-only lookup against previously-saved items. */
export async function lookupBarcode(code: string): Promise<BarcodeLookupResult> {
  const rows = await db
    .select()
    .from(items)
    .where(and(eq(items.isDeleted, false), or(eq(items.barcode, code), eq(items.qrCode, code))));

  if (rows.length === 0) return { matches: [] };

  const all = await listItems();
  const ids = new Set(rows.map((r) => r.id));
  return { matches: all.filter((i) => ids.has(i.id)) };
}

export interface ExternalBarcodeMatch {
  title: string;
  brand?: string;
  description?: string;
}

/**
 * Best-effort fallback against a free, keyless public UPC database
 * (spec section 18: search an external source when there's no local match).
 * This is rate-limited and unauthenticated by design — treat the result as
 * a suggestion only, never auto-save it. Returns null on any failure
 * (network, rate limit, no match) so callers can fall through to AI/manual
 * entry without special-casing errors.
 */
export async function lookupExternalBarcode(code: string): Promise<ExternalBarcodeMatch | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const data = await response.json();
    const item = data?.items?.[0];
    if (!item?.title) return null;

    return {
      title: item.title,
      brand: item.brand || undefined,
      description: item.description || undefined,
    };
  } catch {
    return null;
  }
}
