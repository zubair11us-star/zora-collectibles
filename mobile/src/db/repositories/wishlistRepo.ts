import { asc, eq } from "drizzle-orm";

import { db } from "../client";
import { categories, wishlists } from "../schema";
import { generateId } from "@/utils/id";
import { CategoryKey, ItemCondition, WishlistEntry, WishlistPriority } from "@/types/models";
import { categoryRowByKey } from "./categoriesRepo";

export interface CreateWishlistInput {
  name: string;
  categoryKey?: CategoryKey;
  desiredCondition?: ItemCondition;
  targetPrice?: number;
  targetCurrency?: string;
  priority?: WishlistPriority;
  notes?: string;
}

export async function addWishlistEntry(input: CreateWishlistInput): Promise<string> {
  const id = generateId();
  const categoryId = input.categoryKey ? (await categoryRowByKey(input.categoryKey)).id : null;
  const timestamp = new Date().toISOString();

  await db.insert(wishlists).values({
    id,
    name: input.name,
    categoryId,
    desiredCondition: input.desiredCondition ?? "unspecified",
    targetPrice: input.targetPrice ?? null,
    targetCurrency: input.targetCurrency ?? null,
    priority: input.priority ?? "medium",
    notes: input.notes ?? null,
    linkedItemId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return id;
}

export interface WishlistRow extends WishlistEntry {
  categoryKey: CategoryKey | null;
  categoryName: string | null;
  categoryIcon: string | null;
}

export async function listWishlist(): Promise<WishlistRow[]> {
  const rows = await db
    .select({ wishlist: wishlists, category: categories })
    .from(wishlists)
    .leftJoin(categories, eq(wishlists.categoryId, categories.id))
    .orderBy(asc(wishlists.priority), asc(wishlists.name));

  return rows.map(({ wishlist, category }) => ({
    ...(wishlist as WishlistEntry),
    categoryKey: (category?.key as CategoryKey) ?? null,
    categoryName: category?.name ?? null,
    categoryIcon: category?.icon ?? null,
  }));
}

export async function getWishlistEntryById(id: string): Promise<WishlistRow | null> {
  const row = await db
    .select({ wishlist: wishlists, category: categories })
    .from(wishlists)
    .leftJoin(categories, eq(wishlists.categoryId, categories.id))
    .where(eq(wishlists.id, id));

  if (row.length === 0) return null;
  return {
    ...(row[0].wishlist as WishlistEntry),
    categoryKey: (row[0].category?.key as CategoryKey) ?? null,
    categoryName: row[0].category?.name ?? null,
    categoryIcon: row[0].category?.icon ?? null,
  };
}

export async function updateWishlistEntry(id: string, patch: Partial<CreateWishlistInput>): Promise<void> {
  const updateValues: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (patch.name !== undefined) updateValues.name = patch.name;
  if (patch.desiredCondition !== undefined) updateValues.desiredCondition = patch.desiredCondition;
  if (patch.targetPrice !== undefined) updateValues.targetPrice = patch.targetPrice;
  if (patch.targetCurrency !== undefined) updateValues.targetCurrency = patch.targetCurrency;
  if (patch.priority !== undefined) updateValues.priority = patch.priority;
  if (patch.notes !== undefined) updateValues.notes = patch.notes;
  if (patch.categoryKey !== undefined) {
    updateValues.categoryId = (await categoryRowByKey(patch.categoryKey)).id;
  }

  await db.update(wishlists).set(updateValues).where(eq(wishlists.id, id));
}

export async function deleteWishlistEntry(id: string): Promise<void> {
  await db.delete(wishlists).where(eq(wishlists.id, id));
}

export async function linkWishlistToItem(wishlistId: string, itemId: string): Promise<void> {
  await db.update(wishlists).set({ linkedItemId: itemId }).where(eq(wishlists.id, wishlistId));
}
