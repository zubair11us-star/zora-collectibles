import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { exchangeRates } from "@/db/schema";
import { convertAmount, formatMoney } from "@/utils/currency";
import { getAllSettings } from "@/db/repositories/settingsRepo";

export async function getExchangeRates(): Promise<Record<string, number>> {
  const rows = await db.select().from(exchangeRates);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.currencyCode] = r.rateToBase;
  return map;
}

export async function setExchangeRate(currencyCode: string, rateToBase: number): Promise<void> {
  const existing = await db.query.exchangeRates.findFirst({
    where: (r, { eq }) => eq(r.currencyCode, currencyCode),
  });
  if (existing) {
    await db
      .update(exchangeRates)
      .set({ rateToBase, updatedAt: new Date().toISOString() })
      .where(eq(exchangeRates.currencyCode, currencyCode));
  } else {
    await db.insert(exchangeRates).values({
      currencyCode,
      rateToBase,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function convertToBase(amount: number, fromCurrency: string): Promise<number> {
  const settings = await getAllSettings();
  const rates = await getExchangeRates();
  return convertAmount(amount, fromCurrency, settings.baseCurrency, rates, settings.baseCurrency);
}

export { formatMoney };
