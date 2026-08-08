import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  subcategory: text("subcategory"),
  name: text("name").notNull(),
  description: text("description"),
  brand: text("brand"),
  country: text("country"),
  manufacturer: text("manufacturer"),
  year: integer("year"),
  series: text("series"),
  setName: text("set_name"),
  model: text("model"),
  catalogNumber: text("catalog_number"),
  cardNumber: text("card_number"),
  denomination: text("denomination"),
  currency: text("currency"),
  serialNumber: text("serial_number"),
  condition: text("condition").notNull().default("unspecified"),
  grade: text("grade"),
  quantity: integer("quantity").notNull().default(1),
  purchaseDate: text("purchase_date"),
  purchasePrice: real("purchase_price"),
  purchaseCurrency: text("purchase_currency"),
  currentValue: real("current_value"),
  currentValueCurrency: text("current_value_currency"),
  sellingPrice: real("selling_price"),
  locationId: text("location_id").references(() => locations.id),
  storageBoxId: text("storage_box_id").references(() => storageBoxes.id),
  storagePosition: text("storage_position"),
  barcode: text("barcode"),
  qrCode: text("qr_code"),
  identificationSource: text("identification_source").notNull().default("manual"),
  aiConfidence: real("ai_confidence"),
  saleStatus: text("sale_status").notNull().default("not_for_sale"),
  notes: text("notes"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const itemAttributes = sqliteTable("item_attributes", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("other"),
  filePath: text("file_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  cloudUrl: text("cloud_url"),
  width: integer("width"),
  height: integer("height"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at"),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  parentLocationId: text("parent_location_id"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const storageBoxes = sqliteTable("storage_boxes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  locationId: text("location_id").references(() => locations.id),
  description: text("description"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const valuations = sqliteTable("valuations", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  value: real("value").notNull(),
  currency: text("currency").notNull(),
  source: text("source").notNull().default("manual"),
  notes: text("notes"),
  updatedAt: text("updated_at"),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  date: text("date").notNull(),
  counterparty: text("counterparty"),
  price: real("price"),
  currency: text("currency"),
  quantity: integer("quantity").notNull().default(1),
  fees: real("fees"),
  shipping: real("shipping"),
  totalCost: real("total_cost"),
  netAmount: real("net_amount"),
  notes: text("notes"),
  updatedAt: text("updated_at"),
});

export const wishlists = sqliteTable("wishlists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: text("category_id").references(() => categories.id),
  desiredCondition: text("desired_condition").notNull().default("unspecified"),
  targetPrice: real("target_price"),
  targetCurrency: text("target_currency"),
  priority: text("priority").notNull().default("medium"),
  notes: text("notes"),
  linkedItemId: text("linked_item_id").references(() => items.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at"),
});

export const aiIdentifications = sqliteTable("ai_identifications", {
  id: text("id").primaryKey(),
  itemId: text("item_id").references(() => items.id, { onDelete: "cascade" }),
  categoryGuess: text("category_guess"),
  rawResponseJson: text("raw_response_json").notNull(),
  confidence: real("confidence").notNull(),
  possibleMatchesJson: text("possible_matches_json").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const exchangeRates = sqliteTable("exchange_rates", {
  currencyCode: text("currency_code").primaryKey(),
  rateToBase: real("rate_to_base").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});
