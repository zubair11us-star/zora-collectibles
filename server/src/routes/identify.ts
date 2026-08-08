import { Router } from "express";
import { z } from "zod";

import { identifyWithClaude } from "../services/claudeVision";
import { CATEGORY_KEYS } from "../prompts/categories";

export const identifyRouter = Router();

const requestSchema = z.object({
  categoryHint: z.enum(CATEGORY_KEYS as [string, ...string[]]).optional(),
  images: z
    .array(
      z.object({
        side: z.enum(["front", "back"]),
        base64Jpeg: z.string().min(100, "Image data looks too small to be a real photo"),
      })
    )
    .min(1, "At least one image is required")
    .max(4, "Too many images in one request"),
});

identifyRouter.post("/", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await identifyWithClaude(
      parsed.data.categoryHint as never,
      parsed.data.images
    );
    res.json(result);
  } catch (err) {
    console.error("[identify] failed:", err);
    res.status(502).json({
      error: err instanceof Error ? err.message : "AI identification failed",
    });
  }
});
