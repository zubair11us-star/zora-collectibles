import { and, desc, asc, eq, gte, lte, like, or, sql } from "drizzle-orm";

import { db } from "../client";
import { categories, itemAttributes, items, photos, valuations } from "../schema";
import { generateId } from "@/utils/id";
import { categoryRowByKey } from "./categoriesRepo";
import {
  Category,
  CategoryKey,
  Item,
  ItemCondition,
  ItemWithDetails,
  Photo,
  SaleStatus,
} from "@/types/models";

export interface ItemListFilter {
  categoryKey?: CategoryKey;
  country?: string;
  year?: number;
  condition?: ItemCondition;
  minValue?: number;
  maxValue?: number;
  locationId?: string;
  searchText?: string;
  missingPhotos?: boolean;
  missingInfo?: boolean;
  forSaleOnly?: boolean;
  recentlyAddedSinceIso?: string;
}

export type ItemSortField =
  | "name"
  | "createdAt"
  | "currentValue"
  | "purchasePrice"
  | "year";

export interface ItemListOptions {
  filter?: ItemListFilter;
  sortField?: ItemSortField;
  sortDir?: "asc" | "desc";
}

export interface ItemListRow extends Item {
  category: Category;
  coverPhotoPath: string | null;
  coverPhotoCloudUrl: string | null;
  photoCount: number;
}

export interface CreateItemInput {
  categoryKey: CategoryKey;
  name: string;
  description?: string;
  subcategory?: string;
  brand?: string;
  country?: string;
  manufacturer?: string;
  year?: number;
  series?: string;
  setName?: string;
  model?: string;
  catalogNumber?: string;
  cardNumber?: string;
  denomination?: string;
  currency?: string;
  serialNumber?: string;
  condition?: ItemCondition;
  grade?: string;
  quantity?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  currentValue?: number;
  currentValueCurrency?: string;
  sellingPrice?: number;
  saleStatus?: SaleStatus;
  locationId?: string | null;
  storageBoxId?: string | null;
  storagePosition?: string | null;
  barcode?: string;
  qrCode?: string;
  identificationSource?: Item["identificationSource"];
  aiConfidence?: number;
  notes?: string;
  isDemo?: boolean;
  attributes?: Record<string, string>;
}

const nowIso = () => new Date().toISOString();

export async function createItem(input: CreateItemInput): Promise<string> {
  const category = await categoryRowByKey(input.categoryKey);
  const id = generateId();
  const timestamp = nowIso();

  await db.insert(items).values({
    id,
    categoryId: category.id,
    subcategory: input.subcategory ?? null,
    name: input.name,
    description: input.description ?? null,
    brand: input.brand ?? null,
    country: input.country ?? null,
    manufacturer: input.manufacturer ?? null,
    year: input.year ?? null,
    series: input.series ?? null,
    setName: input.setName ?? null,
    model: input.model ?? null,
    catalogNumber: input.catalogNumber ?? null,
    cardNumber: input.cardNumber ?? null,
    denomination: input.denomination ?? null,
    currency: input.currency ?? null,
    serialNumber: input.serialNumber ?? null,
    condition: input.condition ?? "unspecified",
    grade: input.grade ?? null,
    quantity: input.quantity ?? 1,
    purchaseDate: input.purchaseDate ?? null,
    purchasePrice: input.purchasePrice ?? null,
    purchaseCurrency: input.purchaseCurrency ?? null,
    currentValue: input.currentValue ?? null,
    currentValueCurrency: input.currentValueCurrency ?? null,
    sellingPrice: input.sellingPrice ?? null,
    locationId: input.locationId ?? null,
    storageBoxId: input.storageBoxId ?? null,
    storagePosition: input.storagePosition ?? null,
    barcode: input.barcode ?? null,
    qrCode: input.qrCode ?? null,
    identificationSource: input.identificationSource ?? "manual",
    aiConfidence: input.aiConfidence ?? null,
    saleStatus: input.saleStatus ?? "not_for_sale",
    notes: input.notes ?? null,
    isDemo: input.isDemo ?? false,
    isDeleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  if (input.attributes) {
    await setItemAttributes(id, input.attributes);
  }

  if (input.currentValue != null) {
    await db.insert(valuations).values({
      id: generateId(),
      itemId: id,
      date: timestamp,
      value: input.currentValue,
      currency: input.currentValueCurrency ?? input.currency ?? "AED",
      source: input.identificationSource ?? "manual",
      notes: "Initial value at time of adding to collection",
    });
  }

  return id;
}

export async function updateItem(
  id: string,
  patch: Partial<CreateItemInput>
): Promise<void> {
  const updateValues: Record<string, unknown> = { updatedAt: nowIso() };

  const directFields: (keyof CreateItemInput)[] = [
    "subcategory",
    "name",
    "description",
    "brand",
    "country",
    "manufacturer",
    "year",
    "series",
    "setName",
    "model",
    "catalogNumber",
    "cardNumber",
    "denomination",
    "currency",
    "serialNumber",
    "condition",
    "grade",
    "quantity",
    "purchaseDate",
    "purchasePrice",
    "purchaseCurrency",
    "currentValue",
    "currentValueCurrency",
    "sellingPrice",
    "saleStatus",
    "locationId",
    "storageBoxId",
    "storagePosition",
    "barcode",
    "qrCode",
    "notes",
  ];
  for (const field of directFields) {
    if (field in patch) updateValues[field] = patch[field];
  }

  if (patch.categoryKey) {
    const category = await categoryRowByKey(patch.categoryKey);
    updateValues.categoryId = category.id;
  }

  await db.update(items).set(updateValues).where(eq(items.id, id));

  if (patch.attributes) {
    await setItemAttributes(id, patch.attributes);
  }
}

export async function setItemAttributes(
  itemId: string,
  attributes: Record<string, string>
): Promise<void> {
  await db.delete(itemAttributes).where(eq(itemAttributes.itemId, itemId));
  const entries = Object.entries(attributes).filter(([, v]) => v != null && v !== "");
  for (const [key, value] of entries) {
    await db.insert(itemAttributes).values({ id: generateId(), itemId, key, value });
  }
}

export async function softDeleteItem(id: string): Promise<void> {
  await db.update(items).set({ isDeleted: true, updatedAt: nowIso() }).where(eq(items.id, id));
}

export async function getItemWithDetails(id: string): Promise<ItemWithDetails | null> {
  const item = await db.query.items.findFirst({ where: (i, { eq: eqOp }) => eqOp(i.id, id) });
  if (!item) return null;

  const category = await db.query.categories.findFirst({
    where: (c, { eq: eqOp }) => eqOp(c.id, item.categoryId),
  });
  const attrRows = await db
    .select()
    .from(itemAttributes)
    .where(eq(itemAttributes.itemId, id));
  const photoRows = await db
    .select()
    .from(photos)
    .where(eq(photos.itemId, id))
    .orderBy(asc(photos.createdAt));
  const valuationRows = await db
    .select()
    .from(valuations)
    .where(eq(valuations.itemId, id))
    .orderBy(asc(valuations.date));

  const attributes: Record<string, string> = {};
  for (const row of attrRows) attributes[row.key] = row.value;

  return {
    ...(item as Item),
    category: category as Category,
    attributes,
    photos: photoRows as Photo[],
    valuations: valuationRows as ItemWithDetails["valuations"],
  };
}

export async function listItems(options: ItemListOptions = {}): Promise<ItemListRow[]> {
  const { filter = {}, sortField = "createdAt", sortDir = "desc" } = options;

  const conditions = [eq(items.isDeleted, false)];

  if (filter.categoryKey) {
    const category = await categoryRowByKey(filter.categoryKey);
    conditions.push(eq(items.categoryId, category.id));
  }
  if (filter.country) conditions.push(eq(items.country, filter.country));
  if (filter.year) conditions.push(eq(items.year, filter.year));
  if (filter.condition) conditions.push(eq(items.condition, filter.condition));
  if (filter.locationId) conditions.push(eq(items.locationId, filter.locationId));
  if (filter.minValue != null) conditions.push(gte(items.currentValue, filter.minValue));
  if (filter.maxValue != null) conditions.push(lte(items.currentValue, filter.maxValue));
  if (filter.recentlyAddedSinceIso)
    conditions.push(gte(items.createdAt, filter.recentlyAddedSinceIso));
  if (filter.forSaleOnly) conditions.push(sql`${items.saleStatus} != 'not_for_sale'`);
  if (filter.searchText) {
    const term = `%${filter.searchText.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${items.name})`, term),
        like(sql`lower(${items.country})`, term),
        like(sql`lower(${items.brand})`, term),
        like(sql`lower(${items.series})`, term),
        like(sql`lower(${items.setName})`, term),
        like(sql`lower(${items.model})`, term),
        like(sql`lower(${items.cardNumber})`, term),
        like(sql`lower(${items.catalogNumber})`, term),
        like(sql`lower(${items.barcode})`, term),
        like(sql`lower(${items.serialNumber})`, term),
        like(sql`lower(${items.storagePosition})`, term)
      )!
    );
  }

  const sortColumn = {
    name: items.name,
    createdAt: items.createdAt,
    currentValue: items.currentValue,
    purchasePrice: items.purchasePrice,
    year: items.year,
  }[sortField];

  const rows = await db
    .select({ item: items, category: categories })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(sortDir === "asc" ? asc(sortColumn) : desc(sortColumn));

  const itemIds = rows.map((r) => r.item.id);
  const coverByItem = new Map<string, { path: string; cloudUrl: string | null; count: number }>();
  if (itemIds.length > 0) {
    const allPhotos = await db.select().from(photos);
    for (const photo of allPhotos) {
      if (!itemIds.includes(photo.itemId)) continue;
      const existing = coverByItem.get(photo.itemId);
      if (!existing) {
        coverByItem.set(photo.itemId, { path: photo.filePath, cloudUrl: photo.cloudUrl, count: 1 });
      } else {
        existing.count += 1;
        if (photo.type === "front") {
          existing.path = photo.filePath;
          existing.cloudUrl = photo.cloudUrl;
        }
      }
    }
  }

  let result: ItemListRow[] = rows.map(({ item, category }) => ({
    ...(item as Item),
    category: category as Category,
    coverPhotoPath: coverByItem.get(item.id)?.path ?? null,
    coverPhotoCloudUrl: coverByItem.get(item.id)?.cloudUrl ?? null,
    photoCount: coverByItem.get(item.id)?.count ?? 0,
  }));

  if (filter.missingPhotos) {
    result = result.filter((r) => r.photoCount === 0);
  }
  if (filter.missingInfo) {
    result = result.filter(
      (r) => !r.country || !r.year || !r.currentValue || r.condition === "unspecified"
    );
  }

  return result;
}

export async function distinctCountries(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ country: items.country })
    .from(items)
    .where(and(eq(items.isDeleted, false)));
  return rows.map((r) => r.country).filter((c): c is string => !!c).sort();
}

export interface DuplicateCheckInput {
  categoryKey: CategoryKey;
  name: string;
  setName?: string;
  year?: number;
  cardNumber?: string;
  catalogNumber?: string;
  serialNumber?: string;
  barcode?: string;
}

/**
 * Looks for a likely-duplicate existing item before a new one is created.
 *
 * Strong identifiers (serial number, barcode, card/catalog number) only
 * count as a match when they're equal on *both* sides — a unique serialed
 * item (e.g. a specific banknote) with no serial recorded is never confused
 * with one that has a different serial (spec: unique collectibles with
 * serial numbers are always separate items). When neither side has any
 * strong identifier, fall back to name + set + year as a softer signal for
 * mass-produced items (e.g. a Hot Wheels casting with no serial at all).
 */
export async function findPossibleDuplicate(input: DuplicateCheckInput): Promise<ItemListRow | null> {
  const nameNorm = input.name.trim().toLowerCase();
  if (!nameNorm) return null;

  const category = await categoryRowByKey(input.categoryKey);
  const candidates = await db
    .select()
    .from(items)
    .where(and(eq(items.categoryId, category.id), eq(items.isDeleted, false)));

  for (const row of candidates) {
    if (row.name.trim().toLowerCase() !== nameNorm) continue;

    if (input.serialNumber && row.serialNumber && input.serialNumber === row.serialNumber) {
      return { ...(row as Item), category: category as Category, coverPhotoPath: null, coverPhotoCloudUrl: null, photoCount: 0 };
    }
    if (input.barcode && row.barcode && input.barcode === row.barcode) {
      return { ...(row as Item), category: category as Category, coverPhotoPath: null, coverPhotoCloudUrl: null, photoCount: 0 };
    }
    if (input.cardNumber && row.cardNumber && input.cardNumber === row.cardNumber) {
      return { ...(row as Item), category: category as Category, coverPhotoPath: null, coverPhotoCloudUrl: null, photoCount: 0 };
    }
    if (input.catalogNumber && row.catalogNumber && input.catalogNumber === row.catalogNumber) {
      return { ...(row as Item), category: category as Category, coverPhotoPath: null, coverPhotoCloudUrl: null, photoCount: 0 };
    }

    const noStrongIdentifierEitherSide =
      !input.serialNumber &&
      !row.serialNumber &&
      !input.barcode &&
      !row.barcode &&
      !input.cardNumber &&
      !row.cardNumber &&
      !input.catalogNumber &&
      !row.catalogNumber;

    if (
      noStrongIdentifierEitherSide &&
      (input.setName ?? "") === (row.setName ?? "") &&
      (input.year ?? null) === row.year
    ) {
      return { ...(row as Item), category: category as Category, coverPhotoPath: null, coverPhotoCloudUrl: null, photoCount: 0 };
    }
  }

  return null;
}

export async function incrementQuantity(id: string, by: number = 1): Promise<void> {
  const row = await db.query.items.findFirst({ where: (i, { eq: eqOp }) => eqOp(i.id, id) });
  if (!row) throw new Error(`Item not found: ${id}`);
  await db
    .update(items)
    .set({ quantity: row.quantity + by, updatedAt: nowIso() })
    .where(eq(items.id, id));
}
