import { Router } from "express";
import { z } from "zod";

import { ocrReceipt } from "../services/receiptOcr";

export const ocrReceiptRouter = Router();

const requestSchema = z.object({
  base64Jpeg: z.string().min(100, "Image data looks too small to be a real photo"),
});

ocrReceiptRouter.post("/", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await ocrReceipt(parsed.data.base64Jpeg);
    res.json(result);
  } catch (err) {
    console.error("[ocr-receipt] failed:", err);
    res.status(502).json({
      error: err instanceof Error ? err.message : "Receipt OCR failed",
    });
  }
});
