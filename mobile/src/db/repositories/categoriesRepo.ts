import { asc } from "drizzle-orm";

import { db } from "../client";
import { categories } from "../schema";
import { Category, CategoryKey } from "@/types/models";

export async function listCategories(): Promise<Category[]> {
  return (await db.select().from(categories).orderBy(asc(categories.sortOrder))) as Category[];
}

export async function categoryRowByKey(key: CategoryKey): Promise<Category> {
  const row = await db.query.categories.findFirst({
    where: (c, { eq: eqOp }) => eqOp(c.key, key),
  });
  if (!row) throw new Error(`Unknown category: ${key}`);
  return row as Category;
}
