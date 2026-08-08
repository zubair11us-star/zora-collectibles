import { asc, eq } from "drizzle-orm";

import { db } from "../client";
import { items, valuations } from "../schema";
import { generateId } from "@/utils/id";
import { IdentificationSource, Valuation } from "@/types/models";

export interface AddValuationInput {
  itemId: string;
  date?: string;
  value: number;
  currency: string;
  source?: IdentificationSource;
  notes?: string;
  updateItemCurrentValue?: boolean;
}

export async function addValuation(input: AddValuationInput): Promise<string> {
  const id = generateId();
  const date = input.date ?? new Date().toISOString();
  await db.insert(valuations).values({
    id,
    itemId: input.itemId,
    date,
    value: input.value,
    currency: input.currency,
    source: input.source ?? "manual",
    notes: input.notes ?? null,
    updatedAt: new Date().toISOString(),
  });

  if (input.updateItemCurrentValue !== false) {
    await db
      .update(items)
      .set({
        currentValue: input.value,
        currentValueCurrency: input.currency,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(items.id, input.itemId));
  }

  return id;
}

export async function listValuationsByItem(itemId: string): Promise<Valuation[]> {
  return (await db
    .select()
    .from(valuations)
    .where(eq(valuations.itemId, itemId))
    .orderBy(asc(valuations.date))) as Valuation[];
}
