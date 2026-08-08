import { getAllSettings } from "@/db/repositories/settingsRepo";
import { getSupabase, isCloudConfigured } from "./supabaseClient";

export interface ReceiptLineItem {
  name: string;
  quantity: number | null;
  price: number | null;
}

export interface ReceiptOcrResponse {
  ok: boolean;
  store: string | null;
  date: string | null;
  currency: string | null;
  total: number | null;
  items: ReceiptLineItem[];
  error?: string;
}

/**
 * Prefers the Supabase Edge Function (works from anywhere) and falls back
 * to the local Express dev proxy otherwise — same pattern as
 * aiIdentification.ts. Never throws — network/AI failures return ok:false
 * so the UI can fall back to manual entry.
 */
export async function ocrReceipt(base64Jpeg: string): Promise<ReceiptOcrResponse> {
  try {
    if (isCloudConfigured) {
      const { data, error } = await getSupabase().functions.invoke("ocr-receipt", { body: { base64Jpeg } });
      if (error) throw new Error(error.message);
      return { ok: true, ...(data as Omit<ReceiptOcrResponse, "ok">) };
    }

    const settings = await getAllSettings();
    const url = `${settings.aiServerUrl.replace(/\/$/, "")}/ocr-receipt`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Jpeg }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`AI server responded ${response.status}: ${text}`);
    }

    const data = (await response.json()) as Omit<ReceiptOcrResponse, "ok">;
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      store: null,
      date: null,
      currency: null,
      total: null,
      items: [],
      error: err instanceof Error ? err.message : "Unknown error contacting AI server",
    };
  }
}
