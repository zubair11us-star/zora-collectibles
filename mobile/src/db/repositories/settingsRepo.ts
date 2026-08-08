import { eq } from "drizzle-orm";

import { db } from "../client";
import { settings } from "../schema";
import { Settings } from "@/types/models";

export async function getAllSettings(): Promise<Settings> {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;

  return {
    name: map.name ?? "Collector",
    baseCurrency: map.baseCurrency ?? "AED",
    theme: (map.theme as Settings["theme"]) ?? "system",
    aiServerUrl: map.aiServerUrl ?? "http://localhost:4000",
  };
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.query.settings.findFirst({
    where: (s, { eq: eqOp }) => eqOp(s.key, key),
  });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.query.settings.findFirst({
    where: (s, { eq: eqOp }) => eqOp(s.key, key),
  });
  if (existing) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}
