import { db } from "../client";
import { aiIdentifications } from "../schema";
import { generateId } from "@/utils/id";
import { CategoryKey } from "@/types/models";
import type { IdentifyResponse } from "@/services/aiIdentification";

export async function recordIdentification(
  categoryGuess: CategoryKey | null,
  response: IdentifyResponse,
  itemId?: string
): Promise<string> {
  const id = generateId();
  await db.insert(aiIdentifications).values({
    id,
    itemId: itemId ?? null,
    categoryGuess,
    rawResponseJson: JSON.stringify(response),
    confidence: response.confidence,
    possibleMatchesJson: JSON.stringify(response.possibleMatches ?? []),
    createdAt: new Date().toISOString(),
  });
  return id;
}
