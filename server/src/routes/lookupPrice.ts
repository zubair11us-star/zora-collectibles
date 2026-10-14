import { Router } from "express";
import { z } from "zod";

import { searchGoogle } from "../services/googleSearch";

export const lookupPriceRouter = Router();

const requestSchema = z.object({
  name: z.string().min(1, "name is required"),
  categoryName: z.string().optional(),
  year: z.number().optional(),
  setName: z.string().optional(),
  country: z.string().optional(),
  grade: z.string().optional(),
});

function buildQuery(input: z.infer<typeof requestSchema>): string {
  // Order matters for relevance: the most identifying details first, generic
  // "price value" keywords last so Google weights the specific item highest.
  const parts = [
    input.name,
    input.year ? String(input.year) : undefined,
    input.setName,
    input.country,
    input.categoryName,
    input.grade,
    "price value",
  ].filter((p): p is string => Boolean(p && p.trim()));
  return parts.join(" ");
}

lookupPriceRouter.post("/", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const query = buildQuery(parsed.data);

  try {
    const result = await searchGoogle(query);
    res.json(result);
  } catch (err) {
    console.error("[lookup-price] failed:", err);
    res.status(502).json({
      error: err instanceof Error ? err.message : "Price lookup failed",
    });
  }
});
