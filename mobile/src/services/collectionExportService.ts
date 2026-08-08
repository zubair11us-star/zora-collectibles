import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { listItems, createItem, CreateItemInput } from "@/db/repositories/itemsRepo";
import { CategoryKey, ItemCondition } from "@/types/models";
import { CATEGORY_META, CATEGORY_ORDER } from "@/types/categoryFields";
import { rowsToCsv, parseCsv } from "./csvUtils";

// Common, category-agnostic fields — the spreadsheet-friendly subset.
// Category-specific attributes (e.g. a Pokémon card's rarity) are only
// carried in the JSON export, which is full-fidelity.
export const EXPORT_FIELDS = [
  "name", "category", "subcategory", "description", "brand", "country", "manufacturer", "year", "series",
  "setName", "model", "catalogNumber", "cardNumber", "denomination", "currency", "serialNumber", "condition",
  "grade", "quantity", "purchaseDate", "purchasePrice", "purchaseCurrency", "currentValue", "currentValueCurrency",
  "sellingPrice", "storagePosition", "barcode", "qrCode", "notes",
] as const;

export type ExportField = (typeof EXPORT_FIELDS)[number];

async function shareFile(fileName: string, contents: string, mimeType: string): Promise<string> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: `Save ${fileName}` });
  }
  return file.uri;
}

export async function exportCollectionAsCsv(): Promise<string> {
  const items = await listItems();
  const rows = items.map((item) => ({
    name: item.name,
    category: item.category.name,
    subcategory: item.subcategory ?? "",
    description: item.description ?? "",
    brand: item.brand ?? "",
    country: item.country ?? "",
    manufacturer: item.manufacturer ?? "",
    year: item.year ?? "",
    series: item.series ?? "",
    setName: item.setName ?? "",
    model: item.model ?? "",
    catalogNumber: item.catalogNumber ?? "",
    cardNumber: item.cardNumber ?? "",
    denomination: item.denomination ?? "",
    currency: item.currency ?? "",
    serialNumber: item.serialNumber ?? "",
    condition: item.condition,
    grade: item.grade ?? "",
    quantity: item.quantity,
    purchaseDate: item.purchaseDate ?? "",
    purchasePrice: item.purchasePrice ?? "",
    purchaseCurrency: item.purchaseCurrency ?? "",
    currentValue: item.currentValue ?? "",
    currentValueCurrency: item.currentValueCurrency ?? "",
    sellingPrice: item.sellingPrice ?? "",
    storagePosition: item.storagePosition ?? "",
    barcode: item.barcode ?? "",
    qrCode: item.qrCode ?? "",
    notes: item.notes ?? "",
  }));
  const csv = rowsToCsv(["category", ...EXPORT_FIELDS.filter((f) => f !== "category")], rows);
  return shareFile(`zora-collection-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
}

export async function exportCollectionAsJson(): Promise<string> {
  const items = await listItems();
  const data = items.map((item) => ({
    name: item.name,
    category: item.category.key,
    subcategory: item.subcategory,
    description: item.description,
    brand: item.brand,
    country: item.country,
    manufacturer: item.manufacturer,
    year: item.year,
    series: item.series,
    setName: item.setName,
    model: item.model,
    catalogNumber: item.catalogNumber,
    cardNumber: item.cardNumber,
    denomination: item.denomination,
    currency: item.currency,
    serialNumber: item.serialNumber,
    condition: item.condition,
    grade: item.grade,
    quantity: item.quantity,
    purchaseDate: item.purchaseDate,
    purchasePrice: item.purchasePrice,
    purchaseCurrency: item.purchaseCurrency,
    currentValue: item.currentValue,
    currentValueCurrency: item.currentValueCurrency,
    sellingPrice: item.sellingPrice,
    storagePosition: item.storagePosition,
    barcode: item.barcode,
    qrCode: item.qrCode,
    notes: item.notes,
  }));
  return shareFile(
    `zora-collection-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(data, null, 2),
    "application/json"
  );
}

export interface PickedImportFile {
  fileName: string;
  isCsv: boolean;
  csvHeaders?: string[];
  csvRows?: Record<string, string>[];
  jsonRows?: Record<string, unknown>[];
}

export async function pickImportFile(): Promise<PickedImportFile | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ["text/csv", "application/json", "text/comma-separated-values"],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || picked.assets.length === 0) return null;

  const asset = picked.assets[0];
  const file = new File(asset.uri);
  const text = await file.text();
  const isCsv = asset.name.toLowerCase().endsWith(".csv") || !asset.name.toLowerCase().endsWith(".json");

  if (isCsv) {
    const { headers, rows } = parseCsv(text);
    return { fileName: asset.name, isCsv: true, csvHeaders: headers, csvRows: rows };
  }
  const jsonRows = JSON.parse(text);
  return { fileName: asset.name, isCsv: false, jsonRows: Array.isArray(jsonRows) ? jsonRows : [jsonRows] };
}

function resolveCategoryKey(value: string | undefined): CategoryKey {
  if (!value) return "other";
  const lower = value.trim().toLowerCase();
  const byKey = CATEGORY_ORDER.find((k) => k === lower);
  if (byKey) return byKey;
  const byName = CATEGORY_ORDER.find((k) => CATEGORY_META[k].name.toLowerCase() === lower);
  return byName ?? "other";
}

/** Converts one mapped row (already keyed by ExportField after column mapping) into a create-item input. */
function rowToCreateItemInput(row: Record<string, string | undefined>): CreateItemInput {
  return {
    categoryKey: resolveCategoryKey(row.category),
    name: row.name?.trim() || "Imported Item",
    subcategory: row.subcategory || undefined,
    description: row.description || undefined,
    brand: row.brand || undefined,
    country: row.country || undefined,
    manufacturer: row.manufacturer || undefined,
    year: row.year ? Number(row.year) : undefined,
    series: row.series || undefined,
    setName: row.setName || undefined,
    model: row.model || undefined,
    catalogNumber: row.catalogNumber || undefined,
    cardNumber: row.cardNumber || undefined,
    denomination: row.denomination || undefined,
    currency: row.currency || undefined,
    serialNumber: row.serialNumber || undefined,
    condition: (row.condition as ItemCondition) || "unspecified",
    grade: row.grade || undefined,
    quantity: row.quantity ? Number(row.quantity) : 1,
    purchaseDate: row.purchaseDate || undefined,
    purchasePrice: row.purchasePrice ? Number(row.purchasePrice) : undefined,
    purchaseCurrency: row.purchaseCurrency || undefined,
    currentValue: row.currentValue ? Number(row.currentValue) : undefined,
    currentValueCurrency: row.currentValueCurrency || undefined,
    sellingPrice: row.sellingPrice ? Number(row.sellingPrice) : undefined,
    storagePosition: row.storagePosition || undefined,
    barcode: row.barcode || undefined,
    qrCode: row.qrCode || undefined,
    identificationSource: "manual",
    notes: row.notes || undefined,
  };
}

/** Imports already column-mapped rows (CSV path) or raw JSON rows (JSON path, field names assumed to match ExportField already). */
export async function importRows(rows: Record<string, string | undefined>[]): Promise<number> {
  let count = 0;
  for (const row of rows) {
    await createItem(rowToCreateItemInput(row));
    count++;
  }
  return count;
}
